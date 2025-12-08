/**
 * Document Chunks API Route
 *
 * GET /api/document/[id]/chunks
 * Retrieve all chunks for a specific document.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import type { ApiSuccessResponse, DocumentChunk } from '@/types/document';
import { getDocumentsCollection, getUserVectorCollection } from '@/lib/db/document-db';
import {
  requireAuth,
  requireDocumentOwnership,
  createErrorResponse,
  createNotFoundResponse,
  createServerErrorResponse,
} from '@/lib/middleware/document-auth';

/**
 * Get document chunks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    // Validate ObjectId
    if (!ObjectId.isValid(documentId)) {
      return createErrorResponse('INVALID_ID', 'Invalid document ID format', 400);
    }

    // Get document
    const documentsCollection = await getDocumentsCollection();
    const document = await documentsCollection.findOne({
      _id: new ObjectId(documentId),
    });

    if (!document) {
      return createNotFoundResponse('Document');
    }

    // Check ownership
    const ownershipResult = await requireDocumentOwnership(request, document.userId);
    if ('error' in ownershipResult) {
      return ownershipResult.error;
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '100');
    const includeEmbeddings = searchParams.get('includeEmbeddings') === 'true';

    // Get chunks
    const vectorCollection = await getUserVectorCollection(user.id);

    const projection = includeEmbeddings
      ? {} // Include all fields
      : { embedding: 0 }; // Exclude embeddings to reduce response size

    const [chunks, total] = await Promise.all([
      vectorCollection
        .find(
          { trackingId: document.trackingId },
          { projection }
        )
        .sort({ 'metadata.position': 1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      vectorCollection.countDocuments({ trackingId: document.trackingId }),
    ]);

    const response: ApiSuccessResponse<{
      chunks: DocumentChunk[];
      total: number;
      offset: number;
      limit: number;
      hasMore: boolean;
    }> = {
      success: true,
      data: {
        chunks: chunks as DocumentChunk[],
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
      },
      metadata: {
        documentId,
        trackingId: document.trackingId,
        fileName: document.fileName,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'X-Total-Chunks': String(total),
        'X-Document-ID': documentId,
        'X-Tracking-ID': document.trackingId,
      },
    });
  } catch (error: any) {
    console.error('Get chunks error:', error);
    return createServerErrorResponse(error);
  }
}
