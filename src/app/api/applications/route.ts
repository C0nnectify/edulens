import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { ApplicationModel } from '@/lib/db/models/application';

// GET /api/applications - List user's applications
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return errorResponse(auth.error || 'Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get applications from MongoDB
    const mongoApplications = await ApplicationModel.findByUserId(auth.user?.id!);

    // Transform MongoDB documents to client format
    const userApplications = mongoApplications.map(app => ({
      id: app._id!.toString(),
      userId: app.userId,
      universityName: app.universityName,
      programName: app.programName,
      degreeLevel: app.degreeLevel,
      status: app.status,
      deadline: app.deadline || '',
      submittedDate: app.submittedDate,
      lastUpdated: app.lastUpdated,
      portalUrl: app.portalUrl,
      applicationFee: app.applicationFee,
      priority: app.priority || 'medium',
      notes: app.notes,
      tags: app.tags || [],
      documents: app.documents || [],
      statusHistory: [
        {
          id: crypto.randomUUID(),
          applicationId: app._id!.toString(),
          status: app.status,
          timestamp: app.updatedAt,
          source: 'manual' as const
        }
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }));

    // Apply filters
    let filteredApplications = userApplications;

    if (status && status !== 'all') {
      filteredApplications = filteredApplications.filter(app => app.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredApplications = filteredApplications.filter(app =>
        app.universityName.toLowerCase().includes(searchLower) ||
        app.programName.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filteredApplications.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return successResponse({
      applications: filteredApplications,
      total: filteredApplications.length,
      filters: { status, search, sortBy, sortOrder }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return errorResponse(auth.error || 'Authentication required', 401);
    }

    const body = await request.json();
    const {
      universityName,
      programName,
      degreeLevel,
      deadline,
      portalUrl,
      applicationFee,
      priority,
      notes,
      tags
    } = body;

    // Validate required fields
    if (!universityName || !programName || !degreeLevel || !deadline) {
      return errorResponse(
        'Missing required fields: universityName, programName, degreeLevel, deadline',
        400
      );
    }

    // Create new application in MongoDB
    const mongoApplication = await ApplicationModel.create({
      userId: auth.user?.id!,
      universityName,
      programName,
      degreeLevel,
      status: 'draft',
      deadline,
      lastUpdated: new Date().toISOString(),
      portalUrl: portalUrl || '',
      applicationFee: applicationFee || 0,
      priority: priority || 'medium',
      notes: notes || '',
      tags: tags || [],
      documents: []
    });

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
          status: 'draft',
          timestamp: mongoApplication.createdAt,
          source: 'manual' as const
        }
      ],
      createdAt: mongoApplication.createdAt,
      updatedAt: mongoApplication.updatedAt
    };

    return successResponse(clientApplication, 'Application created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
