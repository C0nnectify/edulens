/**
 * SmartProfile Sync API
 * 
 * Handles syncing profile data to roadmap and getting sync logs.
 * Also supports generating dream roadmap from profile for direct signup users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { headers } from 'next/headers';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/smart-profile/sync - Sync profile to roadmap
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { sections, force = false, generateDreamRoadmap = false } = body;

    // If generateDreamRoadmap is true, call the dream roadmap generation endpoint
    if (generateDreamRoadmap) {
      const dreamResponse = await fetch(
        `${AI_SERVICE_URL}/api/v1/smart-profile/${session.user.id}/generate-dream-roadmap`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            regenerate: true, // Regenerate from combined context
          }),
        }
      );

      if (!dreamResponse.ok) {
        console.warn('Dream roadmap generation failed, falling back to regular sync');
        // Fall through to regular sync
      } else {
        const dreamResult = await dreamResponse.json();
        return NextResponse.json({
          ...dreamResult,
          dreamRoadmapGenerated: true,
        });
      }
    }

    const response = await fetch(
      `${AI_SERVICE_URL}/api/v1/smart-profile/${session.user.id}/sync-to-roadmap`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sections: sections || null,
          force,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to sync' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/smart-profile/sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/smart-profile/sync - Get sync log
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const section = searchParams.get('section');

    let url = `${AI_SERVICE_URL}/api/v1/smart-profile/${session.user.id}/sync-log?limit=${limit}`;
    if (section) {
      url += `&section=${section}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to get sync log' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/smart-profile/sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
