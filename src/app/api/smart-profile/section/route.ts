/**
 * SmartProfile Section Update API
 * 
 * Updates a specific section of the user's SmartProfile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { headers } from 'next/headers';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// PUT /api/smart-profile/section - Update a profile section
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { section, data, source = 'user', syncToRoadmap = true } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: section, data' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${AI_SERVICE_URL}/api/v1/smart-profile/${session.user.id}/section`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section,
          data,
          source,
          sync_to_roadmap: syncToRoadmap,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to update section' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/smart-profile/section error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
