import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applications, deadlines } from '@/lib/data-store';
import type { UpdateDeadlineDto } from '@/types/notification';

// GET /api/applications/[id]/deadlines/[deadlineId] - Get a specific deadline
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deadlineId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: applicationId, deadlineId } = await params;

    const application = applications.get(applicationId);
    if (!application || application.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Application not found or unauthorized' },
        { status: 404 }
      );
    }

    const deadline = deadlines.get(deadlineId);
    if (!deadline || deadline.applicationId !== applicationId) {
      return NextResponse.json(
        { error: 'Deadline not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deadline,
    });
  } catch (error) {
    console.error('[Deadline API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/applications/[id]/deadlines/[deadlineId] - Update a deadline
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deadlineId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: applicationId, deadlineId } = await params;

    const application = applications.get(applicationId);
    if (!application || application.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Application not found or unauthorized' },
        { status: 404 }
      );
    }

    const deadline = deadlines.get(deadlineId);
    if (!deadline || deadline.applicationId !== applicationId) {
      return NextResponse.json(
        { error: 'Deadline not found' },
        { status: 404 }
      );
    }

    const updates: UpdateDeadlineDto = await request.json();

    // Update deadline
    const updatedDeadline = {
      ...deadline,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    deadlines.set(deadlineId, updatedDeadline);

    return NextResponse.json({
      success: true,
      message: 'Deadline updated successfully',
      data: updatedDeadline,
    });
  } catch (error) {
    console.error('[Deadline API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/applications/[id]/deadlines/[deadlineId] - Delete a deadline
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deadlineId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: applicationId, deadlineId } = await params;

    const application = applications.get(applicationId);
    if (!application || application.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Application not found or unauthorized' },
        { status: 404 }
      );
    }

    const deadline = deadlines.get(deadlineId);
    if (!deadline || deadline.applicationId !== applicationId) {
      return NextResponse.json(
        { error: 'Deadline not found' },
        { status: 404 }
      );
    }

    deadlines.delete(deadlineId);

    return NextResponse.json({
      success: true,
      message: 'Deadline deleted successfully',
    });
  } catch (error) {
    console.error('[Deadline API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
