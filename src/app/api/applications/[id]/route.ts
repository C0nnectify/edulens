import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { ApplicationModel } from '@/lib/db/models/application';

// GET /api/applications/[id] - Get specific application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return errorResponse(auth.error || 'Authentication required', 401);
    }

    const { id } = await params;
    const mongoApplication = await ApplicationModel.findById(id, auth.user?.id!);

    if (!mongoApplication) {
      return errorResponse('Application not found', 404);
    }

    // Transform MongoDB document to client format
    const clientApplication = {
      id: mongoApplication._id!.toString(),
      userId: mongoApplication.userId,
      universityName: mongoApplication.universityName,
      programName: mongoApplication.programName,
      degreeLevel: mongoApplication.degreeLevel,
      status: mongoApplication.status,
      deadline: mongoApplication.deadline || '',
      submittedDate: mongoApplication.submittedDate,
      lastUpdated: mongoApplication.lastUpdated,
      portalUrl: mongoApplication.portalUrl,
      applicationFee: mongoApplication.applicationFee,
      priority: mongoApplication.priority || 'medium',
      notes: mongoApplication.notes,
      tags: mongoApplication.tags || [],
      documents: mongoApplication.documents || [],
      statusHistory: [
        {
          id: crypto.randomUUID(),
          applicationId: mongoApplication._id!.toString(),
          status: mongoApplication.status,
          timestamp: mongoApplication.updatedAt,
          source: 'manual' as const
        }
      ],
      createdAt: mongoApplication.createdAt,
      updatedAt: mongoApplication.updatedAt
    };

    return successResponse(clientApplication);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/applications/[id] - Update application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return errorResponse(auth.error || 'Authentication required', 401);
    }

    const { id } = await params;
    const mongoApplication = await ApplicationModel.findById(id, auth.user?.id!);

    if (!mongoApplication) {
      return errorResponse('Application not found', 404);
    }

    const body = await request.json();
    const {
      universityName,
      programName,
      degreeLevel,
      status,
      deadline,
      submittedDate,
      portalUrl,
      applicationFee,
      priority,
      notes,
      tags
    } = body;

    // Prepare updates
    const updates: any = {
      ...(universityName && { universityName }),
      ...(programName && { programName }),
      ...(degreeLevel && { degreeLevel }),
      ...(status && { status }),
      ...(deadline && { deadline }),
      ...(submittedDate && { submittedDate }),
      ...(portalUrl !== undefined && { portalUrl }),
      ...(applicationFee !== undefined && { applicationFee }),
      ...(priority && { priority }),
      ...(notes !== undefined && { notes }),
      ...(tags && { tags }),
    };

    // Update in MongoDB
    const success = await ApplicationModel.update(id, auth.user?.id!, updates);

    if (!success) {
      return errorResponse('Failed to update application', 500);
    }

    // Fetch updated application
    const updatedMongoApp = await ApplicationModel.findById(id, auth.user?.id!);

    if (!updatedMongoApp) {
      return errorResponse('Application not found after update', 500);
    }

    // Transform MongoDB document to client format
    const clientApplication = {
      id: updatedMongoApp._id!.toString(),
      userId: updatedMongoApp.userId,
      universityName: updatedMongoApp.universityName,
      programName: updatedMongoApp.programName,
      degreeLevel: updatedMongoApp.degreeLevel,
      status: updatedMongoApp.status,
      deadline: updatedMongoApp.deadline || '',
      submittedDate: updatedMongoApp.submittedDate,
      lastUpdated: updatedMongoApp.lastUpdated,
      portalUrl: updatedMongoApp.portalUrl,
      applicationFee: updatedMongoApp.applicationFee,
      priority: updatedMongoApp.priority || 'medium',
      notes: updatedMongoApp.notes,
      tags: updatedMongoApp.tags || [],
      documents: updatedMongoApp.documents || [],
      statusHistory: [
        {
          id: crypto.randomUUID(),
          applicationId: updatedMongoApp._id!.toString(),
          status: updatedMongoApp.status,
          timestamp: updatedMongoApp.updatedAt,
          source: 'manual' as const
        }
      ],
      createdAt: updatedMongoApp.createdAt,
      updatedAt: updatedMongoApp.updatedAt
    };

    return successResponse(clientApplication, 'Application updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/applications/[id] - Delete application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return errorResponse(auth.error || 'Authentication required', 401);
    }

    const { id } = await params;
    const application = await ApplicationModel.findById(id, auth.user?.id!);

    if (!application) {
      return errorResponse('Application not found', 404);
    }

    // Delete from MongoDB
    const success = await ApplicationModel.delete(id, auth.user?.id!);

    if (!success) {
      return errorResponse('Failed to delete application', 500);
    }

    return successResponse(null, 'Application deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}