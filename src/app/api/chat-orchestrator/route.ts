// Route index: could provide health/status; we’ll expose subroutes via nested files
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "chat-orchestrator" });
}
