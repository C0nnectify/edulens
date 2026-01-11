// Migrate Dream Data to Profile API

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { headers } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import type { 
  UserProfile, 
  CreateProfileFromDreamInput,
  RoadmapStageProgress,
  RealityContext,
  FutureAmbitions
} from '@/types/profile';
import type { SignupStep2Data } from '@/types/roadmap';

const COLLECTION_NAME = 'user_profiles';

async function getCollection() {
  const client = await clientPromise;
  const db = client.db();
  return db.collection(COLLECTION_NAME);
}

/**
 * Convert Step 2 data to RealityContext
 */
function convertStep2ToRealityContext(step2Data: SignupStep2Data): RealityContext {
  return {
    gpa: step2Data.gpa,
    gpaScale: step2Data.gpaScale,
    currentDegree: step2Data.currentDegree,
    major: step2Data.major,
    tests: {
      gre: step2Data.tests.gre ? {
        status: step2Data.tests.gre.status,
        targetScore: step2Data.tests.gre.targetScore,
      } : undefined,
      toefl: step2Data.tests.toefl ? {
        status: step2Data.tests.toefl.status,
        targetScore: step2Data.tests.toefl.targetScore,
      } : undefined,
      ielts: step2Data.tests.ielts ? {
        status: step2Data.tests.ielts.status,
        targetScore: step2Data.tests.ielts.targetScore,
      } : undefined,
    },
    budget: step2Data.budget,
    canRelocateImmediately: true, // Default
    targetIntake: step2Data.targetIntake,
  };
}

/**
 * Convert Step 2 data to FutureAmbitions
 */
function convertStep2ToFutureAmbitions(step2Data: SignupStep2Data): FutureAmbitions {
  return {
    dreamCountries: step2Data.dreamCountries,
    dreamUniversities: step2Data.dreamUniversities,
    preferredProgramType: step2Data.preferredProgramType,
    levers: {
      willingToImproveGPA: true,
      willingToRetakeTests: true,
      willingToGainExperience: true,
      willingToDoResearch: true,
      willingToExtendTimeline: true,
    },
    priorities: ['ranking', 'career_outcomes'], // Default priorities
  };
}

// POST /api/profile/migrate-dream - Create profile from dream session data
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateProfileFromDreamInput = await request.json();
    const { dreamSessionData, step2Data } = body;

    if (!dreamSessionData) {
      return NextResponse.json(
        { error: 'Dream session data is required' }, 
        { status: 400 }
      );
    }

    const collection = await getCollection();

    // Convert Step 2 data if provided
    const realityContext = step2Data ? convertStep2ToRealityContext(step2Data) : undefined;
    const futureAmbitions = step2Data ? convertStep2ToFutureAmbitions(step2Data) : undefined;
    const profileCompletionStep = step2Data ? 'reality' : 'basic';

    // Check if profile already exists
    const existing = await collection.findOne({ userId: session.user.id });
    if (existing) {
      // Update existing profile with dream data if it doesn't have it
      if (!existing.dreamSessionData) {
        const stagesProgress = createInitialStageProgress(dreamSessionData.roadmapStages);
        
        const result = await collection.findOneAndUpdate(
          { userId: session.user.id },
          { 
            $set: {
              dreamSessionData,
              createdFromDream: true,
              stagesProgress,
              currentStageIndex: 0,
              realityContext,
              futureAmbitions,
              profileCompletionStep,
              updatedAt: new Date(),
              lastActiveAt: new Date(),
            }
          },
          { returnDocument: 'after' }
        );

        if (result) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _id, ...profileData } = result;
          return NextResponse.json(profileData);
        }
      }
      
      // Profile already has dream data, but update with step2 if provided
      if (step2Data && !existing.realityContext) {
        const result = await collection.findOneAndUpdate(
          { userId: session.user.id },
          { 
            $set: {
              realityContext,
              futureAmbitions,
              profileCompletionStep,
              updatedAt: new Date(),
              lastActiveAt: new Date(),
            }
          },
          { returnDocument: 'after' }
        );
        
        if (result) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _id, ...profileData } = result;
          return NextResponse.json(profileData);
        }
      }
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...profileData } = existing;
      return NextResponse.json(profileData);
    }

    // Create new profile with dream data
    const stagesProgress = createInitialStageProgress(dreamSessionData.roadmapStages);
    const now = new Date();

    const newProfile: UserProfile = {
      id: crypto.randomUUID(),
      userId: session.user.id,
      createdFromDream: true,
      dreamSessionData,
      realityContext,
      futureAmbitions,
      profileCompletionStep,
      currentStageIndex: 0,
      stagesProgress,
      overallProgress: 0,
      goals: [],
      targetPrograms: [],
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    };

    await collection.insertOne(newProfile);

    // If step2Data is provided, regenerate the roadmap with combined context
    // This ensures the roadmap reflects both dream aspirations and reality constraints
    if (step2Data) {
      try {
        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        
        // Create SmartProfile from step2 data for roadmap generation
        const smartProfileData = {
          user_id: session.user.id,
          initial_data: {
            application_goals: {
              target_degree: step2Data.preferredProgramType,
              target_countries: step2Data.dreamCountries,
              target_intake: step2Data.targetIntake,
              field_of_interest: step2Data.major,
            },
            education: {
              entries: [{
                degree_type: step2Data.currentDegree,
                gpa: step2Data.gpa,
                gpa_scale: step2Data.gpaScale,
                field_of_study: step2Data.major,
              }],
            },
            test_scores: {
              gre: step2Data.tests.gre,
              toefl: step2Data.tests.toefl,
              ielts: step2Data.tests.ielts,
            },
            financial_details: {
              budget_range: { 
                range: step2Data.budget,
              },
              need_scholarship: step2Data.budget === 'under_20k',
            },
          },
        };

        // Create/update SmartProfile
        await fetch(`${AI_SERVICE_URL}/api/v1/smart-profile/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(smartProfileData),
        }).catch(() => {});

        // Trigger roadmap regeneration from combined profile context
        await fetch(`${AI_SERVICE_URL}/api/v1/smart-profile/${session.user.id}/generate-dream-roadmap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ regenerate: true }),
        }).catch(() => {});
        
      } catch (syncError) {
        console.warn('Roadmap regeneration failed (non-blocking):', syncError);
        // Don't fail the migration if sync fails
      }
    }

    return NextResponse.json(newProfile, { status: 201 });
  } catch (error) {
    console.error('POST /api/profile/migrate-dream error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function createInitialStageProgress(
  stages: Array<{ order: number; title: string; description: string }>
): RoadmapStageProgress[] {
  const now = new Date();
  
  return stages.map((stage, index) => ({
    stageId: `stage_${stage.order}`,
    order: stage.order,
    title: stage.title,
    description: stage.description,
    status: index === 0 ? 'in_progress' as const : 'not_started' as const,
    startedAt: index === 0 ? now : undefined,
  }));
}
