/**
 * Journey Chat API
 * 
 * Handles Journey mode conversations that can update the user's
 * roadmap and SmartProfile based on chat interactions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { headers } from 'next/headers';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Call the AI service Journey endpoint
    const response = await fetch(`${AI_SERVICE_URL}/api/v1/journey/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: session.user.id,
        message,
        session_id: sessionId || `journey-${Date.now()}`,
        context: {
          mode: 'journey',
          can_update_roadmap: true,
          can_update_profile: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI service error:', error);
      return NextResponse.json(
        { error: 'Failed to process message' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      response: data.response,
      actions: data.actions || [],
      roadmapUpdates: data.roadmap_updates || null,
      profileUpdates: data.profile_updates || null,
      sessionId: data.session_id,
    });
  } catch (error) {
    console.error('Journey chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
