/**
 * AI Service Client
 *
 * Client for communicating with FastAPI AI service via Next.js proxy
 * All requests go through /api/ai/[...path] which handles authentication
 */

/**
 * AI Service Client - Simplified version using Next.js proxy
 * No need for token management - handled by proxy
 */
export class AIServiceClient {
  private proxyBaseUrl: string;

  constructor() {
    this.proxyBaseUrl = '/api/ai'; // Next.js proxy endpoint
  }

  /**
   * Make a request through Next.js proxy
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.proxyBaseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
          const error = await response.json();
          errorMessage = error.error || error.detail || error.message || `Request failed with status ${response.status}`;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `Request failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('AI Service request error:', error);
      throw error;
    }
  }

  /**
   * Upload a file to the AI service
   */
  async uploadDocument(
    file: File,
    tags?: string[]
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (tags && tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }

    const response = await fetch(`${this.proxyBaseUrl}/documents/upload`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type - browser will set it with boundary for FormData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.detail || 'Upload failed');
    }

    return await response.json();
  }

  /**
   * Search documents
   */
  async searchDocuments(
    query: string,
    options: {
      searchType?: 'semantic' | 'keyword' | 'hybrid';
      tags?: string[];
      documentId?: string;
      limit?: number;
    } = {}
  ): Promise<any> {
    return this.request('/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        search_type: options.searchType || 'semantic',
        tags: options.tags,
        document_id: options.documentId,
        limit: options.limit || 10,
      }),
    });
  }

  /**
   * List user documents
   */
  async listDocuments(
    filters: {
      tags?: string[];
      fileType?: string;
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<any> {
    const params = new URLSearchParams();
    if (filters.tags) params.set('tags', filters.tags.join(','));
    if (filters.fileType) params.set('file_type', filters.fileType);
    if (filters.skip !== undefined) params.set('skip', filters.skip.toString());
    if (filters.limit !== undefined) params.set('limit', filters.limit.toString());

    const queryString = params.toString();
    return this.request(`/documents${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  }

  /**
   * Get document details
   */
  async getDocument(documentId: string): Promise<any> {
    return this.request(`/documents/${documentId}`, {
      method: 'GET',
    });
  }

  /**
   * Update document tags
   */
  async updateDocument(
    documentId: string,
    updates: { tags?: string[] }
  ): Promise<any> {
    return this.request(`/documents/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<any> {
    return this.request(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get document chunks
   */
  async getDocumentChunks(documentId: string): Promise<any> {
    return this.request(`/documents/${documentId}/chunks`, {
      method: 'GET',
    });
  }

  /**
   * Generate embeddings
   */
  async generateEmbeddings(
    texts: string[],
    provider: 'openai' | 'huggingface' | 'cohere' = 'openai'
  ): Promise<any> {
    return this.request('/embeddings/generate', {
      method: 'POST',
      body: JSON.stringify({
        texts,
        provider,
      }),
    });
  }

  /**
   * Extract text from image (OCR)
   */
  async extractTextFromImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.proxyBaseUrl}/ocr/extract`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.detail || 'OCR extraction failed');
    }

    return await response.json();
  }

  /**
   * Find similar documents
   */
  async findSimilar(
    documentId: string,
    limit: number = 5
  ): Promise<any> {
    return this.request('/search/similar', {
      method: 'POST',
      body: JSON.stringify({
        document_id: documentId,
        limit,
      }),
    });
  }

  /**
   * List available embedding providers
   */
  async listEmbeddingProviders(): Promise<any> {
    return this.request('/embeddings/providers', {
      method: 'GET',
    });
  }

  /**
   * Query API - Enhanced query with multiple scope options
   */
  async query(options: {
    query: string;
    scope?: 'collection' | 'document' | 'tracking_ids';
    documentId?: string;
    trackingIds?: string[];
    mode?: 'semantic' | 'keyword' | 'hybrid';
    topK?: number;
    tags?: string[];
    minScore?: number;
    groupByDocument?: boolean;
    includeMetadata?: boolean;
  }): Promise<any> {
    return this.request('/query', {
      method: 'POST',
      body: JSON.stringify({
        query: options.query,
        scope: options.scope || 'collection',
        document_id: options.documentId,
        tracking_ids: options.trackingIds,
        mode: options.mode || 'semantic',
        top_k: options.topK || 10,
        tags: options.tags,
        min_score: options.minScore,
        group_by_document: options.groupByDocument || false,
        include_metadata: options.includeMetadata !== false,
      }),
    });
  }

  /**
   * Query entire user collection
   */
  async queryCollection(
    query: string,
    options: {
      mode?: 'semantic' | 'keyword' | 'hybrid';
      topK?: number;
      tags?: string[];
      minScore?: number;
    } = {}
  ): Promise<any> {
    const params = new URLSearchParams({
      query,
      mode: options.mode || 'semantic',
      top_k: (options.topK || 10).toString(),
    });

    if (options.tags) params.set('tags', JSON.stringify(options.tags));
    if (options.minScore) params.set('min_score', options.minScore.toString());

    return this.request(`/query/collection?${params.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Query specific document
   */
  async queryDocument(
    documentId: string,
    query: string,
    options: {
      mode?: 'semantic' | 'keyword' | 'hybrid';
      topK?: number;
      minScore?: number;
    } = {}
  ): Promise<any> {
    const params = new URLSearchParams({
      query,
      mode: options.mode || 'semantic',
      top_k: (options.topK || 10).toString(),
    });

    if (options.minScore) params.set('min_score', options.minScore.toString());

    return this.request(`/query/document/${documentId}?${params.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Query by tracking IDs (query across multiple documents)
   */
  async queryByTrackingIds(
    trackingIds: string[],
    query: string,
    options: {
      mode?: 'semantic' | 'keyword' | 'hybrid';
      topK?: number;
      groupByDocument?: boolean;
      minScore?: number;
    } = {}
  ): Promise<any> {
    return this.request('/query/tracking', {
      method: 'POST',
      body: JSON.stringify({
        tracking_ids: trackingIds,
        query,
        mode: options.mode || 'semantic',
        top_k: options.topK || 10,
        group_by_document: options.groupByDocument || false,
        min_score: options.minScore,
      }),
    });
  }
}

// Export singleton instance
export const aiServiceClient = new AIServiceClient();
