/**
 * React hooks for Document AI operations
 */

import { useState, useCallback } from 'react';
import { aiServiceClient } from '@/lib/ai-service-client';

export function useDocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, tags: string[]) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await aiServiceClient.uploadDocument(file, tags);

      clearInterval(progressInterval);
      setProgress(100);

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  return { upload, uploading, progress, error };
}

export function useDocumentList() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const loadDocuments = useCallback(async (filters?: {
    tags?: string[];
    fileType?: string;
    skip?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await aiServiceClient.listDocuments(filters);
      setDocuments(response.documents || []);
      setTotal(response.total || 0);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load documents';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      await aiServiceClient.deleteDocument(documentId);
      setDocuments((prev) => prev.filter((doc) => doc.document_id !== documentId));
      setTotal((prev) => prev - 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document';
      setError(message);
      throw err;
    }
  }, []);

  const updateDocument = useCallback(async (documentId: string, updates: { tags?: string[] }) => {
    try {
      const result = await aiServiceClient.updateDocument(documentId, updates);
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.document_id === documentId ? { ...doc, ...updates } : doc
        )
      );
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update document';
      setError(message);
      throw err;
    }
  }, []);

  return {
    documents,
    loading,
    error,
    total,
    loadDocuments,
    deleteDocument,
    updateDocument,
  };
}

export function useDocumentSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [groupedResults, setGroupedResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (
    query: string,
    options?: {
      mode?: 'semantic' | 'keyword' | 'hybrid';
      tags?: string[];
      topK?: number;
      minScore?: number;
    }
  ) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await aiServiceClient.searchDocuments(query, options);
      setResults(response.results || []);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      throw err;
    } finally {
      setSearching(false);
    }
  }, []);

  const query = useCallback(async (options: {
    query: string;
    scope?: 'collection' | 'document' | 'tracking_ids';
    documentId?: string;
    trackingIds?: string[];
    mode?: 'semantic' | 'keyword' | 'hybrid';
    topK?: number;
    tags?: string[];
    minScore?: number;
    groupByDocument?: boolean;
  }) => {
    if (!options.query.trim()) {
      setResults([]);
      setGroupedResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await aiServiceClient.query(options);
      setResults(response.results || []);
      setGroupedResults(response.grouped_results || []);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Query failed';
      setError(message);
      throw err;
    } finally {
      setSearching(false);
    }
  }, []);

  const queryDocument = useCallback(async (
    documentId: string,
    query: string,
    options?: {
      mode?: 'semantic' | 'keyword' | 'hybrid';
      topK?: number;
      minScore?: number;
    }
  ) => {
    setSearching(true);
    setError(null);

    try {
      const response = await aiServiceClient.queryDocument(documentId, query, options);
      setResults(response.results || []);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Query failed';
      setError(message);
      throw err;
    } finally {
      setSearching(false);
    }
  }, []);

  return {
    results,
    groupedResults,
    searching,
    error,
    search,
    query,
    queryDocument,
  };
}

export function useDocumentDetail(documentId: string) {
  const [document, setDocument] = useState<any>(null);
  const [chunks, setChunks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [docResponse, chunksResponse] = await Promise.all([
        aiServiceClient.getDocument(documentId),
        aiServiceClient.getDocumentChunks(documentId),
      ]);

      setDocument(docResponse.document || docResponse);
      setChunks(chunksResponse.chunks || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load document';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  return { document, chunks, loading, error, loadDocument };
}
