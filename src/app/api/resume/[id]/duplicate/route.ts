import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '@/lib/api-utils';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/**
 * POST /api/resume/:id/duplicate
 * Duplicate an existing resume
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = asRecord(await request.json());
    const title = typeof body.title === 'string' ? body.title : undefined;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid resume ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const sourceResume = await ResumeModel.findOne({ _id: id, userId: authResult.user.id }).lean<Record<string, unknown>>();

    if (!sourceResume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Create duplicate with new title and reset metadata
    const sourceTitle = typeof sourceResume.title === 'string' ? sourceResume.title : 'Untitled Resume';
    const sourceMetadata = asRecord(sourceResume.metadata);

    const duplicatedResume: Record<string, unknown> = {
      ...sourceResume,
      _id: undefined,
      userId: authResult.user.id,
      title: title || `${sourceTitle} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        ...sourceMetadata,
        version: 1,
        isFavorite: false,
      },
    };

    const result = await ResumeModel.create(duplicatedResume);

    return NextResponse.json({
      success: true,
      resume: {
        ...result.toObject(),
        _id: result._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error duplicating resume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to duplicate resume' },
      { status: 500 }
    );
  }
}
