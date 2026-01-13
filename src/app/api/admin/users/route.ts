/**
 * Admin API - User Management
 * 
 * Provides endpoints for admin to view, update, and delete users.
 * Requires admin role for access.
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

  // Check user role - better-auth uses _id as ObjectId
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

// GET /api/admin/users - Get all users with pagination and search
export async function GET(request: NextRequest) {
  try {
    const { isAdmin: adminCheck, userId } = await isAdmin();
    
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const db = await getDb();
    const collection = db.collection(USERS_COLLECTION);

    // Build query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const totalCount = await collection.countDocuments(query);

    // Get paginated users
    const users = await collection
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Get additional data for each user
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const oderId = user._id.toString();
        
        // Get profile status - try both id formats
        const profile = await db.collection(PROFILES_COLLECTION).findOne({ 
          $or: [{ userId: oderId }, { userId: user.id }]
        });
        const smartProfile = await db.collection(SMART_PROFILES_COLLECTION).findOne({ 
          $or: [{ user_id: oderId }, { user_id: user.id }]
        });
        
        // Get session count
        const sessionCount = await db.collection(SESSIONS_COLLECTION).countDocuments({ 
          userId: oderId 
        });

        return {
          id: oderId,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          emailVerified: user.emailVerified,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          hasProfile: !!profile,
          hasSmartProfile: !!smartProfile,
          profileCompleteness: smartProfile?.profile_completeness || profile?.overallProgress || 0,
          activeSessions: sessionCount,
        };
      })
    );

    return NextResponse.json({
      users: usersWithDetails,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      requestedBy: userId,
    });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
