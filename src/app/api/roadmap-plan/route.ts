// RoadmapPlan API - CRUD operations for user roadmap plans

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { headers } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import type { 
  RoadmapPlan, 
  RoadmapScenario, 
  RoadmapMilestoneRef,
  CreateRoadmapPlanInput,
  RoadmapMode,
  TEST_PREP_BUFFER_DAYS
} from '@/types/roadmap';

const COLLECTION_NAME = 'roadmap_plans';

async function getCollection() {
  const client = await clientPromise;
  const db = client.db();
  return db.collection(COLLECTION_NAME);
}

/**
 * Calculate estimated dates for milestones based on scenario mode
 */
function calculateMilestoneDates(
  stages: Array<{ order: number; title: string; description: string }>,
  targetIntake: { semester: string; year: number },
  mode: RoadmapMode,
  testPrepBufferDays: number = 0
): { estimatedStartDate: Date; estimatedEndDate: Date; milestones: Partial<RoadmapMilestoneRef>[] } {
  const now = new Date();
  
  // Calculate target date based on intake
  let targetMonth: number;
  switch (targetIntake.semester) {
    case 'fall': targetMonth = 8; break; // August
    case 'spring': targetMonth = 0; break; // January
    case 'summer': targetMonth = 5; break; // June
    default: targetMonth = 8;
  }
  
  const targetDate = new Date(targetIntake.year, targetMonth, 1);
  
  // Adjust start based on mode
  let adjustedStart = new Date(now);
  if (mode === 'reality') {
    // Add buffer for test preparation
    adjustedStart.setDate(adjustedStart.getDate() + testPrepBufferDays);
  } else if (mode === 'future') {
    // Future scenario assumes best-case: all tests done, no buffer
    adjustedStart = new Date(now);
  }
  
  // Calculate total days available
  const totalDaysAvailable = Math.max(
    (targetDate.getTime() - adjustedStart.getTime()) / (1000 * 60 * 60 * 24),
    stages.length * 30 // Minimum 30 days per stage
  );
  
  // Distribute time across stages
  const daysPerStage = Math.floor(totalDaysAvailable / stages.length);
  
  const milestones: Partial<RoadmapMilestoneRef>[] = stages.map((stage, index) => {
    const startDate = new Date(adjustedStart);
    startDate.setDate(startDate.getDate() + (index * daysPerStage));
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysPerStage - 1);
    
    return {
      id: crypto.randomUUID(),
      stageId: `stage_${stage.order}`,
      order: stage.order,
      estimatedStartDate: startDate,
      estimatedEndDate: endDate,
      status: index === 0 ? 'not_started' : 'not_started',
      tasks: [],
      progress: 0,
      isCustomized: false,
    };
  });
  
  const estimatedStartDate = milestones[0]?.estimatedStartDate || now;
  const estimatedEndDate = milestones[milestones.length - 1]?.estimatedEndDate || targetDate;
  
  return { estimatedStartDate, estimatedEndDate, milestones };
}

/**
 * Create a scenario from dream stages
 */
