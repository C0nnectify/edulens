/**
 * Embedding Generation Service
 *
 * Service for generating vector embeddings using various providers.
 * Supports OpenAI, Cohere, and other embedding models.
 */

import type { GenerateEmbeddingRequest, GenerateEmbeddingResponse } from '@/types/document';

// ============================================================================
// Configuration
// ============================================================================

export interface EmbeddingConfig {
  provider: 'openai' | 'cohere' | 'local';
  model: string;
  apiKey?: string;
  dimensions?: number;
  batchSize?: number; // Max items per batch
}

const DEFAULT_CONFIG: EmbeddingConfig = {
  provider: 'openai',
  model: 'text-embedding-3-small',
  dimensions: 1536,
  batchSize: 100,
};

// ============================================================================
// Embedding Service Class
// ============================================================================

export class EmbeddingService {
  private config: EmbeddingConfig;

  constructor(config: Partial<EmbeddingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Get API key from environment if not provided
    if (!this.config.apiKey) {
      this.config.apiKey = this.getApiKey();
    }
  }

  /**
   * Get API key from environment based on provider
   */
  private getApiKey(): string {
    switch (this.config.provider) {
      case 'openai':
        return process.env.OPENAI_API_KEY || '';
      case 'cohere':
        return process.env.COHERE_API_KEY || '';
      default:
        return '';
    }
  }

  /**
   * Generate embeddings for text(s)
   */
  async generateEmbedding(
    request: GenerateEmbeddingRequest
  ): Promise<GenerateEmbeddingResponse> {
    const texts = Array.isArray(request.text) ? request.text : [request.text];
    const model = request.model || this.config.model;
    const normalize = request.normalize ?? true;

    // Handle empty input
    if (texts.length === 0 || texts.every(t => !t.trim())) {
      throw new Error('No valid text provided for embedding generation');
    }

    // Generate embeddings based on provider
    const result = await this.generateWithProvider(texts, model, normalize);

    return result;
  }

  /**
   * Generate embeddings with specific provider
   */
  private async generateWithProvider(
    texts: string[],
    model: string,
    normalize: boolean
  ): Promise<GenerateEmbeddingResponse> {
    switch (this.config.provider) {
      case 'openai':
        return this.generateWithOpenAI(texts, model, normalize);
      case 'cohere':
        return this.generateWithCohere(texts, model, normalize);
      case 'local':
        return this.generateWithLocal(texts, model, normalize);
      default:
        throw new Error(`Unsupported embedding provider: ${this.config.provider}`);
    }
  }

  /**
   * Generate embeddings using OpenAI
   */
  private async generateWithOpenAI(
    texts: string[],
    model: string,
    normalize: boolean
  ): Promise<GenerateEmbeddingResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const startTime = Date.now();

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          input: texts,
          model: model || 'text-embedding-3-small',
          encoding_format: 'float',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      // Extract embeddings
      const embeddings = data.data
        .sort((a: any, b: any) => a.index - b.index)
        .map((item: any) => item.embedding);

      // Normalize if requested
      const finalEmbeddings = normalize
        ? embeddings.map((emb: number[]) => normalizeVector(emb))
        : embeddings;

      return {
        embeddings: texts.length === 1 ? finalEmbeddings[0] : finalEmbeddings,
        model: data.model,
        dimensions: finalEmbeddings[0].length,
        usage: {
          tokens: data.usage.total_tokens,
          cost: calculateOpenAICost(data.usage.total_tokens, model),
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to generate embeddings with OpenAI: ${error.message}`);
    }
  }

  /**
   * Generate embeddings using Cohere
   */
  private async generateWithCohere(
    texts: string[],
    model: string,
    normalize: boolean
  ): Promise<GenerateEmbeddingResponse> {
    if (!this.config.apiKey) {
      throw new Error('Cohere API key is required');
    }

    try {
      const response = await fetch('https://api.cohere.ai/v1/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          texts: texts,
          model: model || 'embed-english-v3.0',
          input_type: 'search_document',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Cohere API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      const embeddings = data.embeddings;

      const finalEmbeddings = normalize
        ? embeddings.map((emb: number[]) => normalizeVector(emb))
        : embeddings;

      return {
        embeddings: texts.length === 1 ? finalEmbeddings[0] : finalEmbeddings,
        model: model || 'embed-english-v3.0',
        dimensions: finalEmbeddings[0].length,
      };
    } catch (error: any) {
      throw new Error(`Failed to generate embeddings with Cohere: ${error.message}`);
    }
  }

  /**
   * Generate embeddings using local model
   * TODO: Implement local embedding generation
   */
  private async generateWithLocal(
    texts: string[],
    model: string,
    normalize: boolean
  ): Promise<GenerateEmbeddingResponse> {
    throw new Error('Local embedding generation not yet implemented');
  }

  /**
   * Batch process texts for embedding
   */
  async batchGenerateEmbeddings(
    texts: string[],
    options?: { batchSize?: number; onProgress?: (progress: number) => void }
  ): Promise<number[][]> {
    const batchSize = options?.batchSize || this.config.batchSize || 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const result = await this.generateEmbedding({ text: batch });

      const embeddings = Array.isArray(result.embeddings[0])
        ? (result.embeddings as number[][])
        : [result.embeddings as number[]];

      allEmbeddings.push(...embeddings);

      // Report progress
      if (options?.onProgress) {
        const progress = Math.min(100, ((i + batch.length) / texts.length) * 100);
        options.onProgress(progress);
      }
    }

    return allEmbeddings;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(a: number[], b: number[]): number {
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
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalize vector to unit length
 */
export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude === 0 ? vector : vector.map(val => val / magnitude);
}

/**
 * Calculate OpenAI embedding cost
 * Pricing as of 2024 (verify current pricing)
 */
function calculateOpenAICost(tokens: number, model: string): number {
  const pricePerToken: Record<string, number> = {
    'text-embedding-3-small': 0.00000002, // $0.02 per 1M tokens
    'text-embedding-3-large': 0.00000013, // $0.13 per 1M tokens
    'text-embedding-ada-002': 0.0000001, // $0.10 per 1M tokens
  };

  return tokens * (pricePerToken[model] || pricePerToken['text-embedding-3-small']);
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Estimate embedding cost
 */
export function estimateEmbeddingCost(
  text: string | string[],
  model: string = 'text-embedding-3-small'
): number {
  const texts = Array.isArray(text) ? text : [text];
  const totalTokens = texts.reduce((sum, t) => sum + estimateTokenCount(t), 0);
  return calculateOpenAICost(totalTokens, model);
}

// ============================================================================
// Export Default Instance
// ============================================================================

/**
 * Default embedding service instance
 */
export const defaultEmbeddingService = new EmbeddingService();

/**
 * Generate embedding using default service
 */
export async function generateEmbedding(
  text: string | string[]
): Promise<GenerateEmbeddingResponse> {
  return defaultEmbeddingService.generateEmbedding({ text });
}
