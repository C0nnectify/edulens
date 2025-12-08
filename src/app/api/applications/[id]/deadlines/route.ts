import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApplicationModel } from '@/lib/db/models/application';
import { DeadlineModel } from '@/lib/db/models/deadline';
import type { Deadline, CreateDeadlineDto } from '@/types/notification';

// GET /api/applications/[id]/deadlines - Get all deadlines for an application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: applicationId } = await params;
    const application = await ApplicationModel.findById(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all deadlines from MongoDB
    const applicationDeadlines = await DeadlineModel.findByApplicationId(applicationId);

    return NextResponse.json({
      success: true,
      data: applicationDeadlines,
    });
  } catch (error) {
    console.error('[Deadlines API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/applications/[id]/deadlines - Add a new deadline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: applicationId } = await params;
    const application = await ApplicationModel.findById(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body: CreateDeadlineDto = await request.json();

    // Validate required fields
    if (!body.date || !body.type || !body.stage || !body.timezone) {
      return NextResponse.json(
        { error: 'Missing required fields: date, type, stage, timezone' },
        { status: 400 }
      );
    }

    // Create new deadline in MongoDB
    const deadline = await DeadlineModel.create({
      applicationId,
      type: body.type,
      stage: body.stage,
      date: body.date,
      time: body.time || '23:59',
      timezone: body.timezone,
      isExtended: false,
      status: 'upcoming',
      notes: body.notes,
    });

    // TODO: Create reminder schedule for this deadline

    return NextResponse.json({
      success: true,
      message: 'Deadline created successfully',
      data: deadline,
    }, { status: 201 });
  } catch (error) {
    console.error('[Deadlines API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
