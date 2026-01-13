import type { Db } from 'mongodb';
import { getMongoClientPromise } from '@/lib/mongodb';

// Helper function to get database instance
export async function getDatabase(): Promise<Db> {
  const client = await getMongoClientPromise();

  // Prefer explicit DB name, otherwise fall back to the DB encoded in MONGODB_URI.
  // NOTE: `client.db()` uses the default DB from the connection string (or "test" if none).
  const explicitDbName = process.env.MONGODB_DB_NAME;
  if (explicitDbName && explicitDbName.trim().length > 0) {
    return client.db(explicitDbName);
  }

  // Best-effort extract DB name from URI; if absent, default to "edulens".
  const uri = process.env.MONGODB_URI || '';
  const uriDbMatch = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)(?:\?|$)/i);
  const uriDbName = (uriDbMatch?.[1] || '').trim();
  return client.db(uriDbName.length > 0 ? uriDbName : 'edulens');
}

// Collection names
export const COLLECTIONS = {
  APPLICATIONS: 'applications',
  USERS: 'users',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
  NOTIFICATION_LOGS: 'notification_logs',
  DEADLINES: 'deadlines',
  REMINDER_SCHEDULES: 'reminder_schedules',
  STATUS_HISTORY: 'status_history',
  UNIVERSITY_REQUIREMENTS: 'university_requirements',
  DOCUMENT_CHECKLISTS: 'document_checklists',
  PARSED_EMAILS: 'parsed_emails',
} as const;
