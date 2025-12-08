import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApplicationModel } from '@/lib/db/models/application';
import { StatusHistoryModel } from '@/lib/db/models/status';
import { notificationService } from '@/lib/services/notification-service';

// POST /api/applications/[id]/status - Update application status
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

    const body = await request.json();
    const { status, notes, source, metadata, attachments } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['draft', 'submitted', 'under_review', 'interview_scheduled', 'accepted', 'rejected', 'waitlisted'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Create status history entry in MongoDB
    const statusUpdate = await StatusHistoryModel.create({
      applicationId,
      oldStatus: application.status,
      newStatus: status,
      notes: notes || '',
      source: source || 'manual',
      metadata: metadata || {},
      attachments: attachments || [],
    });

    // Update application status
    await ApplicationModel.update(applicationId, {
      status,
      lastUpdated: statusUpdate.timestamp
    });

    // Send notification if status changed
    if (statusUpdate.oldStatus !== statusUpdate.newStatus) {
      try {
        await notificationService.sendToUser(
          session.user.id,
          'status_update',
          `Your application to ${application.programName} at ${application.universityName} has been updated to: ${status}`,
          {
            subject: `Application Status Update - ${application.universityName}`,
            applicationId,
            data: {
              oldStatus: statusUpdate.oldStatus,
              newStatus: statusUpdate.newStatus,
              universityName: application.universityName,
              programName: application.programName,
            },
          }
        );

        // Mark notification as sent
        if (statusUpdate.id) {
          await StatusHistoryModel.markNotificationSent(statusUpdate.id);
        }
      } catch (error) {
        console.error('[Status Update] Failed to send notification:', error);
      }
    }

    // Fetch updated application
    const updatedApplication = await ApplicationModel.findById(applicationId);

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        application: updatedApplication,
        statusUpdate,
      },
    });
  } catch (error) {
    console.error('[Status Update API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/applications/[id]/status - Get status history
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

    // Get status history from MongoDB
    const statusHistory = await StatusHistoryModel.findByApplicationId(applicationId);

    // Calculate metrics
    const metrics = await StatusHistoryModel.getMetrics(applicationId);

    return NextResponse.json({
      success: true,
      data: {
        history: statusHistory,
        metrics,
      },
    });
  } catch (error) {
    console.error('[Status History API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
