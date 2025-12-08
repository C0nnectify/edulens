/**
 * Document Search Service
 *
 * Service for searching documents using vector similarity and keyword search.
 */

import {
  type SearchQuery,
  type SearchResponse,
  type SearchResult,
  SearchMode,
  type DocumentMetadata,
  type DocumentChunk,
} from '@/types/document';

import {
  getDocumentsCollection,
  getUserVectorCollection,
} from '@/lib/db/document-db';

import { EmbeddingService } from './embedding-service';
import { Filter } from 'mongodb';

// ============================================================================
// Search Service Class
// ============================================================================

export class SearchService {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Search documents
   */
  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      // Validate user has documents
      const vectorCollection = await getUserVectorCollection(query.userId);
      const hasDocuments = (await vectorCollection.estimatedDocumentCount()) > 0;

      if (!hasDocuments) {
        return {
          results: [],
          totalResults: 0,
          query: query.query,
          searchMode: query.mode,
          processingTime: Date.now() - startTime,
          hasMore: false,
        };
      }

      // Execute search based on mode
      let results: SearchResult[] = [];

      switch (query.mode) {
        case SearchMode.SEMANTIC:
          results = await this.semanticSearch(query);
          break;

        case SearchMode.KEYWORD:
          results = await this.keywordSearch(query);
          break;

        case SearchMode.HYBRID:
          results = await this.hybridSearch(query);
          break;

        case SearchMode.VISUAL:
          results = await this.visualSearch(query);
          break;

        default:
          throw new Error(`Unsupported search mode: ${query.mode}`);
      }

      // Apply post-processing filters
      results = this.applyPostFilters(results, query);

      // Rerank if requested
      if (query.rerank && results.length > 0) {
        results = await this.rerankResults(results, query.query);
      }

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 10;
      const paginatedResults = results.slice(offset, offset + limit);

      const processingTime = Date.now() - startTime;

