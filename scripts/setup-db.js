const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'edulens-auth.db');
const db = new Database(dbPath);

// Create Better Auth tables
db.exec(`
  -- User table
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    role TEXT DEFAULT 'user'
  );

  -- Account table for OAuth providers
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    expiresAt INTEGER,
    password TEXT,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  );

  -- Session table
  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expiresAt INTEGER NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  );

  -- Verification table for email verification
  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt INTEGER NOT NULL
  );
`);

console.log('✅ Database tables created successfully!');

db.close();
