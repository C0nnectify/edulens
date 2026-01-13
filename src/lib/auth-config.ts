import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

// MongoDB connection (stable across dev HMR)
const envMongoUrl = process.env.MONGODB_URI;
if (!envMongoUrl && process.env.NODE_ENV === "production") {
  console.warn("[Better Auth] MONGODB_URI is not set. Auth will fail until it is provided at runtime.");
}
const mongoUrl = envMongoUrl || "mongodb://localhost:27017/edulens";

const authSecret = process.env.BETTER_AUTH_SECRET || "dev-insecure-secret";
if (!process.env.BETTER_AUTH_SECRET && process.env.NODE_ENV === "production") {
  console.warn("[Better Auth] BETTER_AUTH_SECRET is not set. Set it in production to secure sessions.");
}

function getDbNameFromUri(uri: string): string | undefined {
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)(?:\?|$)/i);
  const raw = (match?.[1] || "").trim();
  return raw.length > 0 ? raw : undefined;
}

type GlobalWithBetterAuthMongo = typeof globalThis & {
  _betterAuthMongoClient?: MongoClient;
};

const globalWithMongo = globalThis as GlobalWithBetterAuthMongo;

let client: MongoClient;

if (process.env.NODE_ENV === "development") {
  if (!globalWithMongo._betterAuthMongoClient) {
    globalWithMongo._betterAuthMongoClient = new MongoClient(mongoUrl);
  }
  client = globalWithMongo._betterAuthMongoClient;
} else {
  client = new MongoClient(mongoUrl);
}

const dbName = process.env.MONGODB_DB_NAME || getDbNameFromUri(mongoUrl) || "edulens";
if (process.env.NODE_ENV === "development") {
  console.log(
    "[Better Auth] Initializing with DB:",
    dbName,
    "URI:",
    mongoUrl.replace(/:[^:]*@/, ":****@")
  );
}
const db = client.db(dbName);

export const auth = betterAuth({
  secret: authSecret,
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