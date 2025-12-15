/**
 * Centralized User Files API (Compatibility Shim)
 *
 * IMPORTANT:
 * - The canonical document system is the FastAPI Document AI service.
 * - This route exists to keep legacy UI pieces working while ensuring
 *   “upload anywhere, reuse everywhere” by reading/writing the same store.
 *
 * Backing store:
 * - Mongo GridFS for blobs + documents_metadata for metadata (FastAPI)
 * - Chroma for chunks/embeddings (FastAPI background ingestion)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

type FastApiDocument = {
  document_id: string;
  filename: string;
  content_type?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  uploaded_at?: string | null;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
};

function normalizeFastApiError(data: any, fallback: string) {
  const raw = data?.detail ?? data?.error ?? fallback;
  if (typeof raw === 'string') return raw;
  try {
    return JSON.stringify(raw);
  } catch {
    return fallback;
  }
}

async function getSessionUserId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

/**
 * GET /api/user-files
 * Fetches all files uploaded by the current user from MongoDB
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized', files: [] }, { status: 401 });
    }

    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const tags = searchParams.get('tags') || undefined;

    const fastApiUrl = new URL(`${AI_SERVICE_URL}/api/v1/documents`);
    fastApiUrl.searchParams.set('page', String(page));
    fastApiUrl.searchParams.set('page_size', String(limit));
    if (tags) fastApiUrl.searchParams.set('tags', tags);

    const response = await fetch(fastApiUrl.toString(), {
      headers: { 'x-user-id': userId },
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = normalizeFastApiError(data, 'Failed to fetch files');
      return NextResponse.json({ success: false, error: message, files: [] }, { status: response.status });
    }

    const docs: FastApiDocument[] = Array.isArray(data?.documents) ? (data.documents as FastApiDocument[]) : [];

    const apiFiles = docs.map((d) => ({
      id: d.document_id,
      name: d.filename,
      type: d.content_type || d.file_type || 'application/octet-stream',
      size: d.file_size ?? 0,
      uploadedAt: d.uploaded_at ?? undefined,
      processingStatus: d.status,
      source: 'document_ai',
    }));

    return NextResponse.json({
      success: true,
      files: apiFiles,
      total: typeof data?.total === 'number' ? data.total : apiFiles.length,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching user files:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch files',
        files: [] 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-files/upload
 * Upload a file with intelligent processing:
 * - Stores metadata in MongoDB
 * - Extracts text (with OCR for images/scanned PDFs)
 * - Generates embeddings in ChromaDB
 * - Makes file accessible across entire application
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const docType = (formData.get('doc_type') as string) || 'general';
    const tagsParam = (formData.get('tags') as string) || '';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const mergedTags = Array.from(new Set([docType, ...tags].filter(Boolean)));

    const outgoing = new FormData();
    outgoing.append('file', file);
    outgoing.append('tags', mergedTags.join(','));

    const response = await fetch(`${AI_SERVICE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      headers: {
        'x-user-id': userId,
      },
      body: outgoing,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = normalizeFastApiError(data, 'Failed to upload file');
      return NextResponse.json({ success: false, error: message }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      file: {
        id: data.document_id,
        name: data.filename,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: new Date().toISOString(),
        processingStatus: data.status,
        source: 'document_ai',
        message: data.message || 'File uploaded successfully. Processing in background…',
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload file' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-files/:id
 * Delete a file and its embeddings
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(request.url);
    const fileId = url.searchParams.get('id');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/v1/documents/${encodeURIComponent(fileId)}` as string, {
      method: 'DELETE',
      headers: { 'x-user-id': userId },
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = normalizeFastApiError(data, 'Delete failed');
      console.error('[api/user-files] Delete failed', {
        status: response.status,
        fileId,
        userId,
        message,
      });
      return NextResponse.json({ success: false, error: message }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete file' 
      },
      { status: 500 }
    );
  }
}
