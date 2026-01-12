import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getChatCollections, deriveSessionTitle } from "@/lib/db/chatHistory";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, message, feature, documentType, attachmentIds, generateDraft } = body || {};

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

  // Build short-term + long-term context for this session.
  // Short-term: last 8 messages (4 user/ai pairs)
  // Long-term: rolling summary stored on the session doc
  let sessionSummary: string | null = null;
  let activeAttachmentIds: string[] = [];
  let recentMessages: Array<{ role: "user" | "ai"; content: string }> = [];
  try {
    const { sessions, messages } = await getChatCollections();
    const [sessionDoc, tail] = await Promise.all([
      sessions.findOne({ userId, sessionId: resolvedSessionId }),
      messages
        .find({ userId, sessionId: resolvedSessionId })
        .sort({ createdAt: -1 })
        .limit(8)
        .toArray(),
    ]);
    sessionSummary = (sessionDoc?.summary ?? null) as string | null;
    activeAttachmentIds = Array.isArray(sessionDoc?.activeAttachmentIds)
      ? (sessionDoc?.activeAttachmentIds as string[])
      : [];
    recentMessages = tail
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }))
      .filter((m) => m.role === "user" || m.role === "ai");
  } catch (e) {
    // Non-fatal; chat can still proceed without memory.
    console.warn("[chat-orchestrator] Failed to load context", e);
  }

  // Sticky file context (Option A):
  // - If request includes attachmentIds as an array, it replaces the active set (empty array clears).
  // - If request omits attachmentIds, reuse the previous active set.
  const hasAttachmentIds = Array.isArray(attachmentIds);
  const normalizedIncomingAttachmentIds = hasAttachmentIds
    ? (attachmentIds as unknown[]).filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : null;
  const effectiveAttachmentIds = hasAttachmentIds ? normalizedIncomingAttachmentIds! : activeAttachmentIds;

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
        // Persist the effective attachments used for this turn.
        attachments: effectiveAttachmentIds,
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
            ...(hasAttachmentIds
              ? {
                  activeAttachmentIds: effectiveAttachmentIds,
                  activeAttachmentUpdatedAt: now,
                }
              : {}),
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
  const base = process.env.AI_SERVICE_URL || "http://localhost:8000";
  try {
    const resp = await fetch(`${base}/chat-agent/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({
        session_id: resolvedSessionId,
        message,
        feature,
        document_type: documentType ?? undefined,
        attachments: effectiveAttachmentIds,
        generate_draft: Boolean(generateDraft),
        // Memory payload
        session_summary: sessionSummary ?? "",
        recent_messages: recentMessages,
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
      const updatedSummary = typeof data?.updated_summary === "string" ? data.updated_summary : undefined;

      await Promise.all([
        messages.insertOne({
          userId,
          sessionId: resolvedSessionId,
          role: "ai",
          content: answer,
          createdAt: now,
          sources: Array.isArray(data?.sources) ? data.sources : undefined,
          agentsInvolved: Array.isArray(data?.agents_involved) ? data.agents_involved : undefined,
          documentDraft:
            data?.document_draft && typeof data.document_draft === "object"
              ? (data.document_draft as Record<string, unknown>)
              : undefined,
          progress:
            data?.progress && typeof data.progress === "object"
              ? (data.progress as {
                  collected_fields: string[];
                  missing_fields: string[];
                  percentage: number;
                  ready_for_generation?: boolean;
                })
              : undefined,
          action: typeof data?.action === "string" ? data.action : undefined,
          documentType: typeof documentType === "string" ? documentType : null,
        }),
        sessions.updateOne(
          { userId, sessionId: resolvedSessionId },
          {
            $set: {
              updatedAt: now,
              lastMessage: answer,
              ...(updatedSummary !== undefined ? { summary: updatedSummary, summaryUpdatedAt: now } : {}),
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
  } catch (e: unknown) {
    // Optional: persist an error message so the user can see a complete transcript.
    try {
      const { sessions, messages } = await getChatCollections();
      const now = new Date();
      const errorText = e instanceof Error ? e.message : "Network error";
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
    const msg = e instanceof Error ? e.message : "Network error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
