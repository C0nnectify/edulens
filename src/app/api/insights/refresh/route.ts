import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { RefreshInsightsRequest, InsightsGenerationResponse } from '@/types/insights';

/**
 * POST /api/insights/refresh
 * Trigger insights regeneration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Partial<RefreshInsightsRequest> = await request.json();
    const userId = body.userId || session.user.id;

    // Verify user can only refresh their own insights
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${aiServiceUrl}/api/insights/${userId}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session.token}`,
      },
      body: JSON.stringify({
        applicationIds: body.applicationIds,
        forceRecalculation: body.forceRecalculation || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to refresh insights' },
        { status: response.status }
      );
    }

    const result: InsightsGenerationResponse = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error refreshing insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
