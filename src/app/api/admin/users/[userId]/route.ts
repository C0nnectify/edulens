/**
 * Admin API - Single User Management
 * 
 * GET, PUT, DELETE operations for a specific user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { headers } from 'next/headers';
import { getMongoClientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const USERS_COLLECTION = 'user';
const PROFILES_COLLECTION = 'user_profiles';
const SMART_PROFILES_COLLECTION = 'smart_profiles';
const SESSIONS_COLLECTION = 'session';
const ROADMAPS_COLLECTION = 'roadmap_plans';
const DOCUMENTS_COLLECTION = 'documents';
const CHAT_SESSIONS_COLLECTION = 'chat_sessions';
const CHAT_MESSAGES_COLLECTION = 'chat_messages';
const JOURNEY_CONVERSATIONS_COLLECTION = 'journey_conversations';
const ACCOUNTS_COLLECTION = 'account';
const VERIFICATIONS_COLLECTION = 'verification';

async function getDb() {
  const client = await getMongoClientPromise();
  return client.db();
}

// Check if user is admin
async function isAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { isAdmin: false };
  }

  const db = await getDb();
  let user = await db.collection(USERS_COLLECTION).findOne({ id: session.user.id });
  
  // If not found by id field, try by _id (ObjectId)
  if (!user) {
    try {
      user = await db.collection(USERS_COLLECTION).findOne({ _id: new ObjectId(session.user.id) });
    } catch {
      // Not a valid ObjectId, ignore
    }
  }
  
  return {
    isAdmin: user?.role === 'admin',
    userId: session.user.id,
  };
}

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET /api/admin/users/[userId] - Get single user details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { isAdmin: adminCheck } = await isAdmin();
    
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { userId } = await params;
    const db = await getDb();

    // Get user - try by _id (ObjectId) first
    let user = null;
    try {
      user = await db.collection(USERS_COLLECTION).findOne({ _id: new ObjectId(userId) });
    } catch {
      // Not a valid ObjectId, try by id field
      user = await db.collection(USERS_COLLECTION).findOne({ id: userId });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oderId = user._id.toString();

    // Get related data
    const profile = await db.collection(PROFILES_COLLECTION).findOne({ 
      $or: [{ userId: oderId }, { userId }]
    });
    const smartProfile = await db.collection(SMART_PROFILES_COLLECTION).findOne({ 
      $or: [{ user_id: oderId }, { user_id: userId }]
    });
    const roadmap = await db.collection(ROADMAPS_COLLECTION).findOne({ 
      $or: [{ userId: oderId }, { userId }]
    });
    const sessions = await db.collection(SESSIONS_COLLECTION).find({ userId: oderId }).toArray();
    const documentsCount = await db.collection(DOCUMENTS_COLLECTION).countDocuments({ 
      $or: [{ userId: oderId }, { userId }]
    });

    return NextResponse.json({
      user: {
        id: oderId,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: profile ? {
        id: profile._id?.toString() || profile.id,
        createdFromDream: profile.createdFromDream,
        overallProgress: profile.overallProgress,
        currentStageIndex: profile.currentStageIndex,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      } : null,
      smartProfile: smartProfile ? {
        id: smartProfile._id?.toString(),
        version: smartProfile.version?.version,
        profileCompleteness: smartProfile.profile_completeness,
        createdAt: smartProfile.created_at,
        updatedAt: smartProfile.updated_at,
      } : null,
      roadmap: roadmap ? {
        id: roadmap._id?.toString(),
        targetSeason: roadmap.targetSeason,
        createdAt: roadmap.createdAt,
      } : null,
      stats: {
        activeSessions: sessions.length,
        documentsCount,
      },
      sessions: sessions.map(s => ({
        id: s._id?.toString() || s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
      })),
    });
  } catch (error) {
    console.error('GET /api/admin/users/[userId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/users/[userId] - Update user
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { isAdmin: adminCheck, userId: adminId } = await isAdmin();
    
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { name, email, role } = body;

    const db = await getDb();

    // Check if user exists - try by _id first
    let existingUser = null;
    try {
      existingUser = await db.collection(USERS_COLLECTION).findOne({ _id: new ObjectId(userId) });
    } catch {
      existingUser = await db.collection(USERS_COLLECTION).findOne({ id: userId });
    }
    
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oderId = existingUser._id.toString();

    // Prevent admin from demoting themselves
    if (oderId === adminId && role && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot change your own admin role' }, { status: 400 });
    }

    // Build update object
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) {
      // Check if email is already taken
      const emailExists = await db.collection(USERS_COLLECTION).findOne({ 
        email, 
        _id: { $ne: existingUser._id } 
      });
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      updateFields.email = email;
    }
    if (role !== undefined) updateFields.role = role;

    // Update user
    await db.collection(USERS_COLLECTION).updateOne(
      { _id: existingUser._id },
      { $set: updateFields }
    );

    // Get updated user
    const updatedUser = await db.collection(USERS_COLLECTION).findOne({ _id: existingUser._id });

    return NextResponse.json({
      success: true,
      user: {
        id: oderId,
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role,
        updatedAt: updatedUser?.updatedAt,
      },
    });
  } catch (error) {
    console.error('PUT /api/admin/users/[userId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[userId] - Delete user and all related data
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { isAdmin: adminCheck, userId: adminId } = await isAdmin();
    
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { userId } = await params;

    const db = await getDb();

    // Check if user exists - try by _id first
    let existingUser = null;
    try {
      existingUser = await db.collection(USERS_COLLECTION).findOne({ _id: new ObjectId(userId) });
    } catch {
      existingUser = await db.collection(USERS_COLLECTION).findOne({ id: userId });
    }
    
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oderId = existingUser._id.toString();

    // Prevent admin from deleting themselves
    if (oderId === adminId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Delete all related data
    const deletionResults = {
      user: false,
      profile: 0,
      smartProfile: 0,
      roadmap: 0,
      sessions: 0,
      documents: 0,
      chatSessions: 0,
      chatMessages: 0,
      journeyConversations: 0,
      accounts: 0,
      verifications: 0,
    };

    // Build query for both userId formats
    const userIdQuery = { $or: [{ userId: oderId }, { userId }] };
    const userIdQueryAlt = { $or: [{ user_id: oderId }, { user_id: userId }] };

    // Delete user profile
    const profileResult = await db.collection(PROFILES_COLLECTION).deleteMany(userIdQuery);
    deletionResults.profile = profileResult.deletedCount;

    // Delete smart profile
    const smartProfileResult = await db.collection(SMART_PROFILES_COLLECTION).deleteMany(userIdQueryAlt);
    deletionResults.smartProfile = smartProfileResult.deletedCount;

    // Delete roadmap plans
    const roadmapResult = await db.collection(ROADMAPS_COLLECTION).deleteMany(userIdQuery);
    deletionResults.roadmap = roadmapResult.deletedCount;

    // Delete auth sessions
    const sessionsResult = await db.collection(SESSIONS_COLLECTION).deleteMany({ userId: oderId });
    deletionResults.sessions = sessionsResult.deletedCount;

    // Delete documents
    const documentsResult = await db.collection(DOCUMENTS_COLLECTION).deleteMany(userIdQuery);
    deletionResults.documents = documentsResult.deletedCount;

    // Delete chat sessions
    const chatSessionsResult = await db.collection(CHAT_SESSIONS_COLLECTION).deleteMany(userIdQuery);
    deletionResults.chatSessions = chatSessionsResult.deletedCount;

    // Delete chat messages
    const chatMessagesResult = await db.collection(CHAT_MESSAGES_COLLECTION).deleteMany(userIdQuery);
    deletionResults.chatMessages = chatMessagesResult.deletedCount;

    // Delete journey conversations
    const journeyResult = await db.collection(JOURNEY_CONVERSATIONS_COLLECTION).deleteMany(userIdQueryAlt);
    deletionResults.journeyConversations = journeyResult.deletedCount;

    // Delete linked accounts (OAuth providers)
    const accountsResult = await db.collection(ACCOUNTS_COLLECTION).deleteMany({ userId: oderId });
    deletionResults.accounts = accountsResult.deletedCount;

    // Delete verification tokens
    const verificationsResult = await db.collection(VERIFICATIONS_COLLECTION).deleteMany({ 
      identifier: existingUser.email 
    });
    deletionResults.verifications = verificationsResult.deletedCount;

    // Delete user (last to ensure all related data is cleaned up first)
    const userResult = await db.collection(USERS_COLLECTION).deleteOne({ _id: existingUser._id });
    deletionResults.user = userResult.deletedCount > 0;

    // Calculate total deleted items
    const totalDeleted = Object.values(deletionResults).reduce((sum, val) => 
      sum + (typeof val === 'number' ? val : (val ? 1 : 0)), 0
    );

    return NextResponse.json({
      success: true,
      message: `User ${existingUser.email} and all related data deleted successfully`,
      summary: {
        totalItemsDeleted: totalDeleted,
        details: deletionResults,
      },
    });
  } catch (error) {
    console.error('DELETE /api/admin/users/[userId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
