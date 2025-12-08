/**
 * Document Upload API Route
 *
 * POST /api/document/upload
 * Upload and process documents with chunking and embedding generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiSuccessResponse, UploadDocumentResponse } from '@/types/document';
import { defaultDocumentProcessor } from '@/lib/document/document-processor';
import {
  requireAuth,
  checkUploadRateLimit,
  createErrorResponse,
  createValidationErrorResponse,
  createServerErrorResponse,
} from '@/lib/middleware/document-auth';
import { uploadDocumentSchema } from '@/lib/validations/document';

/**
 * Handle document upload
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    // Check rate limit
    const rateLimitResult = checkUploadRateLimit(user.id);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.error;
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return createErrorResponse('MISSING_FILE', 'No file provided', 400);
    }

    // Extract metadata from form data
    const metadata = {
      fileName: file.name,
      tags: formData.get('tags')
        ? JSON.parse(formData.get('tags') as string)
        : undefined,
      title: (formData.get('title') as string) || undefined,
      description: (formData.get('description') as string) || undefined,
      customMetadata: formData.get('customMetadata')
        ? JSON.parse(formData.get('customMetadata') as string)
        : undefined,
      chunkSize: formData.get('chunkSize')
        ? parseInt(formData.get('chunkSize') as string)
        : undefined,
      chunkOverlap: formData.get('chunkOverlap')
        ? parseInt(formData.get('chunkOverlap') as string)
        : undefined,
      skipEmbedding: formData.get('skipEmbedding') === 'true',
      skipOcr: formData.get('skipOcr') === 'true',
    };

    // Validate metadata
    const validation = uploadDocumentSchema.safeParse(metadata);
    if (!validation.success) {
      const errors = validation.error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      );
      return createValidationErrorResponse(errors);
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process document
    const result = await defaultDocumentProcessor.processDocument(
      user.id,
      buffer,
      {
        file: buffer,
        ...validation.data,
      }
    );

    const response: ApiSuccessResponse<UploadDocumentResponse> = {
      success: true,
      data: result,
      message: result.message,
    };

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'X-Document-ID': result.documentId,
        'X-Tracking-ID': result.trackingId,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return createServerErrorResponse(error);
  }
}

/**
 * Get upload endpoint info
 */
export async function GET(request: NextRequest) {
  const info = {
    endpoint: '/api/document/upload',
    method: 'POST',
    description: 'Upload and process documents with automatic chunking and embedding',
    authentication: 'Required',
    rateLimit: '10 uploads per minute',
    contentType: 'multipart/form-data',
    parameters: {
      file: {
        type: 'File',
        required: true,
        description: 'Document file to upload',
        supportedTypes: ['PDF', 'DOCX', 'DOC', 'TXT', 'MD', 'HTML', 'Images'],
      },
      tags: {
        type: 'string[]',
        required: false,
        description: 'Document tags for categorization',
        example: '["magicfill", "research"]',
      },
      title: {
        type: 'string',
        required: false,
        description: 'Document title',
      },
      description: {
        type: 'string',
        required: false,
        description: 'Document description',
      },
      chunkSize: {
        type: 'number',
        required: false,
        default: 1000,
        description: 'Characters per chunk',
      },
      chunkOverlap: {
        type: 'number',
        required: false,
        default: 200,
        description: 'Overlap between chunks',
      },
      skipEmbedding: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Skip embedding generation',
      },
      skipOcr: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Skip OCR for images',
      },
    },
  };

  return NextResponse.json(info);
}
