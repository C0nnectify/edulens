import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationLogs } from '@/lib/data-store';

// GET /api/notifications/history - Get notification history
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const type = searchParams.get('type'); // email, sms, push
    const status = searchParams.get('status'); // pending, sent, delivered, failed
    const applicationId = searchParams.get('applicationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get logs for user
    let logs = Array.from(notificationLogs.values()).filter(
      (log) => log.userId === userId
    );

    // Apply filters
    if (type) {
      logs = logs.filter((log) => log.type === type);
    }
    if (status) {
      logs = logs.filter((log) => log.status === status);
    }
    if (applicationId) {
      logs = logs.filter((log) => log.applicationId === applicationId);
    }

    // Sort by sentAt (most recent first)
    logs.sort((a, b) => {
      const dateA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
      const dateB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
      return dateB - dateA;
    });

    // Paginate
    const total = logs.length;
    const paginatedLogs = logs.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        logs: paginatedLogs,
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('[Notification History API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
