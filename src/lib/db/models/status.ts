import { ObjectId } from 'mongodb';
import { getDatabase, COLLECTIONS } from '../mongodb';

export interface StatusUpdate {
  _id?: ObjectId;
  id?: string;
  applicationId: string;
  oldStatus?: string;
  newStatus: string;
  source: 'manual' | 'email_parsing' | 'portal_scrape' | 'ai_detection';
  notes?: string;
  attachments?: string[];
  metadata?: {
    emailSubject?: string;
    emailSender?: string;
    keywords?: string[];
    confidence?: number;
  };
  timestamp: string;
  notificationSent: boolean;
}

export class StatusHistoryModel {
  static async create(update: Omit<StatusUpdate, '_id' | 'id'>): Promise<StatusUpdate> {
    const db = await getDatabase();
    const result = await db.collection<StatusUpdate>(COLLECTIONS.STATUS_HISTORY).insertOne({
      ...update,
      timestamp: new Date().toISOString(),
      notificationSent: false,
    });

    return {
      ...update,
      _id: result.insertedId,
      id: result.insertedId.toString(),
    };
  }

  static async findByApplicationId(applicationId: string): Promise<StatusUpdate[]> {
    const db = await getDatabase();
    const history = await db
      .collection<StatusUpdate>(COLLECTIONS.STATUS_HISTORY)
      .find({ applicationId })
      .sort({ timestamp: -1 })
      .toArray();

    return history.map((h) => ({
      ...h,
      id: h._id?.toString(),
    }));
  }

  static async getMetrics(applicationId: string) {
    const history = await this.findByApplicationId(applicationId);

    if (history.length === 0) {
      return {
        totalUpdates: 0,
        firstUpdate: null,
        lastUpdate: null,
        currentStatus: null,
        averageTimePerStage: {},
      };
    }

    // Calculate average time per stage
    const stageTimings: Record<string, number[]> = {};

    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];

      if (current.oldStatus) {
        const timeDiff =
          (new Date(current.timestamp).getTime() - new Date(next.timestamp).getTime()) /
          (1000 * 60 * 60 * 24); // Convert to days

        if (!stageTimings[current.oldStatus]) {
          stageTimings[current.oldStatus] = [];
        }
        stageTimings[current.oldStatus].push(timeDiff);
      }
    }

    const averageTimePerStage: Record<string, number> = {};
    Object.entries(stageTimings).forEach(([stage, times]) => {
      averageTimePerStage[stage] = times.reduce((a, b) => a + b, 0) / times.length;
    });

    return {
      totalUpdates: history.length,
      firstUpdate: history[history.length - 1].timestamp,
      lastUpdate: history[0].timestamp,
      currentStatus: history[0].newStatus,
      averageTimePerStage,
    };
  }

  static async markNotificationSent(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db
      .collection<StatusUpdate>(COLLECTIONS.STATUS_HISTORY)
      .updateOne({ _id: new ObjectId(id) }, { $set: { notificationSent: true } });

    return result.modifiedCount > 0;
  }
}
