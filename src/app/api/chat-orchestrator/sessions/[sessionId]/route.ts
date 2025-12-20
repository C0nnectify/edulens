import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getChatCollections } from "@/lib/db/chatHistory";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const maybeTitle =
    body && typeof body === "object" && "title" in body ? (body as { title?: unknown }).title : undefined;
  const title = typeof maybeTitle === "string" ? maybeTitle.trim() : "";
  if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });
  if (title.length > 120) return NextResponse.json({ error: "Title too long" }, { status: 400 });

  try {
    const { sessions } = await getChatCollections();
    const now = new Date();

    const result = await sessions.updateOne(
      { userId, sessionId },
      { $set: { title, updatedAt: now } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, sessionId, title });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to rename session";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { sessions, messages } = await getChatCollections();

    const [sessionResult, messagesResult] = await Promise.all([
      sessions.deleteOne({ userId, sessionId }),
      messages.deleteMany({ userId, sessionId }),
    ]);

    if (sessionResult.deletedCount === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, sessionId, deletedMessages: messagesResult.deletedCount });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete session";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
