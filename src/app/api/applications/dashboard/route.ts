import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApplicationModel } from '@/lib/db/models/application';

// GET /api/applications/dashboard - Get centralized dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get dashboard data from MongoDB
    const dashboard = await ApplicationModel.getDashboardData(userId);

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
