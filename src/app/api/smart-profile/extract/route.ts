/**
 * SmartProfile Chat Extraction API
 * 
 * Extracts profile information from chat messages using NLP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { headers } from 'next/headers';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/smart-profile/extract - Extract profile data from chat message
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${AI_SERVICE_URL}/api/v1/smart-profile/${session.user.id}/extract-from-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: context || null,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to extract profile data' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/smart-profile/extract error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/smart-profile/extract - Apply confirmed extractions
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Missing required field: updates (array)' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${AI_SERVICE_URL}/api/v1/smart-profile/${session.user.id}/apply-chat-extraction`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to apply extractions' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/smart-profile/extract error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
