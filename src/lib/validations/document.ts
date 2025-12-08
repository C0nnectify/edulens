/**
 * Document AI Validation Schemas
 *
 * Zod schemas for request validation and type safety.
 */

import { z } from 'zod';
import { DocumentTag, DocumentType, SearchMode } from '@/types/document';

// ============================================================================
// Document Upload Validation
// ============================================================================

/**
 * File upload schema
 */
export const uploadDocumentSchema = z.object({
  fileName: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name too long')
    .regex(/^[^<>:"|?*\x00-\x1F]+$/, 'File name contains invalid characters'),

  tags: z
    .array(z.nativeEnum(DocumentTag))
    .optional()
    .default([DocumentTag.GENERAL]),

  title: z
    .string()
    .max(200, 'Title too long')
    .optional(),

  description: z
    .string()
    .max(1000, 'Description too long')
    .optional(),

  customMetadata: z
    .record(z.any())
    .optional(),

  // Processing options
  chunkSize: z
    .number()
    .int()
    .min(100, 'Chunk size must be at least 100 characters')
    .max(5000, 'Chunk size must not exceed 5000 characters')
    .optional()
    .default(1000),

  chunkOverlap: z
    .number()
    .int()
    .min(0)
    .max(1000, 'Chunk overlap too large')
    .optional()
    .default(200),

  skipEmbedding: z
    .boolean()
    .optional()
    .default(false),

  skipOcr: z
    .boolean()
    .optional()
    .default(false),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

// ============================================================================
// Search Validation
// ============================================================================

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(500, 'Search query too long'),

  mode: z
    .nativeEnum(SearchMode)
    .optional()
    .default(SearchMode.HYBRID),

  // Filters
  trackingIds: z
    .array(z.string())
    .optional(),

  tags: z
    .array(z.nativeEnum(DocumentTag))
    .optional(),

  dateRange: z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .optional(),

  // Search parameters
  topK: z
    .number()
    .int()
    .min(1, 'Must return at least 1 result')
    .max(100, 'Cannot return more than 100 results')
    .optional()
    .default(10),

  minScore: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.5),

  // Pagination
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),

  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10),

  // Options
  includeMetadata: z
    .boolean()
    .optional()
    .default(true),

  includeContent: z
    .boolean()
    .optional()
    .default(true),

  rerank: z
    .boolean()
    .optional()
    .default(false),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

// ============================================================================
// Document List Validation
// ============================================================================

/**
 * Document list query schema
 */
export const documentListQuerySchema = z.object({
  tags: z
    .array(z.nativeEnum(DocumentTag))
    .optional(),

  documentType: z
    .nativeEnum(DocumentType)
    .optional(),

  processingStatus: z
    .enum(['pending', 'processing', 'completed', 'failed', 'partial'])
    .optional(),

  search: z
    .string()
    .max(200)
    .optional(),

  // Date filters
  uploadedAfter: z
    .coerce.date()
    .optional(),

  uploadedBefore: z
    .coerce.date()
    .optional(),

  // Sorting
  sortBy: z
    .enum(['uploadDate', 'lastModified', 'fileName', 'fileSize'])
    .optional()
    .default('uploadDate'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),

  // Pagination
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),

  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20),
});

export type DocumentListQueryInput = z.infer<typeof documentListQuerySchema>;

// ============================================================================
// Document Update Validation
// ============================================================================

/**
 * Document update schema
 */
export const updateDocumentSchema = z.object({
  title: z
    .string()
    .max(200, 'Title too long')
    .optional(),

  description: z
    .string()
    .max(1000, 'Description too long')
    .optional(),

  tags: z
    .array(z.nativeEnum(DocumentTag))
    .optional(),

  customMetadata: z
    .record(z.any())
    .optional(),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

// ============================================================================
// Embedding Generation Validation
// ============================================================================

/**
 * Embedding generation schema
 */
export const generateEmbeddingSchema = z.object({
  text: z
    .union([
      z.string().min(1, 'Text cannot be empty'),
      z.array(z.string().min(1, 'Text cannot be empty')),
    ])
    .refine(
      (data) => {
        if (Array.isArray(data)) {
          return data.length > 0 && data.length <= 100;
        }
        return true;
      },
      {
        message: 'Array must contain 1-100 items',
      }
    ),

  model: z
    .string()
    .optional(),

  normalize: z
    .boolean()
    .optional()
    .default(true),
});

export type GenerateEmbeddingInput = z.infer<typeof generateEmbeddingSchema>;

// ============================================================================
// OCR Extraction Validation
// ============================================================================

/**
 * OCR extraction schema
 */
export const ocrExtractionSchema = z.object({
  language: z
    .string()
    .length(3, 'Language code must be 3 characters (ISO 639-2)')
    .optional()
    .default('eng'),

  enhanceImage: z
    .boolean()
    .optional()
    .default(true),
});

export type OcrExtractionInput = z.infer<typeof ocrExtractionSchema>;

// ============================================================================
// Chunking Configuration Validation
// ============================================================================

/**
 * Chunking configuration schema
 */
export const chunkingConfigSchema = z.object({
  strategy: z
    .enum(['fixed', 'semantic', 'recursive', 'paragraph'])
    .optional()
    .default('recursive'),

  chunkSize: z
    .number()
    .int()
    .min(100)
    .max(5000)
    .optional()
    .default(1000),

  chunkOverlap: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .optional()
    .default(200),

  minChunkSize: z
    .number()
    .int()
    .min(50)
    .optional()
    .default(100),

  maxChunkSize: z
    .number()
    .int()
    .min(500)
    .optional()
    .default(2000),

  respectParagraphs: z
    .boolean()
    .optional()
    .default(true),

  respectSentences: z
    .boolean()
    .optional()
    .default(true),

  customSeparators: z
    .array(z.string())
    .optional(),
});

export type ChunkingConfigInput = z.infer<typeof chunkingConfigSchema>;

// ============================================================================
// Document ID Validation
// ============================================================================

/**
 * Document ID parameter schema
 */
export const documentIdSchema = z.object({
  id: z
    .string()
    .regex(/^[a-f0-9]{24}$/, 'Invalid document ID format'),
});

export const trackingIdSchema = z.object({
  trackingId: z
    .string()
    .regex(/^doc_\d+_[a-f0-9]{16}$/, 'Invalid tracking ID format'),
});

// ============================================================================
// Utility Validation Functions
// ============================================================================

/**
 * Validate and parse request body
 */
export function validateRequestBody<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validate request body and return safe parse result
 */
export function safeValidateRequestBody<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map(
    err => `${err.path.join('.')}: ${err.message}`
  );

  return { success: false, errors };
}

/**
 * Create validation middleware for API routes
 */
export function createValidationMiddleware<T extends z.ZodType>(schema: T) {
  return (data: unknown): z.infer<T> => {
    return validateRequestBody(schema, data);
  };
}
