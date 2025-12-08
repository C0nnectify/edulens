/**
 * Document Management API Routes
 *
 * GET    /api/document/[id] - Get document details
 * PATCH  /api/document/[id] - Update document metadata
 * DELETE /api/document/[id] - Delete document and all chunks
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import type { ApiSuccessResponse, DocumentMetadata } from '@/types/document';
import { getDocumentsCollection, getUserVectorCollection } from '@/lib/db/document-db';
import {
  requireAuth,
  requireDocumentOwnership,
  createErrorResponse,
  createNotFoundResponse,
  createValidationErrorResponse,
  createServerErrorResponse,
} from '@/lib/middleware/document-auth';
import { updateDocumentSchema } from '@/lib/validations/document';

/**
 * Get document details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const response: ApiSuccessResponse<DocumentMetadata> = {
      success: true,
      data: document,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Get document error:', error);
    return createServerErrorResponse(error);
  }
}

/**
 * Update document metadata
 */
export async function PATCH(
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

    // Parse and validate update data
    const body = await request.json();
    const validation = updateDocumentSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map(
        (err: any) => `${err.path.join('.')}: ${err.message}`
      );
      return createValidationErrorResponse(errors);
    }

    const updateData = validation.data;

    // Update document
    const result = await documentsCollection.findOneAndUpdate(
      { _id: new ObjectId(documentId) },
      {
        $set: {
          ...updateData,
          lastModified: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return createNotFoundResponse('Document');
    }

    // If tags were updated, update all chunks as well
    if (updateData.tags) {
      const vectorCollection = await getUserVectorCollection(user.id);
      await vectorCollection.updateMany(
        { trackingId: document.trackingId },
        { $set: { tags: updateData.tags } }
      );
    }

    const response: ApiSuccessResponse<DocumentMetadata> = {
      success: true,
      data: result,
      message: 'Document updated successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Update document error:', error);
    return createServerErrorResponse(error);
  }
}

/**
 * Delete document and all associated chunks
 */
export async function DELETE(
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

    // Delete all chunks
    const vectorCollection = await getUserVectorCollection(user.id);
    const chunksDeleted = await vectorCollection.deleteMany({
      trackingId: document.trackingId,
    });

    // Delete document
    await documentsCollection.deleteOne({
      _id: new ObjectId(documentId),
    });

    const response: ApiSuccessResponse<{
      documentId: string;
      chunksDeleted: number;
    }> = {
      success: true,
      data: {
        documentId,
        chunksDeleted: chunksDeleted.deletedCount,
      },
      message: 'Document and all associated chunks deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Delete document error:', error);
    return createServerErrorResponse(error);
  }
}
