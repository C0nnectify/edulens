/**
 * Document Processing Service
 *
 * Main service for processing documents: upload, chunking, embedding, OCR.
 * Orchestrates the entire document processing pipeline.
 */

import {
  DocumentType,
  ProcessingStatus,
  DocumentTag,
  type DocumentMetadata,
  type DocumentChunk,
  type UploadDocumentRequest,
  type UploadDocumentResponse,
  type ChunkingConfig,
} from '@/types/document';

import {
  getDocumentsCollection,
  getUserVectorCollection,
  userVectorCollectionExists,
  initializeUserVectorCollection,
} from '@/lib/db/document-db';

import {
  calculateFileHash,
  calculateContentHash,
  generateTrackingId,
  generateChunkId,
  extractFileInfo,
  validateFile,
  determineDocumentType,
  isImageType,
} from './file-utils';

import { chunkText, DEFAULT_CHUNKING_CONFIG } from './chunking';
import { EmbeddingService } from './embedding-service';
import { OcrService } from './ocr-service';

// ============================================================================
// Document Processor Class
// ============================================================================

export class DocumentProcessor {
  private embeddingService: EmbeddingService;
  private ocrService: OcrService;

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.ocrService = new OcrService();
  }

  /**
   * Process uploaded document
   * Main entry point for document processing pipeline
   */
  async processDocument(
    userId: string,
    fileBuffer: Buffer,
    request: UploadDocumentRequest
  ): Promise<UploadDocumentResponse> {
    const startTime = Date.now();

    try {
      // Extract file info
      const fileInfo = extractFileInfo(
        request.fileName,
        this.detectMimeType(fileBuffer, request.fileName),
        fileBuffer.length
      );

      // Validate file
      const validation = validateFile(fileInfo);
      if (!validation.valid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      const documentType = validation.documentType!;

      // Calculate file hash
      const fileHash = calculateFileHash(fileBuffer);

      // Check for duplicate
      const isDuplicate = await this.checkDuplicate(userId, fileHash);

      // Generate tracking ID
      const trackingId = generateTrackingId();

      // Extract text content
      let textContent = await this.extractTextContent(
        fileBuffer,
        documentType,
        request.skipOcr || false
      );

      if (!textContent.trim()) {
        throw new Error('No text content could be extracted from the document');
      }

      // Create document metadata
      const metadata: DocumentMetadata = {
        trackingId,
        userId,
        fileName: request.fileName,
        fileHash,
        fileInfo,
        documentType,
        tags: request.tags || [DocumentTag.GENERAL],
        uploadDate: new Date(),
        lastModified: new Date(),
        processingStatus: ProcessingStatus.PROCESSING,
        totalChunks: 0,
        processedChunks: 0,
        failedChunks: 0,
        hasOcr: isImageType(documentType),
        title: request.title,
        description: request.description,
        customMetadata: request.customMetadata,
      };

      // Save document metadata
      const documentsCollection = await getDocumentsCollection();
      const insertResult = await documentsCollection.insertOne(metadata);
      const documentId = insertResult.insertedId.toString();

      // Process in background if not skipping embedding
      if (!request.skipEmbedding) {
        // Process asynchronously
        this.processDocumentAsync(
          userId,
          trackingId,
          textContent,
          metadata,
          request
        ).catch(error => {
          console.error('Background processing error:', error);
          this.markProcessingFailed(trackingId, error);
        });
      } else {
        // Mark as completed if skipping embedding
        await documentsCollection.updateOne(
          { trackingId },
          {
            $set: {
              processingStatus: ProcessingStatus.COMPLETED,
              lastModified: new Date(),
            },
          }
        );
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        trackingId,
        documentId,
        fileName: request.fileName,
        fileHash,
        isDuplicate,
        processingStatus: request.skipEmbedding
          ? ProcessingStatus.COMPLETED
          : ProcessingStatus.PROCESSING,
        message: request.skipEmbedding
          ? 'Document uploaded successfully'
          : 'Document uploaded and processing in background',
      };
    } catch (error: any) {
      console.error('Document processing error:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  /**
   * Process document asynchronously (chunking + embedding)
   */
  private async processDocumentAsync(
    userId: string,
    trackingId: string,
    textContent: string,
    metadata: DocumentMetadata,
    request: UploadDocumentRequest
  ): Promise<void> {
    try {
      // Ensure user's vector collection exists
      const collectionExists = await userVectorCollectionExists(userId);
      if (!collectionExists) {
        await initializeUserVectorCollection(userId);
      }

      // Chunk the text
      const chunkingConfig: ChunkingConfig = {
        ...DEFAULT_CHUNKING_CONFIG,
        chunkSize: request.chunkSize || DEFAULT_CHUNKING_CONFIG.chunkSize,
        chunkOverlap: request.chunkOverlap || DEFAULT_CHUNKING_CONFIG.chunkOverlap,
      };

      const chunks = chunkText(textContent, chunkingConfig);

      // Update total chunks
      const documentsCollection = await getDocumentsCollection();
      await documentsCollection.updateOne(
        { trackingId },
        {
          $set: {
            totalChunks: chunks.length,
            lastModified: new Date(),
          },
        }
      );

      // Generate embeddings in batches
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await this.embeddingService.batchGenerateEmbeddings(
        chunkTexts,
        {
          batchSize: 50,
          onProgress: async (progress) => {
            console.log(`Embedding progress for ${trackingId}: ${progress.toFixed(1)}%`);
          },
        }
      );

      // Create document chunks with embeddings
      const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        chunkId: generateChunkId(trackingId, index),
        trackingId,
        userId,
        content: chunk.content,
        contentHash: calculateContentHash(chunk.content),
        embedding: embeddings[index],
        embeddingModel: 'text-embedding-3-small', // TODO: Make configurable
        metadata: chunk.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: metadata.tags,
      }));

      // Insert chunks into user's vector collection
      const vectorCollection = await getUserVectorCollection(userId);
      await vectorCollection.insertMany(documentChunks);

      // Update processing status
      await documentsCollection.updateOne(
        { trackingId },
        {
          $set: {
            processingStatus: ProcessingStatus.COMPLETED,
            processedChunks: chunks.length,
            lastModified: new Date(),
            embeddingModel: 'text-embedding-3-small',
            embeddingDimensions: embeddings[0].length,
          },
        }
      );

      console.log(`✓ Document ${trackingId} processed successfully`);
    } catch (error: any) {
      console.error(`Document processing failed for ${trackingId}:`, error);
      await this.markProcessingFailed(trackingId, error);
      throw error;
    }
  }

  /**
   * Extract text content from document
   */
  private async extractTextContent(
    buffer: Buffer,
    documentType: DocumentType,
    skipOcr: boolean
  ): Promise<string> {
    switch (documentType) {
      case DocumentType.PDF:
        return this.extractTextFromPDF(buffer);

      case DocumentType.DOCX:
        return this.extractTextFromDOCX(buffer);

      case DocumentType.TXT:
      case DocumentType.MD:
      case DocumentType.HTML:
        return buffer.toString('utf-8');

      case DocumentType.IMAGE:
        if (skipOcr) {
          throw new Error('Cannot extract text from image without OCR');
        }
        return this.extractTextFromImage(buffer);

      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(buffer);
      return data.text;
    } catch (error: any) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX
   */
  private async extractTextFromDOCX(buffer: Buffer): Promise<string> {
    try {
      // TODO: Implement DOCX text extraction
      // Use mammoth or docx libraries
      throw new Error('DOCX extraction not yet implemented');
    } catch (error: any) {
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  /**
   * Extract text from image using OCR
   */
  private async extractTextFromImage(buffer: Buffer): Promise<string> {
    try {
      const result = await this.ocrService.extractText({
        image: buffer,
        language: 'eng',
        enhanceImage: true,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error('No text found in image');
      }

      return result.text;
    } catch (error: any) {
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }

  /**
   * Check if document with same hash already exists
   */
  private async checkDuplicate(userId: string, fileHash: string): Promise<boolean> {
    const documentsCollection = await getDocumentsCollection();
    const existing = await documentsCollection.findOne({ userId, fileHash });
    return existing !== null;
  }

  /**
   * Mark document processing as failed
   */
  private async markProcessingFailed(
    trackingId: string,
    error: Error
  ): Promise<void> {
    const documentsCollection = await getDocumentsCollection();
    await documentsCollection.updateOne(
      { trackingId },
      {
        $set: {
          processingStatus: ProcessingStatus.FAILED,
          lastModified: new Date(),
        },
        $push: {
          errors: {
            timestamp: new Date(),
            stage: 'processing',
            error: error.message,
            details: error.stack,
          },
        },
      }
    );
  }

  /**
   * Detect MIME type from buffer
   */
  private detectMimeType(buffer: Buffer, fileName: string): string {
    // Check file signature
    if (buffer.length >= 4) {
      const signature = buffer.slice(0, 4);

      if (signature[0] === 0x25 && signature[1] === 0x50) {
        return 'application/pdf';
      }
      if (signature[0] === 0x50 && signature[1] === 0x4b) {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      if (signature[0] === 0x89 && signature[1] === 0x50) {
        return 'image/png';
      }
      if (signature[0] === 0xff && signature[1] === 0xd8) {
        return 'image/jpeg';
      }
    }

    // Fall back to extension-based detection
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.html': 'text/html',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.ocrService.cleanup();
  }
}

// ============================================================================
// Export Default Instance
// ============================================================================

/**
 * Default document processor instance
 */
export const defaultDocumentProcessor = new DocumentProcessor();
