/**
 * Admin API - Database Stats
 * 
 * Get database statistics and overview.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { headers } from 'next/headers';
import { getMongoClientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

async function getDb() {
  const client = await getMongoClientPromise();
  return client.db();
}

// Check if user is admin
async function isAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return false;
  }

  const db = await getDb();
  let user = await db.collection('user').findOne({ id: session.user.id });
  
  // If not found by id field, try by _id (ObjectId)
  if (!user) {
    try {
      user = await db.collection('user').findOne({ _id: new ObjectId(session.user.id) });
    } catch {
      // Not a valid ObjectId, ignore
    }
  }
  
  return user?.role === 'admin';
}

// GET /api/admin/stats - Get database statistics
export async function GET() {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const db = await getDb();

    // Get collection stats
    const collections = [
      'user',
      'session',
      'user_profiles',
      'smart_profiles',
      'roadmap_plans',
      'documents',
      'chat_sessions',
      'applications',
    ];

    const stats: Record<string, number> = {};
    
    for (const collName of collections) {
      try {
        stats[collName] = await db.collection(collName).countDocuments();
      } catch {
        stats[collName] = 0;
      }
    }

    // Get users by role
    const usersByRole = await db.collection('user').aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).toArray();

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSignups = await db.collection('user').countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get active sessions
    const now = new Date();
    const activeSessions = await db.collection('session').countDocuments({
      expiresAt: { $gt: now }
    });

    // Get users with profiles
    const usersWithProfiles = await db.collection('user_profiles').countDocuments();
    const usersWithSmartProfiles = await db.collection('smart_profiles').countDocuments();

    return NextResponse.json({
      collections: stats,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id || 'user'] = item.count;
        return acc;
      }, {} as Record<string, number>),
      overview: {
        totalUsers: stats.user || 0,
        recentSignups,
        activeSessions,
        usersWithProfiles,
        usersWithSmartProfiles,
        totalDocuments: stats.documents || 0,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('GET /api/admin/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
