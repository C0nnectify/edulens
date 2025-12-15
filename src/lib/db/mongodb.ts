import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri: string = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Helper function to get database instance
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;

  // Prefer explicit DB name, otherwise fall back to the DB encoded in MONGODB_URI.
  // NOTE: `client.db()` uses the default DB from the connection string (or "test" if none).
  const explicitDbName = process.env.MONGODB_DB_NAME;
  if (explicitDbName && explicitDbName.trim().length > 0) {
    return client.db(explicitDbName);
  }

  // Best-effort extract DB name from URI; if absent, default to "edulens".
  const uriDbMatch = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)(?:\?|$)/i);
  const uriDbName = (uriDbMatch?.[1] || "").trim();
  return client.db(uriDbName.length > 0 ? uriDbName : "edulens");
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
