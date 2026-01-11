import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

// MongoDB connection (stable across dev HMR)
const mongoUrl = process.env.MONGODB_URI || "mongodb://localhost:27017/edulens";

function getDbNameFromUri(uri: string): string | undefined {
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)(?:\?|$)/i);
  const raw = (match?.[1] || "").trim();
  return raw.length > 0 ? raw : undefined;
}

type GlobalWithBetterAuthMongo = typeof globalThis & {
  _betterAuthMongoClient?: MongoClient;
  _betterAuthMongoClientPromise?: Promise<MongoClient>;
};

const globalWithMongo = globalThis as GlobalWithBetterAuthMongo;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!globalWithMongo._betterAuthMongoClient) {
    globalWithMongo._betterAuthMongoClient = new MongoClient(mongoUrl);
    globalWithMongo._betterAuthMongoClientPromise = globalWithMongo._betterAuthMongoClient.connect();
  }
  client = globalWithMongo._betterAuthMongoClient;
  clientPromise = globalWithMongo._betterAuthMongoClientPromise!;
} else {
  client = new MongoClient(mongoUrl);
  clientPromise = client.connect();
}

// Kick off connection early; errors will surface in logs and on first request.
clientPromise.catch((err) => {
  console.error("[Better Auth] MongoDB connect error:", err);
});

const dbName = process.env.MONGODB_DB_NAME || getDbNameFromUri(mongoUrl) || "edulens";
console.log('[Better Auth] Initializing with DB:', dbName, 'URI:', mongoUrl.replace(/:[^:]*@/, ':****@'));
const db = client.db(dbName);

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
    },
  },
  plugins: [
    nextCookies(),
  ],
  // Remove custom ID generation to use Better Auth's default (which works with MongoDB ObjectId)
  // advanced: {
  //   generateId: () => crypto.randomUUID(),
  // },
});