export type DocumentType = "sop" | "lor" | "cv" | "resume" | null;

export type FileAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt?: string;
};

export type SendMessageParams = {
  sessionId?: string;
  message: string;
  feature: "document_builder" | "tracker" | "monitoring_agent" | "analysis" | "roadmap" | "general";
  documentType?: DocumentType;  // For document_builder feature
  attachmentIds?: string[];  // IDs of previously uploaded files to include
};

export type DocumentProgress = {
  collected_fields: string[];
  missing_fields: string[];
  percentage: number;
  ready_for_generation: boolean;
};

export type ChatResponse = {
  sessionId: string;
  answer: string;
  sources?: Array<{ id: string; title: string; url?: string; snippet?: string }>;
  agentsInvolved?: string[];
  documentDraft?: Record<string, unknown>;  // Generated document
  progress?: DocumentProgress;  // Document completion progress
  action?: string;  // Current action (collect_info, generate_draft, etc.)
};

export type UploadFileResponse = {
  fileId: string;
  filename: string;
  textPreview: string;
  size: number;
  type: string;
};

export type UserFilesResponse = {
  files: FileAttachment[];
};

const base = "/api/chat-orchestrator";
const aiBase = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";

function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "demo-user";
  const key = "edulens_user_id";
  let existing = window.localStorage.getItem(key);
  if (existing && existing.trim().length > 0) return existing;
  const generated = `user-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  window.localStorage.setItem(key, generated);
  return generated;
}

export async function sendMessage(params: SendMessageParams): Promise<ChatResponse> {
  const userId = getOrCreateUserId();
  const res = await fetch(`${base}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function listSessions(): Promise<{
  sessions: Array<{ id: string; title?: string; updatedAt?: string; document_type?: DocumentType | null }>;
}> {
  const userId = getOrCreateUserId();
  const res = await fetch(`${base}/sessions`, {
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function getHistory(sessionId: string): Promise<{
  messages: Array<{ role: "user" | "ai"; content: string }>;
  document_type?: DocumentType | null;
}> {
  const userId = getOrCreateUserId();
  const res = await fetch(`${base}/history?sessionId=${encodeURIComponent(sessionId)}`, {
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function uploadFile(file: File, docType: string = "document"): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("doc_type", docType);

  // Use SOP upload service that stores files for document builder
  const res = await fetch(`${aiBase}/api/sop/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const data = await res.json();
  return {
    fileId: data.file_id,
    filename: data.filename,
    textPreview: data.text_preview,
    size: file.size,
    type: file.type,
  };
}

export async function getUserFiles(): Promise<UserFilesResponse> {
  try {
    // Backend requires an x-user-id header via get_current_user dependency.
    // For now we send a stable demo user ID; replace with real auth when available.
    const userId =
      typeof window !== "undefined"
        ? window.localStorage.getItem("edulens_user_id") || "demo-user"
        : "demo-user";

    const res = await fetch(`${aiBase}/api/v1/files/list`, {
      headers: {
        "x-user-id": userId,
      },
    });
    if (!res.ok) return { files: [] };
    return res.json();
  } catch {
    return { files: [] };
  }
}
