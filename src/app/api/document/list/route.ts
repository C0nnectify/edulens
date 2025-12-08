/**
 * Document List API Route
 *
 * GET /api/document/list
 * List all documents for the authenticated user with filtering and pagination.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiSuccessResponse, DocumentListResponse, DocumentListItem } from '@/types/document';
import { getDocumentsCollection } from '@/lib/db/document-db';
import {
  requireAuth,
  createServerErrorResponse,
  createValidationErrorResponse,
} from '@/lib/middleware/document-auth';
import { documentListQuerySchema } from '@/lib/validations/document';
import { Filter } from 'mongodb';

/**
 * Handle document list request
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      tags: searchParams.get('tags')?.split(','),
      documentType: searchParams.get('documentType'),
      processingStatus: searchParams.get('processingStatus'),
      search: searchParams.get('search'),
      uploadedAfter: searchParams.get('uploadedAfter'),
      uploadedBefore: searchParams.get('uploadedBefore'),
      sortBy: searchParams.get('sortBy') || 'uploadDate',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };

    // Validate query parameters
    const validation = documentListQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const errors = validation.error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      );
      return createValidationErrorResponse(errors);
    }

    const query = validation.data;

    // Build MongoDB filter
    const filter: Filter<any> = { userId: user.id };

    if (query.tags && query.tags.length > 0) {
      filter.tags = { $in: query.tags };
    }

    if (query.documentType) {
      filter.documentType = query.documentType;
    }

    if (query.processingStatus) {
      filter.processingStatus = query.processingStatus;
    }

    if (query.search) {
      filter.$or = [
        { fileName: { $regex: query.search, $options: 'i' } },
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.uploadedAfter || query.uploadedBefore) {
      filter.uploadDate = {};
      if (query.uploadedAfter) {
        filter.uploadDate.$gte = query.uploadedAfter;
      }
      if (query.uploadedBefore) {
        filter.uploadDate.$lte = query.uploadedBefore;
      }
    }

    // Build sort
    const sort: any = {};
    sort[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const documentsCollection = await getDocumentsCollection();

    const [documents, total] = await Promise.all([
      documentsCollection
        .find(filter)
        .sort(sort)
        .skip(query.offset)
        .limit(query.limit)
        .toArray(),
      documentsCollection.countDocuments(filter),
    ]);

    // Map to list items
    const items: DocumentListItem[] = documents.map(doc => ({
      trackingId: doc.trackingId,
      documentId: doc._id!.toString(),
      fileName: doc.fileName,
      documentType: doc.documentType,
      tags: doc.tags,
      uploadDate: doc.uploadDate,
      lastModified: doc.lastModified,
      processingStatus: doc.processingStatus,
      totalChunks: doc.totalChunks,
      fileSize: doc.fileInfo.size,
      title: doc.title,
      description: doc.description,
      hasOcr: doc.hasOcr,
    }));

    const response: DocumentListResponse = {
      documents: items,
      total,
      offset: query.offset,
      limit: query.limit,
      hasMore: query.offset + query.limit < total,
    };

    const successResponse: ApiSuccessResponse<DocumentListResponse> = {
      success: true,
      data: response,
    };

    return NextResponse.json(successResponse, {
      headers: {
        'X-Total-Documents': String(total),
        'X-Offset': String(query.offset),
        'X-Limit': String(query.limit),
      },
    });
  } catch (error: any) {
    console.error('Document list error:', error);
    return createServerErrorResponse(error);
  }
}

/**
 * Get endpoint info
 */
export async function OPTIONS(request: NextRequest) {
  const info = {
    endpoint: '/api/document/list',
    method: 'GET',
    description: 'List all documents with filtering and pagination',
    authentication: 'Required',
    queryParameters: {
      tags: {
        type: 'string',
        required: false,
        description: 'Comma-separated list of tags',
        example: 'magicfill,research',
      },
      documentType: {
        type: 'string',
        required: false,
        description: 'Filter by document type',
        options: ['pdf', 'docx', 'doc', 'txt', 'md', 'html', 'image'],
      },
      processingStatus: {
        type: 'string',
        required: false,
        description: 'Filter by processing status',
        options: ['pending', 'processing', 'completed', 'failed', 'partial'],
      },
      search: {
        type: 'string',
        required: false,
        description: 'Search in file name, title, and description',
      },
      uploadedAfter: {
        type: 'string',
        required: false,
        description: 'ISO date string',
      },
      uploadedBefore: {
        type: 'string',
        required: false,
        description: 'ISO date string',
      },
      sortBy: {
        type: 'string',
        required: false,
        default: 'uploadDate',
        options: ['uploadDate', 'lastModified', 'fileName', 'fileSize'],
      },
      sortOrder: {
        type: 'string',
        required: false,
        default: 'desc',
        options: ['asc', 'desc'],
      },
      offset: {
        type: 'number',
        required: false,
        default: 0,
        description: 'Pagination offset',
      },
      limit: {
        type: 'number',
        required: false,
        default: 20,
        description: 'Results per page',
      },
    },
  };

  return NextResponse.json(info);
}
