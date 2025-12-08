import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { ObjectId } from 'mongodb';

/**
 * GET /api/resume/:id
 * Get a specific resume by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid resume ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const resume = await ResumeModel.findById(id).lean();

    if (!resume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      resume: {
        ...resume,
        _id: resume._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/resume/:id
 * Update a resume
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid resume ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Remove fields that shouldn't be updated directly
    const { _id, userId, createdAt, ...allowedUpdates } = updates;

    const result = await ResumeModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...allowedUpdates,
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      resume: {
        ...result,
        _id: result._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update resume' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resume/:id
 * Delete a resume
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid resume ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await ResumeModel.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
