import { ObjectId } from 'mongodb';
import { getDatabase, COLLECTIONS } from '../mongodb';
import type { NotificationPreferences, NotificationLog } from '@/types/notification';

export class NotificationPreferencesModel {
  static async findByUserId(userId: string): Promise<NotificationPreferences | null> {
    const db = await getDatabase();
    return db.collection<NotificationPreferences>(COLLECTIONS.NOTIFICATION_PREFERENCES).findOne({ userId });
  }

  static async upsert(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const db = await getDatabase();

    const defaultPreferences: NotificationPreferences = {
      userId,
      channels: {
        email: { enabled: true, address: '' },
        sms: { enabled: false, phone: '' },
        push: { enabled: false, deviceTokens: [] },
      },
      types: {
        deadlineReminders: true,
        statusUpdates: true,
        documentRequests: true,
        aiInsights: false,
        weeklyDigest: true,
        lorReminders: true,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC',
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const result = await db.collection<NotificationPreferences>(COLLECTIONS.NOTIFICATION_PREFERENCES).findOneAndUpdate(
      { userId },
      {
        $set: {
          ...defaultPreferences,
          ...preferences,
          userId,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return result!;
  }
}

export class NotificationLogModel {
  static async create(log: Omit<NotificationLog, '_id'>): Promise<NotificationLog> {
    const db = await getDatabase();
    const result = await db.collection<NotificationLog>(COLLECTIONS.NOTIFICATION_LOGS).insertOne({
      ...log,
      sentAt: new Date(),
    } as NotificationLog);

    return {
      ...log,
      _id: result.insertedId,
    } as NotificationLog;
  }

  static async findByUserId(
    userId: string,
    filters?: {
      type?: string;
      status?: string;
      applicationId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<NotificationLog[]> {
    const db = await getDatabase();
    const query: any = { userId };

    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;
    if (filters?.applicationId) query.applicationId = filters.applicationId;

    return db
      .collection<NotificationLog>(COLLECTIONS.NOTIFICATION_LOGS)
      .find(query)
      .sort({ sentAt: -1 })
      .skip(filters?.offset || 0)
      .limit(filters?.limit || 50)
      .toArray();
  }

  static async updateStatus(
    id: string,
    status: NotificationLog['status'],
    metadata?: { deliveredAt?: Date; openedAt?: Date; error?: string }
  ): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.collection<NotificationLog>(COLLECTIONS.NOTIFICATION_LOGS).updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, ...metadata } }
    );

    return result.modifiedCount > 0;
  }
}

interface NotificationLogWithId extends NotificationLog {
  _id?: ObjectId;
}
