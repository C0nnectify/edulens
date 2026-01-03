export type DocumentType = "sop" | "lor" | "cv" | "resume" | null;

export type FileAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt?: string;
  status?: "pending" | "processing" | "completed" | "failed";
};

export type SendMessageParams = {
  sessionId?: string;
  message: string;
  feature: "document_builder" | "tracker" | "monitoring_agent" | "analysis" | "roadmap" | "journey" | "general";
  documentType?: DocumentType;  // For document_builder feature
  attachmentIds?: string[];  // IDs of previously uploaded files to include
  generateDraft?: boolean; // When true, backend should generate a document draft (no auto-generation).
  isJourneyContext?: boolean; // When true, use Journey mode for roadmap-focused conversations
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
  documentId: string;
  filename: string;
  size: number;
  type: string;
  status: "pending" | "processing" | "completed" | "failed";
};

export type UserFilesResponse = {
  files: FileAttachment[];
};

type DocumentsApiItem = {
  document_id: string;
  filename: string;
  content_type?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  uploaded_at?: string | null;
  status?: "pending" | "processing" | "completed" | "failed";
};

const base = "/api/chat-orchestrator";
const docBase = "/api/ai";

export async function sendMessage(params: SendMessageParams): Promise<ChatResponse> {
  const res = await fetch(`${base}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

// Journey mode chat - roadmap-focused conversations
export type JourneyAction = {
  type: string;
  target: string;
  details: Record<string, unknown>;
};

export type JourneyChatResponse = {
  response: string;
  actions: JourneyAction[];
  roadmap_updates?: Record<string, unknown>;
  profile_updates?: Record<string, unknown>;
  session_id: string;
};

export async function sendJourneyMessage(message: string, sessionId?: string): Promise<JourneyChatResponse> {
  const res = await fetch('/api/journey/chat', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function listSessions(): Promise<{
  sessions: Array<{ id: string; title?: string; updatedAt?: string; document_type?: DocumentType | null }>;
}> {
  const res = await fetch(`${base}/sessions`, {
    headers: {},
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function renameSession(sessionId: string, title: string): Promise<{ ok: true; sessionId: string; title: string }> {
  const res = await fetch(`${base}/sessions/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function deleteSession(sessionId: string): Promise<{ ok: true; sessionId: string; deletedMessages: number }> {
  const res = await fetch(`${base}/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: {},
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function getHistory(sessionId: string): Promise<{
  messages: Array<{
    role: "user" | "ai";
    content: string;
    attachments?: string[];
    sources?: Array<{ id: string; title: string; url?: string; snippet?: string }>;
    agentsInvolved?: string[];
    documentDraft?: Record<string, unknown> | null;
    progress?: DocumentProgress | null;
    action?: string | null;
    documentType?: DocumentType | null;
  }>;
  document_type?: DocumentType | null;
}> {
  const res = await fetch(`${base}/history?sessionId=${encodeURIComponent(sessionId)}`, {
    headers: {},
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function uploadFile(file: File, docType: string = "document"): Promise<UploadFileResponse> {
  // Canonical upload: FastAPI Document AI pipeline via universal proxy.
  // This stores the blob in Mongo (GridFS) + indexes in Chroma in background.
  const formData = new FormData();
  formData.append("file", file);
  // Use tags to preserve rough doc intent (cv/resume/lor/etc.) for filtering.
  formData.append("tags", docType);

  const res = await fetch(`${docBase}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const data = await res.json();
  return {
    documentId: data.document_id,
    filename: data.filename,
    size: file.size,
    type: file.type,
    status: data.status,
  };
}

export async function getUserFiles(): Promise<UserFilesResponse> {
  try {
    // Canonical list: FastAPI documents endpoint via universal proxy.
    const response = await fetch(`${docBase}/documents?page=1&page_size=100`, {
      headers: {},
    });

    if (!response.ok) return { files: [] };

    const data = await response.json();
    const docs: DocumentsApiItem[] = Array.isArray(data?.documents) ? (data.documents as DocumentsApiItem[]) : [];

    const files: FileAttachment[] = docs.map((d) => ({
      id: d.document_id,
      name: d.filename,
      // Prefer MIME type when available; otherwise fall back to file_type.
      type: d.content_type || d.file_type || "application/octet-stream",
      size: d.file_size || 0,
      uploadedAt: d.uploaded_at || undefined,
      status: d.status,
    }));

    return { files };
  } catch (error) {
    console.error('Error fetching user files:', error);
    return { files: [] };
  }
}
