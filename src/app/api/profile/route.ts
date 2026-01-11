import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { headers } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { UserProfile, UpdateProfileInput } from '@/types/profile';

const COLLECTION_NAME = 'user_profiles';

async function getCollection() {
  const client = await clientPromise;
  const db = client.db();
  return db.collection(COLLECTION_NAME);
}

// GET /api/profile - Fetch current user's profile
export async function GET() {
  try {
    let session;
    try {
      session = await auth.api.getSession({
        headers: await headers(),
      });
    } catch (authError) {
      console.error('[Profile API] Auth session error:', authError);
      return NextResponse.json({ 
        error: 'Authentication error', 
        details: authError instanceof Error ? authError.message : 'Unknown auth error' 
      }, { status: 500 });
    }

    console.log('[Profile API] Session:', { userId: session?.user?.id, hasSession: !!session });

    if (!session?.user?.id) {
      console.log('[Profile API] No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collection = await getCollection();
    console.log('[Profile API] Looking for profile with userId:', session.user.id);
    
    // Try to find profile with either string userId or ObjectId userId
    let profile = await collection.findOne({ userId: session.user.id });
    
    // If not found and the userId looks like it could be an ObjectId string, try that too
    if (!profile && ObjectId.isValid(session.user.id)) {
      console.log('[Profile API] Trying with ObjectId');
      profile = await collection.findOne({ userId: new ObjectId(session.user.id) });
    }

    if (!profile) {
      console.log('[Profile API] Profile not found for userId:', session.user.id);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('[Profile API] Profile found');
    // Remove MongoDB _id and return
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...profileData } = profile;
    return NextResponse.json(profileData);
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/profile - Create a new profile (for non-dream users)
export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collection = await getCollection();

    // Check if profile already exists
    const existing = await collection.findOne({ userId: session.user.id });
    if (existing) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });
    }

    const now = new Date();
    const newProfile: UserProfile = {
      id: crypto.randomUUID(),
      userId: session.user.id,
      createdFromDream: false,
      currentStageIndex: 0,
      stagesProgress: [],
      overallProgress: 0,
      goals: [],
      targetPrograms: [],
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    };

    await collection.insertOne(newProfile);

    return NextResponse.json(newProfile, { status: 201 });
  } catch (error) {
    console.error('POST /api/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/profile - Update user's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates: UpdateProfileInput = await request.json();
    const collection = await getCollection();

    // Build update object
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    };

    // Only include provided fields
    if (updates.currentStageIndex !== undefined) {
      updateFields.currentStageIndex = updates.currentStageIndex;
    }
    if (updates.stagesProgress !== undefined) {
      updateFields.stagesProgress = updates.stagesProgress;
      // Calculate overall progress
      const completed = updates.stagesProgress.filter(s => s.status === 'completed').length;
      updateFields.overallProgress = Math.round((completed / updates.stagesProgress.length) * 100);
    }
    if (updates.goals !== undefined) {
      updateFields.goals = updates.goals;
    }
    if (updates.targetPrograms !== undefined) {
      updateFields.targetPrograms = updates.targetPrograms;
    }
    if (updates.targetStartDate !== undefined) {
      updateFields.targetStartDate = updates.targetStartDate;
    }
    if (updates.applicationSeason !== undefined) {
      updateFields.applicationSeason = updates.applicationSeason;
    }
    if (updates.academicBackground !== undefined) {
      updateFields.academicBackground = updates.academicBackground;
    }
    if (updates.testScores !== undefined) {
      updateFields.testScores = updates.testScores;
    }

    const result = await collection.findOneAndUpdate(
      { userId: session.user.id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...profileData } = result;
    return NextResponse.json(profileData);
  } catch (error) {
    console.error('PUT /api/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
