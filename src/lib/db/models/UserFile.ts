/**
 * User File Model for MongoDB
 * 
 * Stores file metadata, processing status, and references to embeddings
 */

import { ObjectId } from 'mongodb';

export interface UserFile {
  _id?: ObjectId;
  fileId: string; // Unique file identifier
  userId: string; // Owner of the file
  
  // File information
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number; // in bytes
  fileHash: string; // SHA-256 hash for deduplication
  
  // Storage
  storagePath: string; // Path in storage system
  storageProvider: 'local' | 's3' | 'azure' | 'gcs';
  
  // Document type and classification
  documentType: 'sop' | 'lor' | 'cv' | 'resume' | 'transcript' | 'certificate' | 'other';
  category: string[]; // ['application', 'academic', 'personal']
  tags: string[]; // User-defined tags
  
  // Processing status
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'not_needed';
  embeddingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Content extraction
  extractedText?: string; // Full text content
  textPreview?: string; // First 500 chars
  pageCount?: number; // For PDFs
  wordCount?: number;
  
  // OCR results (for scanned PDFs and images)
  ocrText?: string;
  ocrConfidence?: number; // 0-1 score
  ocrLanguage?: string;
  
  // Embeddings and ChromaDB
  embeddingCollection?: string; // ChromaDB collection name
  embeddingIds?: string[]; // IDs of chunks in ChromaDB
  chunkCount?: number; // Number of text chunks created
  
  // Metadata
  metadata: {
    author?: string;
    createdDate?: Date;
    modifiedDate?: Date;
    keywords?: string[];
    language?: string;
    [key: string]: any;
  };
  
  // Timestamps
  uploadedAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  processedAt?: Date;
  
  // Usage tracking
  accessCount: number;
  usedInDocuments?: string[]; // IDs of SOPs/LORs that used this file
  
  // Error tracking
  errors?: {
    stage: string;
    message: string;
    timestamp: Date;
  }[];
}

/**
 * MongoDB collection name for user files
 */
export const USER_FILES_COLLECTION = 'user_files';

/**
 * MongoDB indexes for efficient querying
 */
export const USER_FILES_INDEXES = [
  { key: { fileId: 1 }, unique: true },
  { key: { userId: 1, uploadedAt: -1 } },
  { key: { userId: 1, documentType: 1 } },
  { key: { fileHash: 1 } },
  { key: { processingStatus: 1 } },
  { key: { tags: 1 } },
  { key: { 'metadata.keywords': 1 } },
];

/**
 * Text chunk stored in ChromaDB
 */
export interface TextChunk {
  id: string; // Unique chunk ID
  fileId: string; // Reference to parent file
  userId: string;
  
  // Chunk content
  text: string;
  chunkIndex: number; // Position in document
  startPage?: number;
  endPage?: number;
  
  // Embedding (stored in ChromaDB)
  // embedding: number[]; // Vector representation
  
  // Metadata for filtering
  metadata: {
    fileName: string;
    documentType: string;
    tags: string[];
    source: string;
    [key: string]: any;
  };
}

/**
 * ChromaDB collection configuration
 */
export interface ChromaDBConfig {
  collectionName: string;
  embeddingModel: 'openai' | 'sentence-transformers' | 'huggingface';
  distance: 'cosine' | 'l2' | 'ip'; // Inner product
  dimensions: number; // 384, 768, 1536 depending on model
}
