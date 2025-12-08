import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { applications } from '@/lib/data-store';

// GET /api/applications/analytics - Get application analytics
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return errorResponse(auth.error || 'Authentication required', 401);
    }

    // Get user's applications
    const userApplications = Array.from(applications.values())
      .filter(app => app.userId === auth.user?.id);

    // Calculate analytics
    const totalApplications = userApplications.length;
    const statusCounts = userApplications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const successRate = totalApplications > 0 ? 
      ((statusCounts.accepted || 0) / totalApplications) * 100 : 0;

    const averageProcessingTime = userApplications
      .filter(app => app.submittedDate && app.status === 'accepted')
      .reduce((acc, app) => {
        const submitted = new Date(app.submittedDate);
        const processed = new Date(app.updatedAt);
        return acc + (processed.getTime() - submitted.getTime());
      }, 0) / Math.max(userApplications.filter(app => app.submittedDate && app.status === 'accepted').length, 1);

    const analytics = {
      totalApplications,
      statusCounts,
      successRate: Math.round(successRate * 100) / 100,
      averageProcessingTime: Math.round(averageProcessingTime / (1000 * 60 * 60 * 24)), // days
      topUniversities: userApplications
        .reduce((acc, app) => {
          acc[app.universityName] = (acc[app.universityName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      monthlyApplications: userApplications
        .reduce((acc, app) => {
          const month = new Date(app.createdAt).toISOString().substring(0, 7);
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    };

    return successResponse(analytics);
  } catch (error) {
    return handleApiError(error);
  }
}