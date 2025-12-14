/**
 * API client for SOP Generator endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_SOP_API_URL || 'http://localhost:8000';

/**
 * Get auth token from storage or context
 * TODO: Replace with actual auth implementation
 */
function getAuthToken(): string {
  // For MVP, return test token
  // In production, get from auth context or localStorage
  return 'test_token';
}

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'demo-user';
  const key = 'edulens_user_id';
  const existing = window.localStorage.getItem(key);
  if (existing && existing.trim().length > 0) return existing;
  const generated = `user-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  window.localStorage.setItem(key, generated);
  return generated;
}

/**
 * Upload a file
 */
export async function uploadFile(
  file: File,
  docType: string = 'document'
): Promise<{ file_id: string; filename: string; text_preview: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doc_type', docType);

  const response = await fetch(`${API_BASE_URL}/api/sop/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'x-user-id': getOrCreateUserId(),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

/**
 * List user's uploaded files
 */
export interface UploadedFileInfo {
  file_id: string;
  filename: string;
  doc_type: string;
  upload_date: string;
  text_preview?: string;
}

export async function listUploadedFiles(limit: number = 50): Promise<UploadedFileInfo[]> {
  const response = await fetch(`${API_BASE_URL}/api/sop/files?limit=${limit}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'x-user-id': getOrCreateUserId(),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to list files' }));
    throw new Error(error.detail || 'Failed to list files');
  }

  return response.json();
}

/**
 * Generate SOP
 */
export interface GenerateSOPRequest {
  program: string;
  university?: string;
  country?: string;
  about_you?: string;
  background: string;
  projects_summary?: string;
  goals: string;
  others?: string;
  tone?: string;
  word_limit?: number;
  file_ids?: string[];
}

export interface SOPSection {
  heading: string;
  content_markdown: string;
}

export interface GenerateSOPResponse {
  sop_id?: string;
  title: string;
  sections: SOPSection[];
  plain_text: string;
  editor_json: Record<string, unknown>;
  html: string;
}

export async function generateSOP(
  request: GenerateSOPRequest
): Promise<GenerateSOPResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sop/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Generation failed' }));
    throw new Error(error.detail || 'Generation failed');
  }

  return response.json();
}

// ---------------- LOR Generation ----------------
export interface GenerateLORRequest {
  recommender_name: string;
  recommender_title: string;
  recommender_relationship: string;
  recommender_association_duration: string;
  student_name: string;
  student_role?: string;
  student_under_duration?: string;
  skills_observed?: string;
  achievements?: string;
  character_traits?: string;
  target_program: string;
  target_university?: string;
  target_country?: string;
  tone?: string; // academic | managerial | balanced
  recommendation_strength?: string; // recommended | strongly recommended | highly recommended
  word_limit?: number;
  evidence_file_ids?: string[];
  cv_file_ids?: string[];
  transcript_file_ids?: string[];
}

export interface GenerateLORResponse {
  title: string;
  sections: { heading: string; content_markdown: string }[];
  plain_text: string;
  editor_json: Record<string, unknown>;
  html: string;
}

export async function generateLOR(request: GenerateLORRequest): Promise<GenerateLORResponse> {
  // Helper to perform the POST
  const post = async (payload: GenerateLORRequest) => {
    const resp = await fetch(`${API_BASE_URL}/api/sop/generate-lor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(payload),
    });
    return resp;
  };

  const response = await post(request);
  if (response.ok) {
    return response.json();
  }

  // Try to parse error and optionally retry without evidence IDs
  const error = await response.json().catch(() => ({ detail: 'LOR generation failed' }));
  const detail: string = error?.detail || '';

  // Some backends may incorrectly expect objects instead of string IDs for evidence
  // If we detect the "'file_id'" KeyError pattern, retry without evidence to unblock users
  const looksLikeFileIdKeyError = typeof detail === 'string' && detail.includes("'file_id'");
  if (looksLikeFileIdKeyError) {
    const fallbackPayload: GenerateLORRequest = {
      ...request,
      evidence_file_ids: [],
      cv_file_ids: [],
      transcript_file_ids: [],
    };
    const retryResp = await post(fallbackPayload);
    if (retryResp.ok) {
      return retryResp.json();
    }
    const retryErr = await retryResp.json().catch(() => ({ detail: 'LOR generation failed' }));
    throw new Error(retryErr.detail || 'LOR generation failed');
  }

  throw new Error(detail || 'LOR generation failed');
}

/**
 * Rewrite selected text
 */
export interface RewriteRequest {
  sop_id?: string;
  selected_text: string;
  instruction: string;
  program?: string;
  university?: string;
  file_ids?: string[];
}

export interface RewriteResponse {
  rewritten_text: string;
}

export async function rewriteText(
  request: RewriteRequest
): Promise<RewriteResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sop/rewrite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Rewrite failed' }));
    throw new Error(error.detail || 'Rewrite failed');
  }

  return response.json();
}

/**
 * Save SOP
 */
export interface SaveSOPRequest {
  sop_id?: string;
  title: string;
  editor_json: Record<string, unknown>;
  html: string;
  metadata?: Record<string, unknown>;
}

export interface SaveSOPResponse {
  sop_id: string;
}

export async function saveSOP(request: SaveSOPRequest): Promise<SaveSOPResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sop/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Save failed' }));
    throw new Error(error.detail || 'Save failed');
  }

  return response.json();
}

/**
 * Get SOP by ID
 */
export interface SOPDocument {
  id: string;
  title: string;
  editor_json: Record<string, unknown>;
  html: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface SOPSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export async function getSOP(sopId: string): Promise<SOPDocument> {
  const response = await fetch(`${API_BASE_URL}/api/sop/${sopId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch SOP' }));
    throw new Error(error.detail || 'Failed to fetch SOP');
  }

  return response.json();
}

/**
 * List SOPs for current user (doc_type = 'sop')
 *
 * Previously this endpoint fetched all documents without filtering by type,
 * which could cause LOR documents to appear in both the SOP and LOR lists
 * and lead to duplicate entries in the Document Builder UI.
 */
export async function listSOPs(limit: number = 10): Promise<SOPSummary[]> {
  return listDocumentsByType('sop', limit);
}

/**
 * List documents filtered by doc_type (e.g., 'lor' or 'sop')
 */
export async function listDocumentsByType(docType: string, limit: number = 10): Promise<SOPSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/sop?limit=${limit}&doc_type=${encodeURIComponent(docType)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to list documents' }));
    throw new Error(error.detail || 'Failed to list documents');
  }

  return response.json();
}

/**
 * Convenience wrapper for listing LORs
 */
export async function listLORs(limit: number = 10): Promise<SOPSummary[]> {
  return listDocumentsByType('lor', limit);
}

/**
 * Delete SOP by ID
 */
export async function deleteSOP(sopId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/sop/${sopId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Delete failed' }));
    throw new Error(error.detail || 'Delete failed');
  }
}
