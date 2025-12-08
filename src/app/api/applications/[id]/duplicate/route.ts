import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { ApplicationModel } from '@/lib/db/models/application';

// POST /api/applications/[id]/duplicate - Duplicate application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return errorResponse(auth.error || 'Authentication required', 401);
    }

    const { id } = await params;
    const originalApplication = await ApplicationModel.findById(id, auth.user?.id!);

    if (!originalApplication) {
      return errorResponse('Application not found', 404);
    }

    // Parse optional modifications from request body
    const body = await request.json().catch(() => ({}));
    const modifications = body.modifications || {};

    // Create duplicate with modified fields
    const duplicatedMongoApp = await ApplicationModel.create({
      userId: auth.user?.id!,
      universityName: modifications.universityName || `${originalApplication.universityName} (Copy)`,
      programName: modifications.programName || originalApplication.programName,
      degreeLevel: modifications.degreeLevel || originalApplication.degreeLevel,
      status: 'draft',
      deadline: modifications.deadline || originalApplication.deadline || '',
      lastUpdated: new Date().toISOString(),
      portalUrl: modifications.portalUrl || originalApplication.portalUrl,
      applicationFee: modifications.applicationFee ?? originalApplication.applicationFee,
      priority: modifications.priority || originalApplication.priority || 'medium',
      notes: modifications.notes || originalApplication.notes,
      tags: modifications.tags || originalApplication.tags || [],
      documents: []
    });

    // Transform MongoDB document to client format
    const clientApplication = {
      id: duplicatedMongoApp._id!.toString(),
      userId: duplicatedMongoApp.userId,
      universityName: duplicatedMongoApp.universityName,
      programName: duplicatedMongoApp.programName,
      degreeLevel: duplicatedMongoApp.degreeLevel,
      status: duplicatedMongoApp.status,
      deadline: duplicatedMongoApp.deadline || '',
      submittedDate: duplicatedMongoApp.submittedDate,
      lastUpdated: duplicatedMongoApp.lastUpdated,
      portalUrl: duplicatedMongoApp.portalUrl,
      applicationFee: duplicatedMongoApp.applicationFee,
      priority: duplicatedMongoApp.priority || 'medium',
      notes: duplicatedMongoApp.notes,
      tags: duplicatedMongoApp.tags || [],
      documents: duplicatedMongoApp.documents || [],
      statusHistory: [
        {
          id: crypto.randomUUID(),
          applicationId: duplicatedMongoApp._id!.toString(),
          status: 'draft',
          timestamp: duplicatedMongoApp.createdAt,
          source: 'manual' as const
        }
      ],
      createdAt: duplicatedMongoApp.createdAt,
      updatedAt: duplicatedMongoApp.updatedAt
    };

    return successResponse(clientApplication, 'Application duplicated successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}