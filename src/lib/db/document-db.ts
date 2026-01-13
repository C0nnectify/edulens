/**
 * Document AI Database Layer
 *
 * MongoDB schema definitions and database operations for document management,
 * chunking, and vector storage.
 */

import { Collection, Db, Document, CreateIndexesOptions, IndexDescription } from 'mongodb';
import { getMongoClientPromise } from '@/lib/mongodb';
import type {
  DocumentMetadata,
  DocumentChunk,
  DOCUMENTS_COLLECTION,
  getUserVectorCollection,
} from '@/types/document';

// ============================================================================
// Database Connection
// ============================================================================

let cachedDb: Db | null = null;

/**
 * Get MongoDB database instance with caching
 */
export async function getDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await getMongoClientPromise();
  const db = client.db(process.env.MONGODB_DB_NAME || 'edulens');
  cachedDb = db;

  return db;
}

// ============================================================================
// Collection Accessors
// ============================================================================

/**
 * Get documents metadata collection
 */
export async function getDocumentsCollection(): Promise<Collection<DocumentMetadata>> {
  const db = await getDatabase();
  return db.collection<DocumentMetadata>('documents_metadata');
}

/**
 * Get user-specific vector chunks collection
 * Each user has their own collection for data isolation
 */
export async function getUserVectorCollection(userId: string): Promise<Collection<DocumentChunk>> {
  const db = await getDatabase();
  const collectionName = `vectors_${userId}`;
  return db.collection<DocumentChunk>(collectionName);
}

/**
 * Get processing queue collection
 */
export async function getProcessingQueueCollection(): Promise<Collection<Document>> {
  const db = await getDatabase();
  return db.collection('document_processing_queue');
}

// ============================================================================
// Index Definitions
// ============================================================================

/**
 * Create indexes for documents metadata collection
 */
export async function createDocumentMetadataIndexes(): Promise<void> {
  const collection = await getDocumentsCollection();

  const indexes: IndexDescription[] = [
    // Unique tracking ID
    {
      key: { trackingId: 1 },
      unique: true,
      name: 'trackingId_unique',
    },
    // User documents lookup
    {
      key: { userId: 1, uploadDate: -1 },
      name: 'userId_uploadDate',
    },
    // File hash for duplicate detection
    {
      key: { fileHash: 1, userId: 1 },
      name: 'fileHash_userId',
    },
    // Tag-based filtering
    {
      key: { tags: 1, userId: 1 },
      name: 'tags_userId',
    },
    // Processing status monitoring
    {
      key: { processingStatus: 1, uploadDate: -1 },
      name: 'processingStatus_uploadDate',
    },
    // Full text search on title and description
    {
      key: { title: 'text', description: 'text', fileName: 'text' },
      name: 'text_search',
    },
  ];

  await collection.createIndexes(indexes);
  console.log('✓ Document metadata indexes created');
}

/**
 * Create indexes for vector chunks collection
 * Note: Vector search indexes need to be created via MongoDB Atlas UI or mongosh
 */
export async function createVectorChunkIndexes(userId: string): Promise<void> {
  const collection = await getUserVectorCollection(userId);

  const indexes: IndexDescription[] = [
    // Chunk ID lookup
    {
      key: { chunkId: 1 },
      unique: true,
      name: 'chunkId_unique',
    },
    // Document chunks lookup
    {
      key: { trackingId: 1, 'metadata.position': 1 },
      name: 'trackingId_position',
    },
    // User isolation
    {
      key: { userId: 1 },
      name: 'userId',
    },
    // Tag-based filtering for chunks
    {
      key: { tags: 1 },
      name: 'tags',
    },
    // Created date for sorting
    {
      key: { createdAt: -1 },
      name: 'createdAt',
    },
    // Content hash for duplicate detection
    {
      key: { contentHash: 1 },
      name: 'contentHash',
    },
  ];

  await collection.createIndexes(indexes);
  console.log(`✓ Vector chunk indexes created for user: ${userId}`);
}

/**
 * Create vector search index (Atlas Search)
 * This is a JSON definition - needs to be created via Atlas UI or API
 */
export function getVectorSearchIndexDefinition(collectionName: string) {
  return {
    name: 'vector_index',
    type: 'vectorSearch',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 1536, // OpenAI ada-002 or similar
          similarity: 'cosine', // or 'euclidean', 'dotProduct'
        },
        {
          type: 'filter',
          path: 'userId',
        },
        {
          type: 'filter',
          path: 'trackingId',
        },
        {
          type: 'filter',
          path: 'tags',
        },
      ],
    },
  };
}

// ============================================================================
// Schema Validation
// ============================================================================

/**
 * JSON Schema for document metadata validation
 */
