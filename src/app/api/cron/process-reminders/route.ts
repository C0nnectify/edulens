import { NextRequest, NextResponse } from 'next/server';
import { processReminders } from '@/lib/cron/reminder-processor';

/**
 * Cron endpoint for processing reminders
 *
 * This endpoint should be called by:
 * - Vercel Cron (vercel.json configuration)
 * - External cron service (cron-job.org, EasyCron, etc.)
 * - GitHub Actions workflow
 *
 * Security: Protect this endpoint with a secret token
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret token
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-token-here';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process reminders
    const result = await processReminders();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Reminders processed successfully',
        data: result,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Reminder processing completed with errors',
        data: result,
      }, { status: 207 }); // 207 Multi-Status
    }
  } catch (error) {
    console.error('[Cron API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST method
export async function POST(request: NextRequest) {
  return GET(request);
}