      return {
        results: paginatedResults,
        totalResults: results.length,
        query: query.query,
        searchMode: query.mode,
        processingTime,
        hasMore: offset + limit < results.length,
        nextOffset: offset + limit < results.length ? offset + limit : undefined,
      };
    } catch (error: any) {
      console.error('Search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Semantic search using vector similarity
   */
  private async semanticSearch(query: SearchQuery): Promise<SearchResult[]> {
    // Generate query embedding
    const embeddingResult = await this.embeddingService.generateEmbedding({
      text: query.query,
    });

    const queryEmbedding = Array.isArray(embeddingResult.embeddings[0])
      ? embeddingResult.embeddings[0]
      : embeddingResult.embeddings;

    // Build MongoDB aggregation pipeline for vector search
    const vectorCollection = await getUserVectorCollection(query.userId);

    // Build filter
    const filter = this.buildFilter(query);

    // MongoDB Atlas Vector Search (requires Atlas Search index)
    // Note: This requires MongoDB Atlas with vector search capability
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: 'vector_index', // Name of the vector search index
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: (query.topK || 10) * 10, // Search more candidates
          limit: query.topK || 10,
          filter: filter,
        },
      },
      {
        $addFields: {
          score: { $meta: 'vectorSearchScore' },
        },
      },
      {
        $match: {
          score: { $gte: query.minScore || 0.5 },
        },
      },
    ];

    try {
      const chunks = await vectorCollection.aggregate(pipeline).toArray();

      // Convert to search results
      return await this.chunksToSearchResults(
        chunks as DocumentChunk[],
        query,
        'semantic'
      );
    } catch (error: any) {
      // Fallback to cosine similarity if vector search is not available
      console.warn('Vector search not available, using fallback:', error.message);
      return this.fallbackSemanticSearch(query, queryEmbedding as number[]);
    }
  }

  /**
   * Fallback semantic search using manual cosine similarity
   */
  private async fallbackSemanticSearch(
    query: SearchQuery,
    queryEmbedding: number[]
  ): Promise<SearchResult[]> {
    const vectorCollection = await getUserVectorCollection(query.userId);
    const filter = this.buildFilter(query);

    // Fetch all chunks (or a subset)
    const chunks = await vectorCollection
      .find(filter)
      .limit(1000) // Limit to prevent memory issues
      .toArray();

    // Calculate cosine similarity for each chunk
    const scoredChunks = chunks.map(chunk => ({
      ...chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    // Sort by score and filter
    const filteredChunks = scoredChunks
      .filter(chunk => chunk.score >= (query.minScore || 0.5))
      .sort((a, b) => b.score - a.score)
      .slice(0, query.topK || 10);

    return this.chunksToSearchResults(filteredChunks, query, 'semantic');
  }

  /**
   * Keyword search using text search
   */
  private async keywordSearch(query: SearchQuery): Promise<SearchResult[]> {
    const vectorCollection = await getUserVectorCollection(query.userId);
    const filter = this.buildFilter(query);

    // Add text search to filter
    const searchFilter = {
      ...filter,
      $text: { $search: query.query },
    };

    try {
      // MongoDB text search
      const chunks = await vectorCollection
        .find(searchFilter, {
          score: { $meta: 'textScore' },
        })
        .sort({ score: { $meta: 'textScore' } })
        .limit(query.topK || 10)
        .toArray();

      return this.chunksToSearchResults(chunks as DocumentChunk[], query, 'keyword');
    } catch (error: any) {
      // Fallback to regex search if text index doesn't exist
      console.warn('Text search not available, using regex fallback');
      return this.fallbackKeywordSearch(query);
    }
  }

  /**
   * Fallback keyword search using regex
   */
  private async fallbackKeywordSearch(query: SearchQuery): Promise<SearchResult[]> {
    const vectorCollection = await getUserVectorCollection(query.userId);
    const filter = this.buildFilter(query);

    const searchFilter = {
      ...filter,
      content: { $regex: query.query, $options: 'i' },
    };

    const chunks = await vectorCollection
      .find(searchFilter)
      .limit(query.topK || 10)
      .toArray();

    return this.chunksToSearchResults(chunks as DocumentChunk[], query, 'keyword');
  }

  /**
   * Hybrid search (combines semantic and keyword)
   */
  private async hybridSearch(query: SearchQuery): Promise<SearchResult[]> {
    // Run both searches in parallel
    const [semanticResults, keywordResults] = await Promise.all([
      this.semanticSearch(query),
      this.keywordSearch(query),
    ]);

    // Merge and deduplicate results using reciprocal rank fusion
    const mergedResults = this.reciprocalRankFusion(
      semanticResults,
      keywordResults,
      query.topK || 10
    );

    return mergedResults;
  }

  /**
   * Visual search (for images)
   */
  private async visualSearch(query: SearchQuery): Promise<SearchResult[]> {
    // TODO: Implement visual similarity search
    // This would require visual embeddings (e.g., CLIP)
    throw new Error('Visual search not yet implemented');
  }

  /**
   * Build MongoDB filter from query
   */
  private buildFilter(query: SearchQuery): Filter<DocumentChunk> {
    const filter: Filter<DocumentChunk> = {
      userId: query.userId,
    };

    if (query.trackingIds && query.trackingIds.length > 0) {
      filter.trackingId = { $in: query.trackingIds };
    }

    if (query.tags && query.tags.length > 0) {
      filter.tags = { $in: query.tags };
    }

    if (query.dateRange) {
      filter.createdAt = {};
      if (query.dateRange.from) {
        filter.createdAt.$gte = query.dateRange.from;
      }
      if (query.dateRange.to) {
        filter.createdAt.$lte = query.dateRange.to;
      }
    }

    return filter;
  }

  /**
   * Convert chunks to search results
   */
  private async chunksToSearchResults(
    chunks: any[],
    query: SearchQuery,
    searchType: string
  ): Promise<SearchResult[]> {
    // Get document metadata if requested
    let documentsMap = new Map<string, DocumentMetadata>();

    if (query.includeMetadata) {
      const trackingIds = [...new Set(chunks.map(c => c.trackingId))];
      const documentsCollection = await getDocumentsCollection();
      const documents = await documentsCollection
        .find({ trackingId: { $in: trackingIds } })
        .toArray();

      documents.forEach(doc => {
        documentsMap.set(doc.trackingId, doc);
      });
    }

    // Build search results
    return chunks.map(chunk => {
      const result: SearchResult = {
        chunkId: chunk.chunkId,
        trackingId: chunk.trackingId,
        content: query.includeContent ? chunk.content : '',
        score: chunk.score || 1.0,
        metadata: chunk.metadata,
      };

      if (query.includeMetadata && documentsMap.has(chunk.trackingId)) {
        const docMetadata = documentsMap.get(chunk.trackingId)!;
        result.documentTitle = docMetadata.title || docMetadata.fileName;
        result.documentMetadata = {
          fileName: docMetadata.fileName,
          documentType: docMetadata.documentType,
          uploadDate: docMetadata.uploadDate,
          tags: docMetadata.tags,
        };
      }

      // Generate highlights for keyword search
      if (searchType === 'keyword') {
        result.highlights = this.generateHighlights(chunk.content, query.query);
      }

      return result;
    });
  }

  /**
   * Apply post-processing filters
   */
  private applyPostFilters(
    results: SearchResult[],
    query: SearchQuery
  ): SearchResult[] {
    return results.filter(result => result.score >= (query.minScore || 0.5));
  }

  /**
   * Rerank search results
   */
  private async rerankResults(
    results: SearchResult[],
    query: string
  ): Promise<SearchResult[]> {
    // TODO: Implement reranking using cross-encoder or similar
    // For now, just return as-is
    return results;
  }

  /**
   * Reciprocal rank fusion for combining results
   */
  private reciprocalRankFusion(
    list1: SearchResult[],
    list2: SearchResult[],
    k: number = 60
  ): SearchResult[] {
    const scores = new Map<string, { result: SearchResult; score: number }>();

    // Calculate RRF scores for list1
    list1.forEach((result, index) => {
      const rrfScore = 1 / (k + index + 1);
      scores.set(result.chunkId, { result, score: rrfScore });
    });

    // Add RRF scores for list2
    list2.forEach((result, index) => {
      const rrfScore = 1 / (k + index + 1);
      const existing = scores.get(result.chunkId);

      if (existing) {
        existing.score += rrfScore;
      } else {
        scores.set(result.chunkId, { result, score: rrfScore });
      }
    });

    // Sort by combined score
    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .map(item => ({
        ...item.result,
        score: item.score,
      }));
  }

  /**
   * Calculate cosine similarity
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate text highlights
   */
  private generateHighlights(text: string, query: string): string[] {
    const highlights: string[] = [];
    const words = query.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (words.some(word => lowerSentence.includes(word))) {
        highlights.push(sentence.trim());
        if (highlights.length >= 3) break;
      }
    }

    return highlights;
  }
}

// ============================================================================
// Export Default Instance
// ============================================================================

/**
 * Default search service instance
 */
export const defaultSearchService = new SearchService();
