import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applications } from '@/lib/data-store';
import { emailParserService } from '@/lib/services/email-parser';
import { notificationService } from '@/lib/services/notification-service';

// POST /api/applications/[id]/email-forward - Process forwarded email
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
    const application = applications.get(applicationId);

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
    const { from, subject, body: emailBody, receivedAt } = body;

    if (!from || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: from, subject, body' },
        { status: 400 }
      );
    }

    // Parse email
    const parsedEmail = await emailParserService.parseEmail({
      from,
      subject,
      body: emailBody,
      receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
    });

    // Auto-update status if detected with high confidence
    let statusUpdated = false;
    if (parsedEmail.detectedStatus && parsedEmail.confidence >= 0.8) {
      // Create status update
      const statusUpdate = {
        id: crypto.randomUUID(),
        applicationId,
        oldStatus: application.status,
        newStatus: parsedEmail.detectedStatus,
        notes: `Auto-detected from email: ${subject}`,
        source: 'email_parsing',
        metadata: {
          emailFrom: from,
          emailSubject: subject,
          confidence: parsedEmail.confidence,
          keywords: parsedEmail.keywords,
          extractedData: parsedEmail.extractedData,
        },
        attachments: [],
        timestamp: new Date().toISOString(),
        notificationSent: false,
      };

      // Update application
      application.status = parsedEmail.detectedStatus;
      application.lastUpdated = statusUpdate.timestamp;

      if (!application.statusHistory) {
        application.statusHistory = [];
      }
      application.statusHistory.push(statusUpdate);

      applications.set(applicationId, application);
      statusUpdated = true;

      // Send notification
      try {
        await notificationService.sendToUser(
          session.user.id,
          'status_update',
          `We detected a status update from ${application.universityName}: ${parsedEmail.detectedStatus}. Check your application for details.`,
          {
            subject: `Auto-Detected Status Update - ${application.universityName}`,
            applicationId,
            data: {
              oldStatus: statusUpdate.oldStatus,
              newStatus: parsedEmail.detectedStatus,
              source: 'email',
            },
          }
        );
      } catch (error) {
        console.error('[Email Forward] Failed to send notification:', error);
      }
    }

    // Store email for reference (in production, you'd save this to DB)
    if (!application.emails) {
      application.emails = [];
    }
    application.emails.push({
      id: crypto.randomUUID(),
      from: parsedEmail.from,
      subject: parsedEmail.subject,
      receivedAt: parsedEmail.receivedAt.toISOString(),
      detectedStatus: parsedEmail.detectedStatus,
      confidence: parsedEmail.confidence,
      sentiment: parsedEmail.sentiment,
      extractedData: parsedEmail.extractedData,
    });

    applications.set(applicationId, application);

    // Return analysis results
    return NextResponse.json({
      success: true,
      message: statusUpdated
        ? 'Email processed and status updated automatically'
        : 'Email processed successfully',
      data: {
        parsed: {
          detectedStatus: parsedEmail.detectedStatus,
          confidence: parsedEmail.confidence,
          sentiment: parsedEmail.sentiment,
          extractedData: parsedEmail.extractedData,
          keywords: parsedEmail.keywords,
        },
        statusUpdated,
        currentStatus: application.status,
      },
    });
  } catch (error) {
    console.error('[Email Forward API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
