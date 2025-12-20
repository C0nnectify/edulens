import type { Collection, Db } from 'mongodb';
import { getDatabase } from '@/lib/db/mongodb';

export type ChatRole = 'user' | 'ai';

export type ChatSessionDoc = {
  userId: string;
  sessionId: string;
  title: string;
  feature?: string;
  documentType?: string | null;
  messageCount: number;
  lastMessage?: string;
  summary?: string | null;
  summaryUpdatedAt?: Date | null;
  activeAttachmentIds?: string[];
  activeAttachmentUpdatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessageDoc = {
  userId: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
  attachments?: string[];
  sources?: Array<{ id: string; title: string; url?: string; snippet?: string }>;
  agentsInvolved?: string[];
  documentDraft?: Record<string, unknown>;
  progress?: {
    collected_fields: string[];
    missing_fields: string[];
    percentage: number;
    ready_for_generation?: boolean;
  };
  action?: string;
  documentType?: string | null;
};

export const CHAT_COLLECTIONS = {
  SESSIONS: 'chat_sessions',
  MESSAGES: 'chat_messages',
} as const;

let indexesEnsured = false;

async function ensureIndexes(db: Db) {
  if (indexesEnsured) return;

  const sessions = db.collection<ChatSessionDoc>(CHAT_COLLECTIONS.SESSIONS);
  const messages = db.collection<ChatMessageDoc>(CHAT_COLLECTIONS.MESSAGES);

  await Promise.all([
    sessions.createIndex({ userId: 1, updatedAt: -1 }),
    sessions.createIndex({ userId: 1, sessionId: 1 }, { unique: true }),
    messages.createIndex({ userId: 1, sessionId: 1, createdAt: 1 }),
  ]);

  indexesEnsured = true;
}

export async function getChatCollections(): Promise<{
  db: Db;
  sessions: Collection<ChatSessionDoc>;
  messages: Collection<ChatMessageDoc>;
}> {
  const db = await getDatabase();
  await ensureIndexes(db);

  return {
    db,
    sessions: db.collection<ChatSessionDoc>(CHAT_COLLECTIONS.SESSIONS),
    messages: db.collection<ChatMessageDoc>(CHAT_COLLECTIONS.MESSAGES),
  };
}

export function deriveSessionTitle(opts: {
  message: string;
  feature?: string | null;
  documentType?: string | null;
}) {
  const feature = (opts.feature || 'general').toLowerCase();
  const docType = opts.documentType || null;

  if (feature === 'document_builder' && docType) {
    return `${docType.toUpperCase()} Builder`;
  }
  if (feature === 'analysis') return 'Document Analysis';
  if (feature === 'roadmap') return 'Roadmap';
  if (feature === 'tracker') return 'Application Tracker';

  const trimmed = (opts.message || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'New Chat';
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}
