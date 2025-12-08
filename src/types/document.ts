/**
 * Document AI System Type Definitions
 *
 * Comprehensive type system for document upload, processing, chunking,
 * embedding, and retrieval.
 */

import { ObjectId } from 'mongodb';

// ============================================================================
// Document Types and Enums
// ============================================================================

/**
 * Supported document file types
 */
export enum DocumentType {
  PDF = 'pdf',
  DOCX = 'docx',
  DOC = 'doc',
  TXT = 'txt',
  MD = 'md',
  HTML = 'html',
  IMAGE = 'image', // For OCR processing
}

/**
 * Document processing status
 */
export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial', // Some chunks failed but others succeeded
}

/**
 * Document tags for categorization
 */
export enum DocumentTag {
  MAGICFILL = 'magicfill',
  RESEARCH = 'research',
  GENERAL = 'general',
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
  ACADEMIC = 'academic',
  PERSONAL = 'personal',
  WORK = 'work',
}

/**
 * Search modes
 */
export enum SearchMode {
  SEMANTIC = 'semantic', // Vector similarity search
  KEYWORD = 'keyword', // Text-based search
  HYBRID = 'hybrid', // Combination of both
  VISUAL = 'visual', // Image similarity search
}

// ============================================================================
// Core Document Interfaces
// ============================================================================

/**
 * File information captured during upload
 */
export interface FileInfo {
  originalName: string;
  mimeType: string;
  size: number; // in bytes
  extension: string;
  encoding?: string;
}

/**
 * Document metadata stored in MongoDB
 */
export interface DocumentMetadata {
  _id?: ObjectId;
  trackingId: string; // Unique identifier for the document
  userId: string; // User who uploaded the document
  fileName: string;
  fileHash: string; // SHA-256 hash for duplicate detection
  fileInfo: FileInfo;
  documentType: DocumentType;
  tags: DocumentTag[];
  uploadDate: Date;
  lastModified: Date;
  processingStatus: ProcessingStatus;

  // Storage information
  storagePath?: string; // Path to original file in storage
  storageProvider?: 'local' | 's3' | 'gcs'; // Storage backend

  // Processing metadata
  totalChunks: number;
  processedChunks: number;
  failedChunks: number;

  // OCR specific (for images)
  hasOcr: boolean;
  ocrConfidence?: number; // Average confidence score

  // Embedding information
  embeddingModel?: string; // Model used for embeddings
  embeddingDimensions?: number;

  // Additional metadata
  title?: string; // User-provided or extracted title
  description?: string;
  customMetadata?: Record<string, any>;

  // Error tracking
  errors?: ProcessingError[];
}

/**
 * Processing error information
 */
export interface ProcessingError {
  timestamp: Date;
  stage: 'upload' | 'chunking' | 'embedding' | 'ocr' | 'storage';
  error: string;
  details?: any;
}

// ============================================================================
// Document Chunk Interfaces
// ============================================================================

/**
 * Chunk metadata
 */
export interface ChunkMetadata {
  pageNumber?: number; // For PDFs
  position: number; // Sequential position in document
  startChar?: number; // Character position in original document
  endChar?: number;
  headings?: string[]; // Section headings if available
  imageData?: ImageMetadata; // For image chunks
  customMetadata?: Record<string, any>;
}

/**
 * Image-specific metadata
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  ocrText?: string;
  ocrConfidence?: number;
  visualEmbedding?: number[]; // For visual similarity search
}

/**
 * Document chunk stored in MongoDB vector collection
 */
export interface DocumentChunk {
  _id?: ObjectId;
  chunkId: string; // Unique identifier for the chunk
  trackingId: string; // References parent document
  userId: string; // For user isolation

  // Content
  content: string; // The actual text content
  contentHash: string; // Hash of the content

  // Vector embedding
  embedding: number[]; // Vector embedding for semantic search
  embeddingModel: string;

  // Metadata
  metadata: ChunkMetadata;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Tags inherited from parent document
  tags: DocumentTag[];
}

// ============================================================================
// Search Interfaces
// ============================================================================

/**
 * Search query parameters
 */
export interface SearchQuery {
  query: string; // Search query text
  userId: string; // User performing the search
  mode: SearchMode;

  // Filters
  trackingIds?: string[]; // Limit to specific documents
  tags?: DocumentTag[]; // Filter by tags
  dateRange?: {
    from?: Date;
    to?: Date;
  };

  // Search parameters
  topK?: number; // Number of results to return (default: 10)
  minScore?: number; // Minimum similarity score (0-1)

