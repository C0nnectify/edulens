/**
 * Document API Authentication Middleware
 *
 * Middleware for authenticating users and managing document access control.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import type { ApiErrorResponse } from '@/types/document';

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Authenticated user context
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role || 'user',
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Require authentication middleware
 * Returns user if authenticated, otherwise returns error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in to access this resource.',
      },
    };

    return {
      error: NextResponse.json(errorResponse, { status: 401 }),
    };
  }

  return { user };
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'admin' || user.role === 'superadmin';
}

/**
 * Require admin role
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  const authResult = await requireAuth(request);

  if ('error' in authResult) {
    return authResult;
  }

  if (!isAdmin(authResult.user)) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required.',
      },
    };

    return {
      error: NextResponse.json(errorResponse, { status: 403 }),
    };
  }

  return authResult;
}

// ============================================================================
// Document Access Control
// ============================================================================

/**
 * Check if user has access to document
 */
export async function checkDocumentAccess(
  userId: string,
  documentUserId: string,
  user: AuthenticatedUser
): Promise<boolean> {
  // Admins have access to all documents
  if (isAdmin(user)) {
    return true;
  }

  // Users can only access their own documents
  return userId === documentUserId;
}

/**
 * Require document ownership
 */
export async function requireDocumentOwnership(
  request: NextRequest,
  documentUserId: string
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  const authResult = await requireAuth(request);

  if ('error' in authResult) {
    return authResult;
  }

  const hasAccess = await checkDocumentAccess(
    authResult.user.id,
    documentUserId,
    authResult.user
  );

  if (!hasAccess) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this document.',
      },
    };

    return {
      error: NextResponse.json(errorResponse, { status: 403 }),
    };
  }

  return authResult;
}

// ============================================================================
// Rate Limiting
// ============================================================================

/**
 * Simple in-memory rate limiter
 * In production, use Redis or a dedicated rate limiting service
 */
class RateLimiter {
  private requests = new Map<string, number[]>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {
    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Filter out old requests
    const recentRequests = requests.filter(time => now - time < this.windowMs);

    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const recentRequests = requests.filter(time => now - time < this.windowMs);

    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  /**
   * Get reset time
   */
  getResetTime(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    if (requests.length === 0) {
      return Date.now();
    }

    const oldestRequest = Math.min(...requests);
    return oldestRequest + this.windowMs;
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => now - time < this.windowMs);

      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// Create rate limiters for different endpoints
const uploadRateLimiter = new RateLimiter(10, 60000); // 10 uploads per minute
const searchRateLimiter = new RateLimiter(60, 60000); // 60 searches per minute
const generalRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

/**
 * Apply rate limiting
 */
export function checkRateLimit(
  identifier: string,
  limiter: RateLimiter = generalRateLimiter
): { allowed: true } | { allowed: false; error: NextResponse } {
  const allowed = limiter.isAllowed(identifier);

  if (!allowed) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        details: {
          resetTime: limiter.getResetTime(identifier),
        },
      },
    };

    return {
      allowed: false,
      error: NextResponse.json(errorResponse, {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(limiter.getResetTime(identifier)),
        },
      }),
    };
  }

  return { allowed: true };
}

/**
 * Apply upload rate limit
 */
export function checkUploadRateLimit(userId: string) {
  return checkRateLimit(`upload:${userId}`, uploadRateLimiter);
}

/**
 * Apply search rate limit
 */
export function checkSearchRateLimit(userId: string) {
  return checkRateLimit(`search:${userId}`, searchRateLimiter);
}

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * Create error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      ...(process.env.NODE_ENV === 'development' && details?.stack
        ? { stack: details.stack }
        : {}),
    },
  };

  return NextResponse.json(errorResponse, { status });
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(errors: string[]): NextResponse {
  return createErrorResponse(
    'VALIDATION_ERROR',
    'Request validation failed',
    400,
    { errors }
  );
}

/**
 * Create not found response
 */
export function createNotFoundResponse(resource: string = 'Resource'): NextResponse {
  return createErrorResponse('NOT_FOUND', `${resource} not found`, 404);
}

/**
 * Create server error response
 */
export function createServerErrorResponse(error: Error): NextResponse {
  console.error('Server error:', error);

  return createErrorResponse(
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred',
    500,
    process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
  );
}
