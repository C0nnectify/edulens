import { MongoClient } from 'mongodb';

type GlobalWithMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

/**
 * Get a shared MongoClient promise.
 *
 * Important: do NOT throw at module import time.
 * Next.js may import API route modules during build to collect page data.
 */
export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  const options = {};

  if (process.env.NODE_ENV === 'development') {
    // Preserve client across HMR reloads
    const globalWithMongo = global as GlobalWithMongo;
    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    return globalWithMongo._mongoClientPromise;
  }

  // In production, create a single module-scoped promise.
  const globalWithMongo = globalThis as GlobalWithMongo;
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  return globalWithMongo._mongoClientPromise;
}