// POST /api/resume/sections - Add or update custom sections
// DELETE /api/resume/sections - Remove a custom section

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import {
  authenticateRequest,
  errorResponse,
  successResponse,
  handleApiError,
  checkRateLimit,
} from '@/lib/api-utils';
import { z } from 'zod';

const customSectionSchema = z.object({
  resumeId: z.string(),
  section: z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Section title is required'),
    content: z.union([z.string(), z.array(z.string())]).optional(),
    items: z.array(z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      bullets: z.array(z.string()).optional(),
    })).optional(),
    type: z.enum(['text', 'list', 'table']).optional(),
    order: z.number(),
  }),
});

// POST: Add or update custom section
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    // Rate limiting
    if (!checkRateLimit(authResult.user.id, 50, 60000)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    // Parse request body
    const body = await req.json();

    // Validate input
    const validation = customSectionSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse('Invalid input: ' + validation.error.errors[0].message, 400);
    }

    const { resumeId, section } = validation.data;

    // Connect to database
    await connectDB();

    // Find resume and verify ownership
    const resume = await ResumeModel.findById(resumeId);
    if (!resume) {
      return errorResponse('Resume not found', 404);
    }

    if (resume.userId !== authResult.user.id) {
      return errorResponse('Unauthorized access to resume', 403);
    }

    // Add or update custom section
    const customSections = resume.customSections || [];

    if (section.id) {
      // Update existing section
      const index = customSections.findIndex((s: any) => s.id === section.id);
      if (index >= 0) {
        customSections[index] = section;
      } else {
        customSections.push(section);
      }
    } else {
      // Add new section
      section.id = crypto.randomUUID();
      customSections.push(section);
    }

    // Update resume
    resume.customSections = customSections;
    resume.updatedAt = new Date();
    await resume.save();

    // Log update
    console.log(`User ${authResult.user.id} updated custom sections for resume ${resumeId}`);

    return successResponse({
      customSections: resume.customSections,
      updatedAt: resume.updatedAt,
    }, 'Custom section updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE: Remove custom section
export async function DELETE(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    // Rate limiting
    if (!checkRateLimit(authResult.user.id, 50, 60000)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const resumeId = searchParams.get('resumeId');
    const sectionId = searchParams.get('sectionId');

    if (!resumeId || !sectionId) {
      return errorResponse('Missing resumeId or sectionId', 400);
    }

    // Connect to database
    await connectDB();

    // Find resume and verify ownership
    const resume = await ResumeModel.findById(resumeId);
    if (!resume) {
      return errorResponse('Resume not found', 404);
    }

    if (resume.userId !== authResult.user.id) {
      return errorResponse('Unauthorized access to resume', 403);
    }

    // Remove custom section
    const customSections = resume.customSections || [];
    resume.customSections = customSections.filter((s: any) => s.id !== sectionId);
    resume.updatedAt = new Date();
    await resume.save();

    // Log deletion
    console.log(`User ${authResult.user.id} deleted custom section ${sectionId} from resume ${resumeId}`);

    return successResponse({
      customSections: resume.customSections,
      updatedAt: resume.updatedAt,
    }, 'Custom section deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT: Reorder custom sections
export async function PUT(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    // Rate limiting
    if (!checkRateLimit(authResult.user.id, 50, 60000)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    // Parse request body
    const body = await req.json();
    const { resumeId, sections } = body;

    if (!resumeId || !Array.isArray(sections)) {
      return errorResponse('Invalid input: resumeId and sections array required', 400);
    }

    // Connect to database
    await connectDB();

    // Find resume and verify ownership
    const resume = await ResumeModel.findById(resumeId);
    if (!resume) {
      return errorResponse('Resume not found', 404);
    }

    if (resume.userId !== authResult.user.id) {
      return errorResponse('Unauthorized access to resume', 403);
    }

    // Update section order
    resume.customSections = sections;
    resume.updatedAt = new Date();
    await resume.save();

    // Log update
    console.log(`User ${authResult.user.id} reordered custom sections for resume ${resumeId}`);

    return successResponse({
      customSections: resume.customSections,
      updatedAt: resume.updatedAt,
    }, 'Custom sections reordered successfully');
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
