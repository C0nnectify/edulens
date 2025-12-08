/**
 * Universal AI Service Proxy
 *
 * Single catch-all endpoint that proxies all requests to FastAPI AI service
 * Handles authentication and JWT token creation automatically
 *
 * Usage:
 * - POST /api/ai/documents/upload → http://localhost:8000/api/documents/upload
 * - POST /api/ai/search → http://localhost:8000/api/search
 * - GET /api/ai/documents → http://localhost:8000/api/documents
 * etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(req, resolvedParams, 'GET');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(req, resolvedParams, 'POST');
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(req, resolvedParams, 'PATCH');
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(req, resolvedParams, 'DELETE');
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(req, resolvedParams, 'PUT');
}

/**
 * Universal request handler
 */
async function handleRequest(
  req: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // 1. Authenticate user using better-auth
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Construct the FastAPI URL
    const path = params.path.join('/');
    const searchParams = req.nextUrl.searchParams.toString();
    const fastApiUrl = `${AI_SERVICE_URL}/api/v1/${path}${searchParams ? `?${searchParams}` : ''}`;

    // 3. Prepare headers with user ID
    const headers: HeadersInit = {
      'x-user-id': session.user.id,
    };

    // 5. Prepare request body based on content type
    let body: any = undefined;
    const contentType = req.headers.get('content-type');

    if (method !== 'GET' && method !== 'DELETE') {
      if (contentType?.includes('multipart/form-data')) {
        // For file uploads, forward FormData directly
        body = await req.formData();
        // Don't set Content-Type header - fetch will set it with boundary
      } else if (contentType?.includes('application/json')) {
        // For JSON requests
        const jsonBody = await req.json();
        body = JSON.stringify(jsonBody);
        headers['Content-Type'] = 'application/json';
      } else {
        // For other types, forward as-is
        body = await req.text();
        if (contentType) {
          headers['Content-Type'] = contentType;
        }
      }
    }

    // 6. Forward request to FastAPI
    const response = await fetch(fastApiUrl, {
      method,
      headers,
      body,
    });

    // 7. Get response data
    const responseData = await response.json();

    // 8. Return response with same status code
    return NextResponse.json(responseData, {
      status: response.status,
    });

  } catch (error) {
    console.error('AI Service proxy error:', error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'AI Service request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
