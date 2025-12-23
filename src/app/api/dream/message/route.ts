import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      anonId?: string;
      sessionId?: string;
      message?: string;
      recentMessages?: Array<{ role: 'user' | 'ai'; content: string }>;
    };

    const anonId = (body.anonId || '').trim();
    const message = (body.message || '').trim();

    if (!anonId) {
      return NextResponse.json({ error: 'anonId is required' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const baseUrl = process.env.AI_SERVICE_URL || process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
    const url = `${baseUrl}/api/v1/dream/message`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-anon-id': anonId,
      },
      body: JSON.stringify({
        session_id: body.sessionId || null,
        message,
        recent_messages: body.recentMessages || [],
      }),
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
