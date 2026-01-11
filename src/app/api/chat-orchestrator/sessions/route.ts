import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getChatCollections } from "@/lib/db/chatHistory";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await auth.api.getSession({ headers: req.headers });
  } catch (authError) {
    console.error('[Sessions API] Auth session error:', authError);
    return NextResponse.json({ 
      error: "Authentication error",
      details: authError instanceof Error ? authError.message : 'Unknown auth error'
    }, { status: 500 });
  }
  
  console.log('[Sessions API] Session:', { userId: session?.user?.id, hasSession: !!session });
  
  if (!session?.user?.id) {
    console.log('[Sessions API] Unauthorized - no session or user ID');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    console.log('[Sessions API] Fetching sessions for userId:', userId);
    const { sessions } = await getChatCollections();
    
    // Try both string userId and ObjectId userId
    const query: any = {
      $or: [
        { userId: userId },
        ...(ObjectId.isValid(userId) ? [{ userId: new ObjectId(userId) }] : [])
      ]
    };
    
    const docs = await sessions
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();

    console.log('[Sessions API] Found sessions:', docs.length);
    return NextResponse.json({
      sessions: docs.map((s) => ({
        id: s.sessionId,
        title: s.title,
        updatedAt: s.updatedAt?.toISOString?.() ? s.updatedAt.toISOString() : undefined,
        document_type: s.documentType ?? null,
      })),
    });
  } catch (e: any) {
    console.error('[Sessions API] Error:', e);
    return NextResponse.json({ error: e?.message || "Failed to load sessions" }, { status: 500 });
  }
}
