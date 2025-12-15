import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getChatCollections } from "@/lib/db/chatHistory";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  try {
    const { messages, sessions } = await getChatCollections();
    const [docs, sessionDoc] = await Promise.all([
      messages
      .find({ userId, sessionId })
      .sort({ createdAt: 1 })
      .limit(500)
      .toArray(),
      sessions.findOne({ userId, sessionId }),
    ]);

    return NextResponse.json({
      sessionId,
      document_type: sessionDoc?.documentType ?? null,
      messages: docs.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments ?? [],
        createdAt: m.createdAt?.toISOString?.() ? m.createdAt.toISOString() : undefined,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load history" }, { status: 500 });
  }
}
