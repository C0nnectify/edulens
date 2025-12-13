import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";
  const userId = req.headers.get("x-user-id") || "demo-user";
  try {
    const resp = await fetch(`${base}/chat-agent/sessions`, {
      headers: { "x-user-id": userId },
    });
    if (!resp.ok) return NextResponse.json({ error: "Backend error" }, { status: resp.status });
    const data = await resp.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Network error" }, { status: 500 });
  }
}
