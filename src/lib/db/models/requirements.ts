import { ObjectId } from 'mongodb';
import { getDatabase, COLLECTIONS } from '../mongodb';
import type { UniversityRequirements } from '@/types/document-requirements';

export class UniversityRequirementsModel {
  static async create(requirements: Omit<UniversityRequirements, 'id'>): Promise<UniversityRequirements> {
    const db = await getDatabase();
    const result = await db.collection(COLLECTIONS.UNIVERSITY_REQUIREMENTS).insertOne({
      ...requirements,
      scrapedAt: new Date().toISOString(),
      createdAt: new Date(),
    });

    return {
      ...requirements,
      id: result.insertedId.toString(),
    };
  }

  static async findAll(): Promise<UniversityRequirements[]> {
    const db = await getDatabase();
    const requirements = await db
      .collection(COLLECTIONS.UNIVERSITY_REQUIREMENTS)
      .find({})
      .sort({ universityName: 1 })
      .toArray();

    return requirements.map((r: any) => ({
      ...r,
      id: r._id.toString(),
      _id: undefined,
    }));
  }

  static async findByUniversity(
    universityId: string,
    programId?: string,
    degreeLevel?: string
  ): Promise<UniversityRequirements | null> {
    const db = await getDatabase();
    const query: any = { universityId };

    if (programId) query.programId = programId;
    if (degreeLevel) query.degreeLevel = degreeLevel;

    const requirement = await db
      .collection(COLLECTIONS.UNIVERSITY_REQUIREMENTS)
      .findOne(query);

    if (!requirement) return null;

    return {
      ...requirement,
      id: requirement._id.toString(),
      _id: undefined,
    } as UniversityRequirements;
  }

  static async update(
    universityId: string,
    updates: Partial<UniversityRequirements>
  ): Promise<boolean> {
    const db = await getDatabase();
    const result = await db
      .collection(COLLECTIONS.UNIVERSITY_REQUIREMENTS)
      .updateOne(
        { universityId },
        {
          $set: {
            ...updates,
            lastVerified: new Date().toISOString(),
          },
        }
      );

    return result.modifiedCount > 0;
  }

  static async delete(universityId: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db
      .collection(COLLECTIONS.UNIVERSITY_REQUIREMENTS)
      .deleteOne({ universityId });

    return result.deletedCount > 0;
  }
}

interface DocumentChecklistItem {
  requirementId: string;
  requirement: any;
  status: 'missing' | 'uploaded' | 'validated' | 'rejected';
  uploadedDocument?: {
    id: string;
    name: string;
    fileUrl: string;
    uploadedAt: string;
    fileSize?: number;
  };
  validationResults?: Array<{
    type: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
    suggestion?: string;
  }>;
}

export interface DocumentChecklist {
  _id?: ObjectId;
  applicationId: string;
  requirements: DocumentChecklistItem[];
  completionPercentage: number;
  missingRequired: string[];
  missingOptional: string[];
  updatedAt: string;
}

export class DocumentChecklistModel {
  static async upsert(
    applicationId: string,
    checklist: Omit<DocumentChecklist, '_id' | 'updatedAt'>
  ): Promise<DocumentChecklist> {
    const db = await getDatabase();
    const result = await db.collection<DocumentChecklist>(COLLECTIONS.DOCUMENT_CHECKLISTS).findOneAndUpdate(
      { applicationId },
      {
        $set: {
          ...checklist,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return result!;
  }

  static async findByApplicationId(applicationId: string): Promise<DocumentChecklist | null> {
    const db = await getDatabase();
    return db
      .collection<DocumentChecklist>(COLLECTIONS.DOCUMENT_CHECKLISTS)
      .findOne({ applicationId });
  }

  static async updateDocumentStatus(
    applicationId: string,
    requirementId: string,
    status: 'missing' | 'uploaded' | 'validated' | 'rejected',
    uploadedDocument?: DocumentChecklistItem['uploadedDocument'],
    validationResults?: DocumentChecklistItem['validationResults']
  ): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.collection<DocumentChecklist>(COLLECTIONS.DOCUMENT_CHECKLISTS).updateOne(
      {
        applicationId,
        'requirements.requirementId': requirementId,
      },
      {
        $set: {
          'requirements.$.status': status,
          'requirements.$.uploadedDocument': uploadedDocument,
          'requirements.$.validationResults': validationResults,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return result.modifiedCount > 0;
  }
}
