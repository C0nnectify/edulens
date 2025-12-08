import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { ProfileStrength, ProfileWeakness, ProfileComparison } from '@/types/insights';

/**
 * GET /api/insights/profile
 * Fetch profile analysis (strengths, weaknesses, comparisons)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    const response = await fetch(`${aiServiceUrl}/api/insights/${userId}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session.token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to fetch profile analysis' },
        { status: response.status }
      );
    }

    const data: {
      strengths: ProfileStrength[];
      weaknesses: ProfileWeakness[];
      comparisons: ProfileComparison[];
    } = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching profile analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
