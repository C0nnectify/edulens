import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { ObjectId } from 'mongodb';

/**
 * POST /api/resume/:id/duplicate
 * Duplicate an existing resume
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid resume ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const sourceResume = await ResumeModel.findById(id).lean();

    if (!sourceResume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Create duplicate with new title and reset metadata
    const duplicatedResume: any = {
      ...sourceResume,
      _id: undefined,
      title: title || `${sourceResume.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        ...sourceResume.metadata,
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
