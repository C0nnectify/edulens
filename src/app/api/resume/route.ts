// GET /api/resume - List all resumes for authenticated user
// POST /api/resume - Create new resume

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { resumeSchema, paginationSchema } from '@/lib/validations/resume';
import {
  authenticateRequest,
  errorResponse,
  successResponse,
  handleApiError,
  handleValidationError,
  checkRateLimit,
} from '@/lib/api-utils';
import { z } from 'zod';

// GET: List all resumes for authenticated user
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    // Rate limiting
    if (!checkRateLimit(authResult.user.id, 100, 60000)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const paginationParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      sort: searchParams.get('sort') || '-createdAt',
      search: searchParams.get('search') || undefined,
    };

    // Validate pagination
    const validation = paginationSchema.safeParse(paginationParams);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const { page, limit, sort, search } = validation.data;

    // Connect to database
    await connectDB();

    // Build query
    const query: any = { userId: authResult.user.id };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
      ];
    }

    // Parse sort parameter
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDirection = sort.startsWith('-') ? -1 : 1;

    // Execute query with pagination
    const [resumes, totalCount] = await Promise.all([
      ResumeModel
        .find(query)
        .sort({ [sortField]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ResumeModel.countDocuments(query),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    // Log access
    console.log(`User ${authResult.user.id} fetched ${resumes.length} resumes`);

    return successResponse({
      resumes,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Create new resume
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    // Rate limiting
    if (!checkRateLimit(authResult.user.id, 20, 60000)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    // Parse request body
    const body = await req.json();

    // Validate input
    const validation = resumeSchema.safeParse(body);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    // Connect to database
    await connectDB();

    // Check user's resume count (limit to prevent abuse)
    const resumeCount = await ResumeModel.countDocuments({
      userId: authResult.user.id
    });

    if (resumeCount >= 20) {
      return errorResponse('Resume limit reached. Please delete existing resumes before creating new ones.', 403);
    }

    // Create resume document
    const resumeData = {
      ...validation.data,
      userId: authResult.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    const resume = await ResumeModel.create(resumeData);

    // Log creation
    console.log(`User ${authResult.user.id} created resume ${resume._id}`);

    return successResponse(
      {
        id: resume._id.toString(),
        ...resume.toObject()
      },
      'Resume created successfully',
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS: Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}