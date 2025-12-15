import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getChatCollections, deriveSessionTitle } from "@/lib/db/chatHistory";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, message, feature, documentType, attachmentIds } = body || {};

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const resolvedSessionId = typeof sessionId === "string" && sessionId.trim().length > 0
    ? sessionId
    : `chat_${crypto.randomUUID()}`;

  // Persist the user message + session metadata before calling the AI service.
  // This makes history available immediately and keeps it durable even if the AI service fails.
  try {
    const { sessions, messages } = await getChatCollections();
    const now = new Date();

    await Promise.all([
      messages.insertOne({
        userId,
        sessionId: resolvedSessionId,
        role: "user",
        content: message,
        createdAt: now,
        attachments: Array.isArray(attachmentIds) ? attachmentIds : [],
      }),
      sessions.updateOne(
        { userId, sessionId: resolvedSessionId },
        {
          $setOnInsert: {
            userId,
            sessionId: resolvedSessionId,
            title: deriveSessionTitle({ message, feature, documentType }),
            createdAt: now,
          },
          $set: {
            updatedAt: now,
            feature: typeof feature === "string" ? feature : undefined,
            documentType: typeof documentType === "string" ? documentType : null,
            lastMessage: message,
          },
          $inc: { messageCount: 1 },
        },
        { upsert: true }
      ),
    ]);
  } catch (e) {
    // Do not block chat if persistence fails; still try to answer.
    console.error("[chat-orchestrator] Failed to persist user message", e);
  }

  // Proxy to Python backend
  const base = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";
  try {
    const resp = await fetch(`${base}/chat-agent/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({
        session_id: resolvedSessionId,
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

    // Persist AI response
    try {
      const { sessions, messages } = await getChatCollections();
      const now = new Date();
      const answer = typeof data?.answer === "string" ? data.answer : "";

      await Promise.all([
        messages.insertOne({
          userId,
          sessionId: resolvedSessionId,
          role: "ai",
          content: answer,
          createdAt: now,
          sources: Array.isArray(data?.sources) ? data.sources : undefined,
        }),
        sessions.updateOne(
          { userId, sessionId: resolvedSessionId },
          {
            $set: {
              updatedAt: now,
              lastMessage: answer,
            },
            $inc: { messageCount: 1 },
          }
        ),
      ]);
    } catch (e) {
      console.error("[chat-orchestrator] Failed to persist AI message", e);
    }

    return NextResponse.json({
      sessionId: resolvedSessionId,
      answer: data.answer,
      sources: data.sources,
      agentsInvolved: data.agents_involved,
      documentDraft: data.document_draft,
      progress: data.progress,
      action: data.action,
    });
  } catch (e: any) {
    // Optional: persist an error message so the user can see a complete transcript.
    try {
      const { sessions, messages } = await getChatCollections();
      const now = new Date();
      const errorText = e?.message || "Network error";
      await Promise.all([
        messages.insertOne({
          userId,
          sessionId: resolvedSessionId,
          role: "ai",
          content: `Error: ${errorText}`,
          createdAt: now,
        }),
        sessions.updateOne(
          { userId, sessionId: resolvedSessionId },
          { $set: { updatedAt: now, lastMessage: `Error: ${errorText}` }, $inc: { messageCount: 1 } }
        ),
      ]);
    } catch {
      // ignore
    }
    return NextResponse.json({ error: e?.message || "Network error" }, { status: 500 });
  }
}
