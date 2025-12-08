/**
 * Reminder Scheduler Service
 * Calculates and schedules reminders based on deadlines and task completion
 */

import { notificationService } from './notification-service';
import { deadlines, reminderSchedules, applications } from '@/lib/data-store';
import type { Deadline, ReminderSchedule } from '@/types/notification';

export class ReminderScheduler {
  /**
   * Create reminder schedule for a deadline
   */
  async createReminderSchedule(deadline: Deadline): Promise<ReminderSchedule> {
    const completionPercentage = await this.calculateCompletionPercentage(
      deadline.applicationId
    );

    const reminderDates = this.calculateReminderDates(
      new Date(deadline.date),
      completionPercentage
    );

    const schedule: ReminderSchedule = {
      id: crypto.randomUUID(),
      applicationId: deadline.applicationId,
      deadline: deadline.date,
      deadlineType: deadline.type,
      reminders: reminderDates.map((date) => ({
        id: crypto.randomUUID(),
        triggerAt: date.toISOString(),
        type: 'deadline',
        sent: false,
      })),
      completionPercentage,
      lastCalculated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reminderSchedules.set(schedule.id, schedule);
    return schedule;
  }

  /**
   * Calculate when reminders should be sent based on deadline and completion
   */
  private calculateReminderDates(
    deadlineDate: Date,
    completionPercentage: number
  ): Date[] {
    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const reminders: Date[] = [];

    // Standard reminder schedule
    const standardReminders = [30, 14, 7, 3, 1]; // days before deadline

    for (const days of standardReminders) {
      const reminderDate = new Date(deadlineDate);
      reminderDate.setDate(reminderDate.getDate() - days);

      // Only schedule if reminder date is in the future
      if (reminderDate > now) {
        reminders.push(reminderDate);
      }
    }

    // Adjust frequency based on completion percentage
    if (completionPercentage < 30 && daysUntilDeadline <= 14) {
      // Low completion + close deadline = daily reminders
      for (let i = daysUntilDeadline; i >= 1; i--) {
        const reminderDate = new Date(deadlineDate);
        reminderDate.setDate(reminderDate.getDate() - i);
        if (reminderDate > now && !reminders.some(r => r.getDate() === reminderDate.getDate())) {
          reminders.push(reminderDate);
        }
      }
    } else if (completionPercentage < 50 && daysUntilDeadline <= 7) {
      // Medium completion + very close deadline = reminders every 2 days
      for (let i = daysUntilDeadline; i >= 1; i -= 2) {
        const reminderDate = new Date(deadlineDate);
        reminderDate.setDate(reminderDate.getDate() - i);
        if (reminderDate > now && !reminders.some(r => r.getDate() === reminderDate.getDate())) {
          reminders.push(reminderDate);
        }
      }
    }

    // Sort reminders chronologically
    reminders.sort((a, b) => a.getTime() - b.getTime());

    return reminders;
  }

  /**
   * Calculate application completion percentage
   */
  private async calculateCompletionPercentage(
    applicationId: string
  ): Promise<number> {
    const application = applications.get(applicationId);
    if (!application) return 0;

    // Calculate based on:
    // - Documents uploaded (40%)
    // - Application filled (30%)
    // - LORs submitted (30%)

    let score = 0;

    // Documents
    const requiredDocuments = ['sop', 'resume', 'transcript'];
    const uploadedDocs = application.documents?.filter((doc: any) =>
      doc.status === 'uploaded' || doc.status === 'approved'
    ) || [];
    const docScore = requiredDocuments.every((type) =>
      uploadedDocs.some((doc: any) => doc.type === type)
    )
      ? 40
      : (uploadedDocs.length / requiredDocuments.length) * 40;
    score += docScore;

    // Application status (if submitted, 30 points)
    if (
      application.status === 'submitted' ||
      application.status === 'under_review' ||
      application.status === 'interview_scheduled'
    ) {
      score += 30;
    } else if (application.status !== 'draft') {
      score += 15; // Partially completed
    }

    // LORs (if has LOR documents, 30 points)
    const lorDocs = application.documents?.filter(
      (doc: any) => doc.type === 'lor' && (doc.status === 'uploaded' || doc.status === 'approved')
    ) || [];
    if (lorDocs.length >= 2) {
      score += 30;
    } else if (lorDocs.length === 1) {
      score += 15;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Check and send due reminders
   * This should be called by a cron job every hour
   */
  async processDueReminders(): Promise<void> {
    const now = new Date();
    const schedules = Array.from(reminderSchedules.values());

    for (const schedule of schedules) {
      const application = applications.get(schedule.applicationId);
      if (!application) continue;

      // Find reminders that are due
      const dueReminders = schedule.reminders.filter(
        (reminder) =>
          !reminder.sent && new Date(reminder.triggerAt) <= now
      );

      for (const reminder of dueReminders) {
        try {
          await this.sendReminder(schedule, reminder, application);

          // Mark as sent
          reminder.sent = true;
          reminder.sentAt = new Date().toISOString();
        } catch (error) {
          console.error(
            '[ReminderScheduler] Failed to send reminder:',
            error
          );
        }
      }

      // Update schedule
      if (dueReminders.length > 0) {
        schedule.updatedAt = new Date().toISOString();
        reminderSchedules.set(schedule.id, schedule);
      }
    }
  }

  /**
   * Send a reminder notification
   */
  private async sendReminder(
    schedule: ReminderSchedule,
    reminder: any,
    application: any
  ): Promise<void> {
    const deadline = new Date(schedule.deadline);
    const daysUntil = Math.ceil(
      (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    let content: string;
    let subject: string;

    if (daysUntil === 0) {
      subject = `URGENT: Deadline TODAY - ${application.universityName}`;
      content = `The application deadline for ${application.programName} at ${application.universityName} is TODAY! Make sure to submit before ${deadline.toLocaleTimeString()}.`;
    } else if (daysUntil === 1) {
      subject = `Deadline Tomorrow - ${application.universityName}`;
      content = `The application deadline for ${application.programName} at ${application.universityName} is tomorrow. Please ensure all documents are ready.`;
    } else if (daysUntil <= 3) {
      subject = `Deadline in ${daysUntil} days - ${application.universityName}`;
      content = `You have ${daysUntil} days left to submit your application to ${application.programName} at ${application.universityName}. Current completion: ${schedule.completionPercentage}%.`;
    } else if (daysUntil <= 7) {
      subject = `Deadline in ${daysUntil} days - ${application.universityName}`;
      content = `Reminder: Your application to ${application.programName} at ${application.universityName} is due in ${daysUntil} days. Current completion: ${schedule.completionPercentage}%.`;
    } else {
      subject = `Upcoming Deadline - ${application.universityName}`;
      content = `Your application to ${application.programName} at ${application.universityName} is due in ${daysUntil} days. Start preparing your documents now!`;
    }

    // Add completion-based warnings
    if (schedule.completionPercentage < 30 && daysUntil <= 7) {
      content += `\n\n⚠️ Warning: Your application is only ${schedule.completionPercentage}% complete with ${daysUntil} days remaining. Please prioritize this application!`;
    }

    await notificationService.sendToUser(
      application.userId,
      'deadline_reminder',
      content,
      {
        subject,
        applicationId: application.id,
        data: {
          daysUntil,
          deadline: schedule.deadline,
          completionPercentage: schedule.completionPercentage,
        },
      }
    );
  }

  /**
   * Recalculate reminder schedule based on updated completion
   */
  async updateReminderSchedule(applicationId: string): Promise<void> {
    // Find schedules for this application
    const appSchedules = Array.from(reminderSchedules.values()).filter(
      (s) => s.applicationId === applicationId
    );

    for (const schedule of appSchedules) {
      const newCompletion = await this.calculateCompletionPercentage(
        applicationId
      );

      // If completion changed significantly, recalculate reminders
      if (Math.abs(newCompletion - schedule.completionPercentage) >= 10) {
        const deadline = deadlines.get(schedule.id);
        if (deadline) {
          // Remove old schedule
          reminderSchedules.delete(schedule.id);

          // Create new schedule
          await this.createReminderSchedule(deadline);
        }
      }
    }
  }
}

// Export singleton
export const reminderScheduler = new ReminderScheduler();
