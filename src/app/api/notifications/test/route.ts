import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationService } from '@/lib/services/notification-service';

// POST /api/notifications/test - Send a test notification
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { channel, recipient } = body;

    if (!channel || !recipient) {
      return NextResponse.json(
        { error: 'Missing required fields: channel, recipient' },
        { status: 400 }
      );
    }

    if (!['email', 'sms', 'push'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel. Must be: email, sms, or push' },
        { status: 400 }
      );
    }

    // Send test notification
    const result = await notificationService.send({
      userId: session.user.id,
      type: 'deadline_reminder',
      channel,
      recipient,
      subject: 'Test Notification from EduLen',
      content: 'This is a test notification to verify your notification settings are working correctly. If you receive this message, your notifications are configured properly!',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send test notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test ${channel} notification sent successfully`,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('[Test Notification API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
