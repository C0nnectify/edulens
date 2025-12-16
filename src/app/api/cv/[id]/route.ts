import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { CVModel } from '@/lib/db/models/CV';
import { ObjectId } from 'mongodb';
import { authenticateRequest, handleValidationError } from '@/lib/api-utils';
import { updateResumeSchema } from '@/lib/validations/resume';

export async function GET(
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

    const user = authResult.user;

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CV ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const cv = await CVModel.findOne({ _id: id, userId: user.id }).lean<
      Record<string, unknown> & { _id: unknown }
    >();
    if (!cv) {
      return NextResponse.json(
        { success: false, error: 'CV not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cv: {
        ...cv,
        _id: String(cv._id),
      },
    });
  } catch (error) {
    console.error('Error fetching CV:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CV' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const user = authResult.user;

    const { id } = params;
    const updates = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CV ID' },
        { status: 400 }
      );
    }

    const validation = updateResumeSchema.safeParse(updates);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    await connectDB();

    const result = await CVModel.findOneAndUpdate(
      { _id: id, userId: user.id },
      { $set: { ...validation.data, updatedAt: new Date() } },
      { new: true }
    ).lean<Record<string, unknown> & { _id: unknown }>();

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'CV not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cv: {
        ...result,
        _id: String(result._id),
      },
    });
  } catch (error) {
    console.error('Error updating CV:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update CV' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const user = authResult.user;

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CV ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await CVModel.findOneAndDelete({ _id: id, userId: user.id });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'CV not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'CV deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting CV:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete CV' },
      { status: 500 }
    );
  }
}
