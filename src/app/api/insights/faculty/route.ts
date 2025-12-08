import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { FacultyMatch } from '@/types/insights';

/**
 * GET /api/insights/faculty
 * Fetch faculty matches for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('universityId');
    const userId = session.user.id;
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    const params = new URLSearchParams({ userId });
    if (universityId) params.append('universityId', universityId);

    const response = await fetch(`${aiServiceUrl}/api/insights/faculty?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session.token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to fetch faculty matches' },
        { status: response.status }
      );
    }

    const matches: FacultyMatch[] = await response.json();

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching faculty matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
