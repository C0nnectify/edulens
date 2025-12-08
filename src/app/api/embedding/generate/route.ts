/**
 * Embedding Generation API Route
 *
 * POST /api/embedding/generate
 * Generate vector embeddings for text using configured embedding service.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiSuccessResponse, GenerateEmbeddingResponse } from '@/types/document';
import { defaultEmbeddingService, estimateEmbeddingCost } from '@/lib/document/embedding-service';
import {
  requireAuth,
  createValidationErrorResponse,
  createServerErrorResponse,
} from '@/lib/middleware/document-auth';
import { generateEmbeddingSchema } from '@/lib/validations/document';

/**
 * Handle embedding generation
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    // Parse request body
    const body = await request.json();

    // Validate request
    const validation = generateEmbeddingSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      );
      return createValidationErrorResponse(errors);
    }

    const { text, model, normalize } = validation.data;

    // Estimate cost
    const estimatedCost = estimateEmbeddingCost(text, model);

    // Generate embeddings
    const result = await defaultEmbeddingService.generateEmbedding({
      text,
      model,
      normalize,
    });

    const response: ApiSuccessResponse<GenerateEmbeddingResponse> = {
      success: true,
      data: result,
      metadata: {
        estimatedCost: `$${estimatedCost.toFixed(6)}`,
        actualCost: result.usage?.cost
          ? `$${result.usage.cost.toFixed(6)}`
          : undefined,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'X-Embedding-Model': result.model,
        'X-Embedding-Dimensions': String(result.dimensions),
        'X-Token-Usage': String(result.usage?.tokens || 0),
      },
    });
  } catch (error: any) {
    console.error('Embedding generation error:', error);
    return createServerErrorResponse(error);
  }
}

/**
 * Get endpoint info
 */
export async function GET(request: NextRequest) {
  const info = {
    endpoint: '/api/embedding/generate',
    method: 'POST',
    description: 'Generate vector embeddings for text',
    authentication: 'Required',
    requestBody: {
      text: {
        type: 'string | string[]',
        required: true,
        description: 'Text(s) to generate embeddings for',
      },
      model: {
        type: 'string',
        required: false,
        default: 'text-embedding-3-small',
        description: 'Embedding model to use',
        options: [
          'text-embedding-3-small',
          'text-embedding-3-large',
          'text-embedding-ada-002',
        ],
      },
      normalize: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Normalize vectors to unit length',
      },
    },
    pricing: {
      'text-embedding-3-small': '$0.02 per 1M tokens',
      'text-embedding-3-large': '$0.13 per 1M tokens',
      'text-embedding-ada-002': '$0.10 per 1M tokens',
    },
  };

  return NextResponse.json(info);
}
