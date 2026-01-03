/**
 * SmartProfile API Routes
 * 
 * These routes proxy to the Python AI service for SmartProfile operations.
 * They handle authentication and forward requests to the FastAPI backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { headers } from 'next/headers';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// GET /api/smart-profile - Get current user's SmartProfile
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(
      `${AI_SERVICE_URL}/api/v1/smart-profile/${session.user.id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/smart-profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/smart-profile - Create a new SmartProfile
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(
      `${AI_SERVICE_URL}/api/v1/smart-profile/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: session.user.id,
          initial_data: body.initialData || null,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 409) {
        return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });
      }
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/smart-profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/smart-profile - Delete user's SmartProfile
export async function DELETE() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(
      `${AI_SERVICE_URL}/api/v1/smart-profile/${session.user.id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      throw new Error(`AI service error: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/smart-profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
