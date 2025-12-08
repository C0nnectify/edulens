/**
 * File Processing Utilities
 *
 * Utilities for file hashing, type detection, validation, and processing.
 */

import crypto from 'crypto';
import { DocumentType, FileInfo } from '@/types/document';

// ============================================================================
// File Type Detection
// ============================================================================

/**
 * MIME type mappings
 */
const MIME_TYPE_MAP: Record<string, DocumentType> = {
  'application/pdf': DocumentType.PDF,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': DocumentType.DOCX,
  'application/msword': DocumentType.DOC,
  'text/plain': DocumentType.TXT,
  'text/markdown': DocumentType.MD,
  'text/html': DocumentType.HTML,
  'image/jpeg': DocumentType.IMAGE,
  'image/jpg': DocumentType.IMAGE,
  'image/png': DocumentType.IMAGE,
  'image/gif': DocumentType.IMAGE,
  'image/webp': DocumentType.IMAGE,
  'image/tiff': DocumentType.IMAGE,
};

/**
 * File extension mappings
 */
const EXTENSION_MAP: Record<string, DocumentType> = {
  '.pdf': DocumentType.PDF,
  '.docx': DocumentType.DOCX,
  '.doc': DocumentType.DOC,
  '.txt': DocumentType.TXT,
  '.md': DocumentType.MD,
  '.markdown': DocumentType.MD,
  '.html': DocumentType.HTML,
  '.htm': DocumentType.HTML,
  '.jpg': DocumentType.IMAGE,
  '.jpeg': DocumentType.IMAGE,
  '.png': DocumentType.IMAGE,
  '.gif': DocumentType.IMAGE,
  '.webp': DocumentType.IMAGE,
  '.tiff': DocumentType.IMAGE,
  '.tif': DocumentType.IMAGE,
};

/**
 * Get document type from MIME type
 */
export function getDocumentTypeFromMime(mimeType: string): DocumentType | null {
  return MIME_TYPE_MAP[mimeType.toLowerCase()] || null;
}

/**
 * Get document type from file extension
 */
export function getDocumentTypeFromExtension(filename: string): DocumentType | null {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return EXTENSION_MAP[extension] || null;
}

/**
 * Determine document type from file info
 */
export function determineDocumentType(mimeType: string, filename: string): DocumentType {
  // Try MIME type first
  const typeFromMime = getDocumentTypeFromMime(mimeType);
  if (typeFromMime) {
    return typeFromMime;
  }

  // Fall back to extension
  const typeFromExtension = getDocumentTypeFromExtension(filename);
  if (typeFromExtension) {
    return typeFromExtension;
  }

  // Default to TXT for unknown types
  return DocumentType.TXT;
}

/**
 * Check if document type is an image
 */
export function isImageType(documentType: DocumentType): boolean {
  return documentType === DocumentType.IMAGE;
}

/**
 * Check if file type is supported
 */
export function isSupportedFileType(mimeType: string, filename: string): boolean {
  return (
    getDocumentTypeFromMime(mimeType) !== null ||
    getDocumentTypeFromExtension(filename) !== null
  );
}

// ============================================================================
// File Validation
// ============================================================================

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  [DocumentType.PDF]: 50 * 1024 * 1024, // 50 MB
  [DocumentType.DOCX]: 25 * 1024 * 1024, // 25 MB
  [DocumentType.DOC]: 25 * 1024 * 1024, // 25 MB
  [DocumentType.TXT]: 10 * 1024 * 1024, // 10 MB
  [DocumentType.MD]: 10 * 1024 * 1024, // 10 MB
  [DocumentType.HTML]: 10 * 1024 * 1024, // 10 MB
  [DocumentType.IMAGE]: 20 * 1024 * 1024, // 20 MB
};

/**
 * Validate file size
 */
export function validateFileSize(size: number, documentType: DocumentType): {
  valid: boolean;
  error?: string;
} {
  const limit = FILE_SIZE_LIMITS[documentType];

  if (size > limit) {
    return {
      valid: false,
      error: `File size ${formatBytes(size)} exceeds limit of ${formatBytes(limit)} for ${documentType} files`,
    };
  }

  return { valid: true };
}

/**
 * Validate file name
 */
export function validateFileName(fileName: string): {
  valid: boolean;
  error?: string;
} {
  // Check for empty name
  if (!fileName || fileName.trim().length === 0) {
    return { valid: false, error: 'File name cannot be empty' };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1F]/g;
  if (invalidChars.test(fileName)) {
    return {
      valid: false,
      error: 'File name contains invalid characters',
    };
  }

  // Check length
  if (fileName.length > 255) {
    return {
      valid: false,
      error: 'File name is too long (max 255 characters)',
    };
  }

  return { valid: true };
}

