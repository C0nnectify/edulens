import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getChatCollections } from "@/lib/db/chatHistory";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { sessions } = await getChatCollections();
    const docs = await sessions
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      sessions: docs.map((s) => ({
        id: s.sessionId,
        title: s.title,
        updatedAt: s.updatedAt?.toISOString?.() ? s.updatedAt.toISOString() : undefined,
        document_type: s.documentType ?? null,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load sessions" }, { status: 500 });
  }
}