  // Pagination
  offset?: number;
  limit?: number;

  // Advanced options
  includeMetadata?: boolean;
  includeContent?: boolean;
  rerank?: boolean; // Apply reranking algorithm
}

/**
 * Individual search result
 */
export interface SearchResult {
  chunkId: string;
  trackingId: string;
  documentTitle?: string;
  content: string;
  score: number; // Similarity score (0-1)
  metadata: ChunkMetadata;
  highlights?: string[]; // Highlighted matched text

  // Document context
  documentMetadata?: Partial<DocumentMetadata>;
}

/**
 * Search response
 */
export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  query: string;
  searchMode: SearchMode;
  processingTime: number; // in milliseconds

  // Pagination
  hasMore: boolean;
  nextOffset?: number;
}

// ============================================================================
// Upload and Processing Interfaces
// ============================================================================

/**
 * Document upload request
 */
export interface UploadDocumentRequest {
  file: File | Buffer;
  fileName: string;
  tags?: DocumentTag[];
  title?: string;
  description?: string;
  customMetadata?: Record<string, any>;

  // Processing options
  chunkSize?: number; // Characters per chunk
  chunkOverlap?: number; // Overlap between chunks
  skipEmbedding?: boolean; // Skip embedding generation
  skipOcr?: boolean; // Skip OCR for images
}

/**
 * Document upload response
 */
export interface UploadDocumentResponse {
  success: boolean;
  trackingId: string;
  documentId: string;
  fileName: string;
  fileHash: string;
  isDuplicate: boolean; // True if file hash already exists
  processingStatus: ProcessingStatus;
  message?: string;

  // Processing info
  totalChunks?: number;
  estimatedProcessingTime?: number; // in seconds
}

/**
 * Document list item (for listing documents)
 */
export interface DocumentListItem {
  trackingId: string;
  documentId: string;
  fileName: string;
  documentType: DocumentType;
  tags: DocumentTag[];
  uploadDate: Date;
  lastModified: Date;
  processingStatus: ProcessingStatus;
  totalChunks: number;
  fileSize: number;
  title?: string;
  description?: string;
  hasOcr: boolean;
}

/**
 * Document list response
 */
export interface DocumentListResponse {
  documents: DocumentListItem[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// Embedding Interfaces
// ============================================================================

/**
 * Embedding generation request
 */
export interface GenerateEmbeddingRequest {
  text: string | string[];
  model?: string; // Embedding model to use
  normalize?: boolean; // Normalize vectors
}

/**
 * Embedding generation response
 */
export interface GenerateEmbeddingResponse {
  embeddings: number[][] | number[];
  model: string;
  dimensions: number;
  usage?: {
    tokens: number;
    cost?: number;
  };
}

// ============================================================================
// OCR Interfaces
// ============================================================================

/**
 * OCR extraction request
 */
export interface OcrExtractionRequest {
  image: File | Buffer | string; // Image file or base64 string
  language?: string; // OCR language (default: 'eng')
  enhanceImage?: boolean; // Apply image enhancement
}

/**
 * OCR extraction response
 */
export interface OcrExtractionResponse {
  text: string;
  confidence: number; // Overall confidence score (0-100)
  blocks?: OcrBlock[]; // Structured OCR output
  processingTime: number; // in milliseconds
}

/**
 * OCR text block
 */
export interface OcrBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  type?: 'paragraph' | 'line' | 'word';
}

// ============================================================================
// Chunking Configuration
// ============================================================================

/**
 * Chunking strategy configuration
 */
export interface ChunkingConfig {
  strategy: 'fixed' | 'semantic' | 'recursive' | 'paragraph';
  chunkSize: number; // Target size in characters/tokens
  chunkOverlap: number; // Overlap between chunks
  minChunkSize?: number; // Minimum chunk size
  maxChunkSize?: number; // Maximum chunk size

  // Advanced options
  respectParagraphs?: boolean; // Try to keep paragraphs together
  respectSentences?: boolean; // Don't split sentences
  customSeparators?: string[]; // Custom chunk separators
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string; // Only in development
  };
}

/**
 * Combined API response type
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Database Collection Names
// ============================================================================

/**
 * Get user-specific vector collection name
 * Pattern: vectors_<userId>
 */
export function getUserVectorCollection(userId: string): string {
  return `vectors_${userId}`;
}

/**
 * Get global documents metadata collection name
 */
export const DOCUMENTS_COLLECTION = 'documents_metadata';

/**
 * Get document processing queue collection name
 */
export const PROCESSING_QUEUE_COLLECTION = 'document_processing_queue';
