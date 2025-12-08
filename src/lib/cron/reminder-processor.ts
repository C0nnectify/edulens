/**
 * Cron Job: Reminder Processor
 * Processes due reminders and sends notifications
 *
 * This should be run hourly via a cron job or task scheduler
 *
 * Setup options:
 * 1. Next.js API Route (called by external cron service like Vercel Cron or cron-job.org)
 * 2. Node.js cron package (node-cron)
 * 3. System cron (crontab)
 */

import { reminderScheduler } from '@/lib/services/reminder-scheduler';

/**
 * Process all due reminders
 * This function should be called every hour
 */
export async function processReminders(): Promise<{
  success: boolean;
  processedCount: number;
  errors: string[];
}> {
  const startTime = Date.now();
  const errors: string[] = [];
  let processedCount = 0;

  console.log('[Cron] Starting reminder processing...');

  try {
    await reminderScheduler.processDueReminders();
    processedCount++;

    const duration = Date.now() - startTime;
    console.log(`[Cron] Reminder processing completed in ${duration}ms`);

    return {
      success: true,
      processedCount,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);
    console.error('[Cron] Error processing reminders:', error);

    return {
      success: false,
      processedCount,
      errors,
    };
  }
}

/**
 * Setup cron job using node-cron (if using this approach)
 *
 * Usage:
 * import { setupReminderCron } from '@/lib/cron/reminder-processor';
 * setupReminderCron();
 */
export function setupReminderCron() {
  // Uncomment if using node-cron package
  // const cron = require('node-cron');
  //
  // // Run every hour at minute 0
  // cron.schedule('0 * * * *', async () => {
  //   console.log('[Cron] Hourly reminder check triggered');
  //   await processReminders();
  // });
  //
  // console.log('[Cron] Reminder processor scheduled (hourly)');
}
