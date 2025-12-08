import { ObjectId } from 'mongodb';
import { getDatabase, COLLECTIONS } from '../mongodb';
import type { Deadline, ReminderSchedule } from '@/types/notification';

export class DeadlineModel {
  static async create(deadline: Omit<Deadline, 'id'>): Promise<Deadline> {
    const db = await getDatabase();
    const result = await db.collection(COLLECTIONS.DEADLINES).insertOne({
      ...deadline,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      ...deadline,
      id: result.insertedId.toString(),
    };
  }

  static async findByApplicationId(applicationId: string): Promise<Deadline[]> {
    const db = await getDatabase();
    const deadlines = await db
      .collection(COLLECTIONS.DEADLINES)
      .find({ applicationId })
      .sort({ date: 1 })
      .toArray();

    return deadlines.map((d: any) => ({
      ...d,
      id: d._id.toString(),
      _id: undefined,
    }));
  }

  static async findById(id: string, applicationId: string): Promise<Deadline | null> {
    const db = await getDatabase();
    const deadline = await db.collection(COLLECTIONS.DEADLINES).findOne({
      _id: new ObjectId(id),
      applicationId,
    });

    if (!deadline) return null;

    return {
      ...deadline,
      id: deadline._id.toString(),
      _id: undefined,
    } as Deadline;
  }

  static async update(id: string, applicationId: string, updates: Partial<Deadline>): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.collection(COLLECTIONS.DEADLINES).updateOne(
      { _id: new ObjectId(id), applicationId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  }

  static async delete(id: string, applicationId: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.collection(COLLECTIONS.DEADLINES).deleteOne({
      _id: new ObjectId(id),
      applicationId,
    });

    return result.deletedCount > 0;
  }

  static async getUpcoming(userId: string, limit: number = 10): Promise<Array<Deadline & { universityName: string; programName: string }>> {
    const db = await getDatabase();

    // Get applications for user
    const applications = await db
      .collection(COLLECTIONS.APPLICATIONS)
      .find({ userId })
      .project({ _id: 1, universityName: 1, programName: 1 })
      .toArray();

    const applicationIds = applications.map((a) => a._id.toString());

    // Get upcoming deadlines
    const deadlines = await db
      .collection(COLLECTIONS.DEADLINES)
      .find({
        applicationId: { $in: applicationIds },
        date: { $gte: new Date().toISOString() },
        status: 'upcoming',
      })
      .sort({ date: 1 })
      .limit(limit)
      .toArray();

    // Map deadlines with application info
    return deadlines.map((d: any) => {
      const app = applications.find((a) => a._id.toString() === d.applicationId);
      return {
        ...d,
        id: d._id.toString(),
        universityName: app?.universityName || '',
        programName: app?.programName || '',
        _id: undefined,
      };
    });
  }
}

export class ReminderScheduleModel {
  static async create(schedule: Omit<ReminderSchedule, 'id'>): Promise<ReminderSchedule> {
    const db = await getDatabase();
    const result = await db.collection(COLLECTIONS.REMINDER_SCHEDULES).insertOne({
      ...schedule,
      createdAt: new Date(),
    });

    return {
      ...schedule,
      id: result.insertedId.toString(),
    };
  }

  static async findByApplicationId(applicationId: string): Promise<ReminderSchedule | null> {
    const db = await getDatabase();
    const schedule = await db
      .collection(COLLECTIONS.REMINDER_SCHEDULES)
      .findOne({ applicationId });

    if (!schedule) return null;

    return {
      ...schedule,
      id: schedule._id.toString(),
      _id: undefined,
    } as ReminderSchedule;
  }

  static async update(applicationId: string, updates: Partial<ReminderSchedule>): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.collection(COLLECTIONS.REMINDER_SCHEDULES).updateOne(
      { applicationId },
      {
        $set: {
          ...updates,
          lastCalculated: new Date(),
        },
      },
      { upsert: true }
    );

    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }

  static async getDueReminders(): Promise<ReminderSchedule[]> {
    const db = await getDatabase();
    const now = new Date();

    const schedules = await db
      .collection(COLLECTIONS.REMINDER_SCHEDULES)
      .find({
        'reminders.triggerAt': { $lte: now.toISOString() },
        'reminders.sent': false,
      })
      .toArray();

    return schedules.map((s: any) => ({
      ...s,
      id: s._id.toString(),
      _id: undefined,
    }));
  }

  static async markReminderSent(applicationId: string, reminderIndex: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.collection(COLLECTIONS.REMINDER_SCHEDULES).updateOne(
      { applicationId },
      {
        $set: {
          [`reminders.${reminderIndex}.sent`]: true,
          [`reminders.${reminderIndex}.sentAt`]: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  }
}
