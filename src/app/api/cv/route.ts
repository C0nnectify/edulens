// GET /api/cv - List all CVs for authenticated user
// POST /api/cv - Create new CV (validated)

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { CVModel } from '@/lib/db/models/CV';
import { resumeSchema, paginationSchema } from '@/lib/validations/resume';
import {
  authenticateRequest,
  errorResponse,
  successResponse,
  handleApiError,
  handleValidationError,
  checkRateLimit,
} from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated || !authResult.user) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    const user = authResult.user;

    if (!checkRateLimit(user.id, 100, 60000)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    const searchParams = req.nextUrl.searchParams;
    const paginationParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      sort: searchParams.get('sort') || '-createdAt',
      search: searchParams.get('search') || undefined,
    };

    const validation = paginationSchema.safeParse(paginationParams);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const { page, limit, sort, search } = validation.data;

    await connectDB();

    const query: Record<string, unknown> = { userId: user.id };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
      ];
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDirection = sort.startsWith('-') ? -1 : 1;

    const [cvs, totalCount] = await Promise.all([
      CVModel.find(query)
        .sort({ [sortField]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CVModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return successResponse({
      cvs,
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

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated || !authResult.user) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    const user = authResult.user;

    if (!checkRateLimit(user.id, 20, 60000)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    const body = await req.json();
    const validation = resumeSchema.safeParse(body);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    await connectDB();

    const count = await CVModel.countDocuments({ userId: user.id });
    if (count >= 20) {
      return errorResponse('CV limit reached. Please delete existing CVs before creating new ones.', 403);
    }

    const cvData = {
      ...validation.data,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const cv = await CVModel.create(cvData);

    return successResponse(
      {
        id: cv._id.toString(),
        ...cv.toObject(),
      },
      'CV created successfully',
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