function createScenario(
  planId: string,
  mode: RoadmapMode,
  stages: Array<{ order: number; title: string; description: string }>,
  targetIntake: { semester: string; year: number },
  testPrepBufferDays: number = 0
): RoadmapScenario {
  const { estimatedStartDate, estimatedEndDate, milestones } = calculateMilestoneDates(
    stages,
    targetIntake,
    mode,
    testPrepBufferDays
  );
  
  const scenarioNames: Record<RoadmapMode, { name: string; description: string }> = {
    dream: {
      name: 'Dream Path',
      description: 'Your ideal journey based on your aspirations',
    },
    reality: {
      name: 'Reality Check',
      description: 'Realistic timeline based on your current situation',
    },
    future: {
      name: 'Best Case',
      description: 'Optimistic scenario if everything goes perfectly',
    },
  };
  
  const assumptions: Record<RoadmapMode, string[]> = {
    dream: [
      'You have all prerequisites ready',
      'Applications proceed smoothly',
      'No major obstacles',
    ],
    reality: [
      'Test preparation time is factored in',
      'Application processing time included',
      'Buffer for unexpected delays',
    ],
    future: [
      'All tests completed with target scores',
      'Strong application materials ready',
      'Fast-track where possible',
    ],
  };
  
  const risks: Record<RoadmapMode, string[]> = {
    dream: [
      'May need to adjust if preparation takes longer',
      'Competition for top programs',
    ],
    reality: [
      'Timeline may shift based on progress',
      'Some flexibility needed',
    ],
    future: [
      'Requires consistent effort',
      'May need adjustment if delays occur',
    ],
  };
  
  return {
    id: crypto.randomUUID(),
    planId,
    mode,
    name: scenarioNames[mode].name,
    description: scenarioNames[mode].description,
    milestones: milestones as RoadmapMilestoneRef[],
    estimatedStartDate,
    estimatedCompletionDate: estimatedEndDate,
    targetIntake: {
      semester: targetIntake.semester as 'spring' | 'fall' | 'summer',
      year: targetIntake.year,
    },
    overallProgress: 0,
    assumptions: assumptions[mode],
    risks: risks[mode],
    isActive: mode === 'dream', // Dream is active by default
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// GET /api/roadmap-plan - Get user's roadmap plan
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collection = await getCollection();
    const plan = await collection.findOne({ userId: session.user.id });

    if (!plan) {
      return NextResponse.json({ error: 'No roadmap plan found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...planData } = plan;
    return NextResponse.json(planData);
  } catch (error) {
    console.error('GET /api/roadmap-plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/roadmap-plan - Create roadmap plan with 3 scenarios
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateRoadmapPlanInput = await request.json();
    const { dreamSessionId, dreamStages, realityContext, futureAmbitions } = body;

    if (!dreamStages || dreamStages.length === 0) {
      return NextResponse.json(
        { error: 'Dream stages are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection();

    // Check if plan already exists
    const existing = await collection.findOne({ userId: session.user.id });
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...planData } = existing;
      return NextResponse.json(planData);
    }

    // Calculate test prep buffer for Reality scenario
    let testPrepBufferDays = 0;
    if (realityContext?.tests) {
      const testBuffers = {
        not_started: 120,
        preparing: 60,
        scheduled: 30,
        completed: 0,
      };
      
      // Get max buffer from all tests
      const greBuffer = testBuffers[realityContext.tests.gre?.status || 'not_started'];
      const toeflBuffer = testBuffers[realityContext.tests.toefl?.status || 'not_started'];
      const ieltsBuffer = testBuffers[realityContext.tests.ielts?.status || 'not_started'];
      
      testPrepBufferDays = Math.max(greBuffer, toeflBuffer, ieltsBuffer);
    }

    const targetIntake = realityContext?.targetIntake || {
      semester: 'fall',
      year: new Date().getFullYear() + 1,
    };

    const planId = crypto.randomUUID();
    
    // Create all three scenarios
    const dreamScenario = createScenario(planId, 'dream', dreamStages, targetIntake, 0);
    const realityScenario = createScenario(planId, 'reality', dreamStages, targetIntake, testPrepBufferDays);
    const futureScenario = createScenario(planId, 'future', dreamStages, targetIntake, 0);

    const newPlan: RoadmapPlan = {
      id: planId,
      userId: session.user.id,
      scenarios: {
        dream: dreamScenario,
        reality: realityScenario,
        future: futureScenario,
      },
      activeScenarioId: dreamScenario.id,
      activeMode: 'dream',
      createdFromDreamSession: !!dreamSessionId,
      dreamSessionId,
      version: 1,
      lastSyncedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(newPlan);

    // Update user profile with roadmapPlanId
    const profileCollection = (await clientPromise).db().collection('user_profiles');
    await profileCollection.updateOne(
      { userId: session.user.id },
      { $set: { roadmapPlanId: planId, updatedAt: new Date() } }
    );

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('POST /api/roadmap-plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/roadmap-plan - Update roadmap plan (switch scenario, update progress)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    const collection = await getCollection();

    const result = await collection.findOneAndUpdate(
      { userId: session.user.id },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date(),
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Roadmap plan not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...planData } = result;
    return NextResponse.json(planData);
  } catch (error) {
    console.error('PUT /api/roadmap-plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
