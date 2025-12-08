/**
 * Document Search API Route
 *
 * POST /api/document/search
 * Search across documents using vector similarity and keyword search.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiSuccessResponse, SearchResponse } from '@/types/document';
import { defaultSearchService } from '@/lib/document/search-service';
import {
  requireAuth,
  checkSearchRateLimit,
  createErrorResponse,
  createValidationErrorResponse,
  createServerErrorResponse,
} from '@/lib/middleware/document-auth';
import { searchQuerySchema } from '@/lib/validations/document';

/**
 * Handle document search
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    // Check rate limit
    const rateLimitResult = checkSearchRateLimit(user.id);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.error;
    }

    // Parse request body
    const body = await request.json();

    // Validate search query
    const validation = searchQuerySchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      );
      return createValidationErrorResponse(errors);
    }

    const searchQuery = {
      ...validation.data,
      userId: user.id, // Ensure user can only search their own documents
    };

    // Perform search
    const results = await defaultSearchService.search(searchQuery);

    const response: ApiSuccessResponse<SearchResponse> = {
      success: true,
      data: results,
      metadata: {
        processingTime: `${results.processingTime}ms`,
        searchMode: results.searchMode,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'X-Search-Mode': results.searchMode,
        'X-Processing-Time': `${results.processingTime}ms`,
        'X-Total-Results': String(results.totalResults),
      },
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return createServerErrorResponse(error);
  }
}

/**
 * Get search endpoint info
 */
export async function GET(request: NextRequest) {
  const info = {
    endpoint: '/api/document/search',
    method: 'POST',
    description: 'Search across documents using semantic, keyword, or hybrid search',
    authentication: 'Required',
    rateLimit: '60 searches per minute',
    requestBody: {
      query: {
        type: 'string',
        required: true,
        description: 'Search query text',
      },
      mode: {
        type: 'enum',
        required: false,
        default: 'hybrid',
        options: ['semantic', 'keyword', 'hybrid', 'visual'],
        description: 'Search mode',
      },
      trackingIds: {
        type: 'string[]',
        required: false,
        description: 'Filter by specific documents',
      },
      tags: {
        type: 'string[]',
        required: false,
        description: 'Filter by tags',
      },
      dateRange: {
        type: 'object',
        required: false,
        description: 'Filter by date range',
        properties: {
          from: 'ISO date string',
          to: 'ISO date string',
        },
      },
      topK: {
        type: 'number',
        required: false,
        default: 10,
        description: 'Number of results to return',
      },
      minScore: {
        type: 'number',
        required: false,
        default: 0.5,
        description: 'Minimum similarity score (0-1)',
      },
      offset: {
        type: 'number',
        required: false,
        default: 0,
        description: 'Pagination offset',
      },
      limit: {
        type: 'number',
        required: false,
        default: 10,
        description: 'Results per page',
      },
      includeMetadata: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Include document metadata',
      },
      includeContent: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Include chunk content',
      },
      rerank: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Apply reranking algorithm',
      },
    },
  };

  return NextResponse.json(info);
}
