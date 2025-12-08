import { ObjectId } from 'mongodb';
import { getDatabase, COLLECTIONS } from '../mongodb';

export interface Application {
  _id?: ObjectId;
  userId: string;
  universityName: string;
  programName: string;
  degreeLevel: string;
  status: string;
  deadline?: string;
  submittedDate?: string;
  lastUpdated: string;
  portalUrl?: string;
  applicationFee?: number;
  priority?: string;
  notes?: string;
  tags?: string[];
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    fileUrl?: string;
    uploadedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export class ApplicationModel {
  static async create(application: Omit<Application, '_id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const newApplication = {
      ...application,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<Application>(COLLECTIONS.APPLICATIONS).insertOne(newApplication);

    return {
      ...newApplication,
      _id: result.insertedId,
    };
  }

  static async findById(id: string, userId: string): Promise<Application | null> {
    const db = await getDatabase();
    return db.collection<Application>(COLLECTIONS.APPLICATIONS).findOne({
      _id: new ObjectId(id),
      userId,
    });
  }

  static async findByUserId(userId: string): Promise<Application[]> {
    const db = await getDatabase();
    return db
      .collection<Application>(COLLECTIONS.APPLICATIONS)
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray();
  }

  static async update(id: string, userId: string, updates: Partial<Application>): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.collection<Application>(COLLECTIONS.APPLICATIONS).updateOne(
      { _id: new ObjectId(id), userId },
      {
        $set: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return result.modifiedCount > 0;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db
      .collection<Application>(COLLECTIONS.APPLICATIONS)
      .deleteOne({ _id: new ObjectId(id), userId });

    return result.deletedCount > 0;
  }

  static async updateStatus(
    id: string,
    userId: string,
    newStatus: string,
    notes?: string
  ): Promise<boolean> {
    return this.update(id, userId, {
      status: newStatus,
      lastUpdated: new Date().toISOString(),
    });
  }

  static async getDashboardData(userId: string) {
    const db = await getDatabase();
    const applications = await this.findByUserId(userId);

    // Calculate statistics
    const totalApplications = applications.length;
    const byStatus = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = applications.reduce((acc, app) => {
      if (app.priority) {
        acc[app.priority] = (acc[app.priority] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalFeesSpent = applications.reduce((sum, app) => sum + (app.applicationFee || 0), 0);

    return {
      overview: {
        totalApplications,
        byStatus,
        byPriority,
        completionRate: totalApplications > 0 ? Math.round((Object.keys(byStatus).length / totalApplications) * 100) : 0,
      },
      applications,
      statistics: {
        averageResponseTime: 45, // TODO: Calculate from status history
        successRate: byStatus.accepted ? Math.round((byStatus.accepted / totalApplications) * 100) : 0,
        totalFeesSpent,
        applicationsWithInterviews: byStatus.interview_scheduled || 0,
      },
    };
  }

  static async bulkImport(userId: string, applications: Omit<Application, '_id' | 'userId' | 'createdAt' | 'updatedAt'>[]): Promise<{ imported: Application[]; errors: Array<{ row: number; error: string }> }> {
    const imported: Application[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < applications.length; i++) {
      try {
        const app = await this.create({
          ...applications[i],
          userId,
        });
        imported.push(app);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { imported, errors };
  }
}
