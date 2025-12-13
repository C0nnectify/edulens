import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, message, feature, documentType, attachmentIds } = body || {};

  // Forward per-user identifier (used by the backend to keep
  // sessions and history isolated). The client sets this header
  // when calling the /api/chat-orchestrator endpoints.
  const userId = req.headers.get("x-user-id") || "demo-user";

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  // Proxy to Python backend
  const base = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";
  try {
    const resp = await fetch(`${base}/chat-agent/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        feature,
        document_type: documentType ?? undefined,
        attachments: attachmentIds ?? [],
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: text || "Backend error" }, { status: resp.status });
    }
    const data = await resp.json();
    return NextResponse.json({
      sessionId: data.session_id,
      answer: data.answer,
      sources: data.sources,
      agentsInvolved: data.agents_involved,
      documentDraft: data.document_draft,
      progress: data.progress,
      action: data.action,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Network error" }, { status: 500 });
  }
}