export const documentMetadataSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'trackingId',
      'userId',
      'fileName',
      'fileHash',
      'fileInfo',
      'documentType',
      'tags',
      'uploadDate',
      'processingStatus',
    ],
    properties: {
      trackingId: {
        bsonType: 'string',
        description: 'Unique tracking identifier for the document',
      },
      userId: {
        bsonType: 'string',
        description: 'User ID who owns the document',
      },
      fileName: {
        bsonType: 'string',
        description: 'Original file name',
      },
      fileHash: {
        bsonType: 'string',
        description: 'SHA-256 hash of file content',
      },
      fileInfo: {
        bsonType: 'object',
        required: ['originalName', 'mimeType', 'size', 'extension'],
        properties: {
          originalName: { bsonType: 'string' },
          mimeType: { bsonType: 'string' },
          size: { bsonType: 'number' },
          extension: { bsonType: 'string' },
          encoding: { bsonType: 'string' },
        },
      },
      documentType: {
        bsonType: 'string',
        enum: ['pdf', 'docx', 'doc', 'txt', 'md', 'html', 'image'],
      },
      tags: {
        bsonType: 'array',
        items: {
          bsonType: 'string',
        },
      },
      processingStatus: {
        bsonType: 'string',
        enum: ['pending', 'processing', 'completed', 'failed', 'partial'],
      },
      totalChunks: {
        bsonType: 'number',
        minimum: 0,
      },
      processedChunks: {
        bsonType: 'number',
        minimum: 0,
      },
      failedChunks: {
        bsonType: 'number',
        minimum: 0,
      },
      hasOcr: {
        bsonType: 'bool',
      },
    },
  },
};

/**
 * JSON Schema for document chunk validation
 */
export const documentChunkSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'chunkId',
      'trackingId',
      'userId',
      'content',
      'contentHash',
      'embedding',
      'embeddingModel',
      'metadata',
      'createdAt',
      'tags',
    ],
    properties: {
      chunkId: {
        bsonType: 'string',
        description: 'Unique chunk identifier',
      },
      trackingId: {
        bsonType: 'string',
        description: 'Reference to parent document',
      },
      userId: {
        bsonType: 'string',
        description: 'User ID for data isolation',
      },
      content: {
        bsonType: 'string',
        description: 'Chunk text content',
      },
      contentHash: {
        bsonType: 'string',
        description: 'Hash of chunk content',
      },
      embedding: {
        bsonType: 'array',
        description: 'Vector embedding',
        items: {
          bsonType: 'double',
        },
      },
      embeddingModel: {
        bsonType: 'string',
        description: 'Model used for embedding',
      },
      metadata: {
        bsonType: 'object',
        required: ['position'],
        properties: {
          position: { bsonType: 'number' },
          pageNumber: { bsonType: 'number' },
          startChar: { bsonType: 'number' },
          endChar: { bsonType: 'number' },
          headings: {
            bsonType: 'array',
            items: { bsonType: 'string' },
          },
        },
      },
      tags: {
        bsonType: 'array',
        items: { bsonType: 'string' },
      },
    },
  },
};

/**
 * Create collection with validation schema
 */
export async function createDocumentCollections(): Promise<void> {
  const db = await getDatabase();

  try {
    // Create documents metadata collection with validation
    await db.createCollection('documents_metadata', {
      validator: documentMetadataSchema,
      validationLevel: 'moderate', // Allow updates to missing fields
      validationAction: 'error', // Reject invalid documents
    });
    console.log('✓ Documents metadata collection created');
  } catch (error: any) {
    if (error.codeName === 'NamespaceExists') {
      console.log('Documents metadata collection already exists');
    } else {
      throw error;
    }
  }

  // Create indexes
  await createDocumentMetadataIndexes();
}

/**
 * Initialize user's vector collection
 */
export async function initializeUserVectorCollection(userId: string): Promise<void> {
  const db = await getDatabase();
  const collectionName = `vectors_${userId}`;

  try {
    // Create user's vector collection with validation
    await db.createCollection(collectionName, {
      validator: documentChunkSchema,
      validationLevel: 'moderate',
      validationAction: 'error',
    });
    console.log(`✓ Vector collection created for user: ${userId}`);
  } catch (error: any) {
    if (error.codeName === 'NamespaceExists') {
      console.log(`Vector collection already exists for user: ${userId}`);
    } else {
      throw error;
    }
  }

  // Create indexes
  await createVectorChunkIndexes(userId);
}

// ============================================================================
// Database Utilities
// ============================================================================

/**
 * Check if a user's vector collection exists
 */
export async function userVectorCollectionExists(userId: string): Promise<boolean> {
  const db = await getDatabase();
  const collections = await db.listCollections({ name: `vectors_${userId}` }).toArray();
  return collections.length > 0;
}

/**
 * Get collection size and statistics
 */
export async function getCollectionStats(collectionName: string) {
  const db = await getDatabase();
  const stats = await db.command({ collStats: collectionName });
  return {
    count: stats.count,
    size: stats.size,
    avgObjSize: stats.avgObjSize,
    storageSize: stats.storageSize,
    indexes: stats.nindexes,
  };
}

/**
 * Clean up old/orphaned data
 */
export async function cleanupOrphanedChunks(userId: string): Promise<number> {
  const vectorCollection = await getUserVectorCollection(userId);
  const documentsCollection = await getDocumentsCollection();

  // Get all tracking IDs from user's documents
  const validTrackingIds = await documentsCollection
    .find({ userId }, { projection: { trackingId: 1 } })
    .map(doc => doc.trackingId)
    .toArray();

  // Delete chunks that don't have a parent document
  const result = await vectorCollection.deleteMany({
    userId,
    trackingId: { $nin: validTrackingIds },
  });

  return result.deletedCount;
}

/**
 * Initialize all database collections and indexes
 * Should be run on application startup or via migration script
 */
export async function initializeDatabase(): Promise<void> {
  console.log('Initializing document AI database...');

  await createDocumentCollections();

  console.log('✓ Database initialization complete');
}
