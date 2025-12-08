// API utility functions for error handling and authentication

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export interface ApiError {
  error: string;
  message: string;
  details?: any;
  statusCode: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error response helper
export function errorResponse(
  message: string,
  statusCode: number = 400,
  details?: any
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: 'API Error',
      message,
      details,
      statusCode,
    },
    { status: statusCode }
  );
}

// Success response helper
export function successResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: statusCode }
  );
}

// Zod validation error handler
export function handleValidationError(error: ZodError): NextResponse<ApiError> {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return errorResponse('Validation failed', 400, errors);
}

// MongoDB error handler
export function handleMongoError(error: any): NextResponse<ApiError> {
  if (error.code === 11000) {
    return errorResponse('Duplicate entry found', 409, error.keyValue);
  }

  if (error.name === 'CastError') {
    return errorResponse('Invalid ID format', 400);
  }

  return errorResponse('Database operation failed', 500);
}

// Generic error handler
export function handleApiError(error: any): NextResponse<ApiError> {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return handleValidationError(error);
  }

  if (error instanceof mongoose.Error) {
    return handleMongoError(error);
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500);
  }

  return errorResponse('An unexpected error occurred', 500);
}

// Authentication middleware
export async function authenticateRequest(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return {
        authenticated: false,
        user: null,
        error: 'Authentication required',
      };
    }

    return {
      authenticated: true,
      user: session.user,
      error: null,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      user: null,
      error: 'Authentication failed',
    };
  }
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (userLimit.count >= limit) {
    return false;
  }

  userLimit.count++;
  return true;
}

// CORS headers helper
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}