/**
 * Comprehensive file validation
 */
export function validateFile(fileInfo: FileInfo): {
  valid: boolean;
  errors: string[];
  documentType?: DocumentType;
} {
  const errors: string[] = [];

  // Validate file name
  const nameValidation = validateFileName(fileInfo.originalName);
  if (!nameValidation.valid && nameValidation.error) {
    errors.push(nameValidation.error);
  }

  // Check if file type is supported
  if (!isSupportedFileType(fileInfo.mimeType, fileInfo.originalName)) {
    errors.push(
      `Unsupported file type: ${fileInfo.mimeType}. Supported types: PDF, DOCX, DOC, TXT, MD, HTML, Images`
    );
  }

  // Determine document type
  const documentType = determineDocumentType(fileInfo.mimeType, fileInfo.originalName);

  // Validate file size
  const sizeValidation = validateFileSize(fileInfo.size, documentType);
  if (!sizeValidation.valid && sizeValidation.error) {
    errors.push(sizeValidation.error);
  }

  return {
    valid: errors.length === 0,
    errors,
    documentType,
  };
}

// ============================================================================
// File Hashing
// ============================================================================

/**
 * Calculate SHA-256 hash of file content
 */
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculate hash of string content
 */
export function calculateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Generate unique tracking ID
 */
export function generateTrackingId(): string {
  return `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Generate unique chunk ID
 */
export function generateChunkId(trackingId: string, position: number): string {
  return `${trackingId}_chunk_${position}`;
}

// ============================================================================
// File Information Extraction
// ============================================================================

/**
 * Extract file information from uploaded file
 */
export function extractFileInfo(
  fileName: string,
  mimeType: string,
  size: number,
  encoding?: string
): FileInfo {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

  return {
    originalName: fileName,
    mimeType,
    size,
    extension,
    encoding,
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// ============================================================================
// File Buffer Utilities
// ============================================================================

/**
 * Convert File to Buffer (for Node.js environment)
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Convert base64 string to Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:.*;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * Convert Buffer to base64 string
 */
export function bufferToBase64(buffer: Buffer, mimeType?: string): string {
  const base64 = buffer.toString('base64');
  return mimeType ? `data:${mimeType};base64,${base64}` : base64;
}

// ============================================================================
// Safe File Name Generation
// ============================================================================

/**
 * Sanitize file name for safe storage
 */
export function sanitizeFileName(fileName: string): string {
  // Remove or replace invalid characters
  let sanitized = fileName.replace(/[<>:"|?*\x00-\x1F]/g, '_');

  // Remove leading/trailing spaces and dots
  sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '');

  // Limit length while preserving extension
  const maxLength = 200;
  if (sanitized.length > maxLength) {
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.substring(0, maxLength - extension.length) + extension;
  }

  return sanitized || 'unnamed';
}

/**
 * Generate unique file name with timestamp
 */
export function generateUniqueFileName(originalName: string, userId: string): string {
  const sanitized = sanitizeFileName(originalName);
  const extension = sanitized.substring(sanitized.lastIndexOf('.'));
  const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');

  return `${userId}_${timestamp}_${random}_${nameWithoutExt}${extension}`;
}

// ============================================================================
// File Magic Number Detection (for additional security)
// ============================================================================

/**
 * File signatures (magic numbers) for validation
 */
const FILE_SIGNATURES: Record<string, number[][]> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]], // PNG
  jpg: [
    [0xff, 0xd8, 0xff, 0xe0], // JPEG/JFIF
    [0xff, 0xd8, 0xff, 0xe1], // JPEG/Exif
  ],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  docx: [[0x50, 0x4b, 0x03, 0x04]], // ZIP (DOCX is a ZIP file)
};

/**
 * Verify file signature matches expected type
 */
export function verifyFileSignature(buffer: Buffer, expectedType: DocumentType): boolean {
  // Map document type to signature key
  const signatureKey =
    expectedType === DocumentType.IMAGE ? null : expectedType.toLowerCase();

  if (!signatureKey || !FILE_SIGNATURES[signatureKey]) {
    // No signature check available for this type
    return true;
  }

  const signatures = FILE_SIGNATURES[signatureKey];

  // Check if buffer starts with any of the valid signatures
  return signatures.some(signature => {
    if (buffer.length < signature.length) {
      return false;
    }

    return signature.every((byte, index) => buffer[index] === byte);
  });
}
