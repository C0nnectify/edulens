/**
 * File Processing Service
 * 
 * Handles file upload, text extraction, OCR, and embedding generation
 */

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { UserFile, USER_FILES_COLLECTION, TextChunk } from '@/lib/db/models/UserFile';
import * as crypto from 'crypto';

/**
 * File processor service
 */
export class FileProcessingService {
  /**
   * Process uploaded file: extract text, perform OCR if needed, generate embeddings
   */
  static async processFile(
    file: File,
    userId: string,
    options: {
      documentType?: string;
      tags?: string[];
      generateEmbeddings?: boolean;
    } = {}
  ): Promise<UserFile> {
    const fileId = this.generateFileId();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileHash = this.calculateFileHash(fileBuffer);
    
    // Check for duplicates
    const existingFile = await this.findDuplicateFile(userId, fileHash);
    if (existingFile) {
      console.log('Duplicate file detected, returning existing file');
      return existingFile;
    }
    
    // Create initial file record
    const userFile: UserFile = {
      fileId,
      userId,
      fileName: file.name,
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      fileHash,
      storagePath: `uploads/${userId}/${fileId}`,
      storageProvider: 'local',
      documentType: (options.documentType as any) || 'other',
      category: this.determineCategory(file.name, file.type),
      tags: options.tags || [],
      processingStatus: 'pending',
      ocrStatus: 'pending',
      embeddingStatus: 'pending',
      metadata: {},
      uploadedAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0,
    };
    
    // Save to MongoDB
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<UserFile>(USER_FILES_COLLECTION);
    await collection.insertOne(userFile);
    
    // Start background processing
    this.processFileAsync(fileId, fileBuffer, file.type, options.generateEmbeddings !== false);
    
    return userFile;
  }
  
  /**
   * Background processing: text extraction, OCR, embeddings
   */
  private static async processFileAsync(
    fileId: string,
    fileBuffer: Buffer,
    mimeType: string,
    generateEmbeddings: boolean
  ): Promise<void> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<UserFile>(USER_FILES_COLLECTION);
      
      // Update status to processing
      await collection.updateOne(
        { fileId },
        { 
          $set: { 
            processingStatus: 'processing',
            updatedAt: new Date() 
          } 
        }
      );
      
      let extractedText = '';
      let ocrText: string | undefined;
      let needsOCR = false;
      
      // 1. Extract text based on file type
      if (mimeType === 'application/pdf') {
        const pdfResult = await this.extractTextFromPDF(fileBuffer);
        extractedText = pdfResult.text;
        needsOCR = pdfResult.needsOCR;
        
        // Perform OCR if PDF is image-based
        if (needsOCR) {
          await collection.updateOne(
            { fileId },
            { $set: { ocrStatus: 'processing' } }
          );
          
          ocrText = await this.performOCR(fileBuffer, 'pdf');
          extractedText = ocrText || extractedText;
          
          await collection.updateOne(
            { fileId },
            { 
              $set: { 
                ocrStatus: 'completed',
                ocrText,
                ocrConfidence: 0.85, // Placeholder
              } 
            }
          );
        } else {
          await collection.updateOne(
            { fileId },
            { $set: { ocrStatus: 'not_needed' } }
          );
        }
      } else if (mimeType.startsWith('image/')) {
        // Images always need OCR
        await collection.updateOne(
          { fileId },
          { $set: { ocrStatus: 'processing' } }
        );
        
        ocrText = await this.performOCR(fileBuffer, 'image');
        extractedText = ocrText || '';
        
        await collection.updateOne(
          { fileId },
          { 
            $set: { 
              ocrStatus: 'completed',
              ocrText,
            } 
          }
        );
      } else if (mimeType.includes('word') || mimeType.includes('document')) {
        extractedText = await this.extractTextFromWord(fileBuffer);
        await collection.updateOne(
          { fileId },
          { $set: { ocrStatus: 'not_needed' } }
        );
      } else {
        // Plain text
        extractedText = fileBuffer.toString('utf-8');
        await collection.updateOne(
          { fileId },
          { $set: { ocrStatus: 'not_needed' } }
        );
      }
      
      const wordCount = extractedText.split(/\s+/).length;
      const textPreview = extractedText.substring(0, 500);
      
      // 2. Generate embeddings if requested
      if (generateEmbeddings && extractedText.trim().length > 0) {
        await collection.updateOne(
          { fileId },
          { $set: { embeddingStatus: 'processing' } }
        );
        
        const embeddingResult = await this.generateEmbeddings(fileId, extractedText);
        
        await collection.updateOne(
          { fileId },
          { 
            $set: { 
              embeddingStatus: 'completed',
              embeddingCollection: embeddingResult.collectionName,
              embeddingIds: embeddingResult.chunkIds,
              chunkCount: embeddingResult.chunkCount,
            } 
          }
        );
      } else {
        await collection.updateOne(
          { fileId },
          { $set: { embeddingStatus: 'not_needed' } }
        );
      }
      
      // 3. Update file record with extracted content
      await collection.updateOne(
        { fileId },
        { 
          $set: { 
            processingStatus: 'completed',
            extractedText,
            textPreview,
            wordCount,
            processedAt: new Date(),
            updatedAt: new Date(),
          } 
        }
      );
      
    } catch (error) {
      console.error('File processing error:', error);
      
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<UserFile>(USER_FILES_COLLECTION);
      
      await collection.updateOne(
        { fileId },
        { 
          $set: { 
            processingStatus: 'failed',
            updatedAt: new Date(),
          },
          $push: {
            errors: {
              stage: 'processing',
              message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
            }
          }
        }
      );
    }
  }
  
  /**
   * Extract text from PDF
   */
  private static async extractTextFromPDF(buffer: Buffer): Promise<{ text: string; needsOCR: boolean }> {
    // Use pdf-parse or similar library
    // For now, call AI service endpoint
    try {
      const aiBase = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
      const formData = new FormData();
      formData.append('file', new Blob([buffer]), 'document.pdf');
      
      const response = await fetch(`${aiBase}/api/documents/extract-text`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          text: data.text || '',
          needsOCR: data.needs_ocr || false,
        };
      }
    } catch (error) {
      console.error('PDF text extraction error:', error);
    }
    
    return { text: '', needsOCR: true };
  }
  
  /**
   * Perform OCR on PDF or image
   */
  private static async performOCR(buffer: Buffer, fileType: 'pdf' | 'image'): Promise<string> {
    // Use Tesseract.js or call AI service OCR endpoint
    try {
      const aiBase = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
      const formData = new FormData();
      formData.append('file', new Blob([buffer]), `document.${fileType === 'pdf' ? 'pdf' : 'png'}`);
      
      const response = await fetch(`${aiBase}/api/documents/ocr`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.text || '';
      }
    } catch (error) {
      console.error('OCR error:', error);
    }
    
    return '';
  }
  
  /**
   * Extract text from Word document
   */
  private static async extractTextFromWord(buffer: Buffer): Promise<string> {
    // Use mammoth or similar library
    try {
      const aiBase = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
      const formData = new FormData();
      formData.append('file', new Blob([buffer]), 'document.docx');
      
      const response = await fetch(`${aiBase}/api/documents/extract-text`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.text || '';
      }
    } catch (error) {
      console.error('Word text extraction error:', error);
    }
    
    return '';
  }
  
  /**
   * Generate embeddings and store in ChromaDB
   */
  private static async generateEmbeddings(
    fileId: string,
    text: string
  ): Promise<{ collectionName: string; chunkIds: string[]; chunkCount: number }> {
    try {
      const aiBase = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
      
      const response = await fetch(`${aiBase}/api/embeddings/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
          text,
          chunk_size: 500,
          chunk_overlap: 50,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          collectionName: data.collection_name || 'user_documents',
          chunkIds: data.chunk_ids || [],
          chunkCount: data.chunk_count || 0,
        };
      }
    } catch (error) {
      console.error('Embedding generation error:', error);
    }
    
    return { collectionName: 'user_documents', chunkIds: [], chunkCount: 0 };
  }
  
  /**
   * Get file by ID
   */
  static async getFile(fileId: string, userId: string): Promise<UserFile | null> {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<UserFile>(USER_FILES_COLLECTION);
    
    const file = await collection.findOne({ fileId, userId });
    
    if (file) {
      // Update access tracking
      await collection.updateOne(
        { fileId },
        { 
          $set: { lastAccessedAt: new Date() },
          $inc: { accessCount: 1 }
        }
      );
    }
    
    return file;
  }
  
  /**
   * Get all files for a user
   */
  static async getUserFiles(
    userId: string,
    options: {
      limit?: number;
      skip?: number;
      documentType?: string;
      tags?: string[];
      sortBy?: 'uploadedAt' | 'fileName' | 'fileSize';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ files: UserFile[]; total: number }> {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<UserFile>(USER_FILES_COLLECTION);
    
    const filter: any = { userId };
    
    if (options.documentType) {
      filter.documentType = options.documentType;
    }
    
    if (options.tags && options.tags.length > 0) {
      filter.tags = { $in: options.tags };
    }
    
    const sortField = options.sortBy || 'uploadedAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
    
    const [files, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(options.skip || 0)
        .limit(options.limit || 50)
        .toArray(),
      collection.countDocuments(filter),
    ]);
    
    return { files, total };
  }
  
  /**
   * Delete file
   */
  static async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<UserFile>(USER_FILES_COLLECTION);
    
    const file = await collection.findOne({ fileId, userId });
    if (!file) return false;
    
    // Delete embeddings from ChromaDB if they exist
    if (file.embeddingIds && file.embeddingIds.length > 0) {
      await this.deleteEmbeddings(file.embeddingIds);
    }
    
    // Delete from MongoDB
    const result = await collection.deleteOne({ fileId, userId });
    
    // TODO: Delete physical file from storage
    
    return result.deletedCount > 0;
  }
  
  /**
   * Delete embeddings from ChromaDB
   */
  private static async deleteEmbeddings(embeddingIds: string[]): Promise<void> {
    try {
      const aiBase = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
      
      await fetch(`${aiBase}/api/embeddings/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: embeddingIds,
        }),
      });
    } catch (error) {
      console.error('Embedding deletion error:', error);
    }
  }
  
  /**
   * Search files using semantic search
   */
  static async searchFiles(
    userId: string,
    query: string,
    options: {
      limit?: number;
      documentType?: string;
      tags?: string[];
    } = {}
  ): Promise<UserFile[]> {
    try {
      const aiBase = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
      
      const response = await fetch(`${aiBase}/api/embeddings/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          query,
          limit: options.limit || 10,
          filters: {
            document_type: options.documentType,
            tags: options.tags,
          },
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const fileIds = data.results?.map((r: any) => r.file_id) || [];
        
        // Get full file records from MongoDB
        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<UserFile>(USER_FILES_COLLECTION);
        
        const files = await collection
          .find({ 
            fileId: { $in: fileIds },
            userId 
          })
          .toArray();
        
        return files;
      }
    } catch (error) {
      console.error('File search error:', error);
    }
    
    return [];
  }
  
  // Helper methods
  
  private static generateFileId(): string {
    return `file-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
  
  private static calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
  
  private static async findDuplicateFile(userId: string, fileHash: string): Promise<UserFile | null> {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<UserFile>(USER_FILES_COLLECTION);
    
    return await collection.findOne({ userId, fileHash });
  }
  
  private static determineCategory(fileName: string, mimeType: string): string[] {
    const categories: string[] = [];
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.includes('resume') || lowerName.includes('cv')) {
      categories.push('resume');
    }
    if (lowerName.includes('transcript')) {
      categories.push('academic');
    }
    if (lowerName.includes('certificate') || lowerName.includes('cert')) {
      categories.push('certificate');
    }
    if (lowerName.includes('sop') || lowerName.includes('statement')) {
      categories.push('application');
    }
    
    if (categories.length === 0) {
      categories.push('other');
    }
    
    return categories;
  }
}
