// User Profile Types for Dream-to-Reality Journey
// SmartProfile with Reality Context & Future Ambitions

import type { 
  RealityContext, 
  FutureAmbitions, 
  SignupStep2Data,
  BudgetRange,
  IntakeSemester,
  TestPrepStatus 
} from './roadmap';

// Re-export for convenience
export type { RealityContext, FutureAmbitions, SignupStep2Data };

export interface RoadmapStageProgress {
  stageId: string;
  order: number;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export interface UserGoal {
  id: string;
  category: 'education' | 'test_score' | 'application' | 'timeline' | 'career' | 'custom';
  title: string;
  targetValue?: string;
  currentValue?: string;
  deadline?: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'achieved';
  createdAt: Date;
  updatedAt: Date;
}

export interface TargetProgram {
  id: string;
  universityName: string;
  programName: string;
  degree: 'masters' | 'phd' | 'mba' | 'other';
  country: string;
  applicationDeadline?: Date;
  priority: 'dream' | 'target' | 'safety';
  status: 'researching' | 'preparing' | 'applied' | 'accepted' | 'rejected' | 'waitlisted';
  notes?: string;
  addedAt: Date;
}

export interface DreamSessionData {
  sessionId: string;
  anonId: string;
  originalDream: string;
  reflection?: string;
  roadmapStages: Array<{
    order: number;
    title: string;
    description: string;
  }>;
  messages: Array<{
    role: 'user' | 'ai';
    content: string;
    timestamp: number;
  }>;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  
  // Dream journey origin
  createdFromDream: boolean;
  dreamSessionData?: DreamSessionData;
  
  // ==========================================================================
  // SmartProfile Fields (PRD v2)
  // ==========================================================================
  
  // Reality Context - Evidence-based current state
  realityContext?: RealityContext;
  
  // Future Ambitions - User's dream goals
  futureAmbitions?: FutureAmbitions;
  
  // Link to RoadmapPlan (separate collection)
  roadmapPlanId?: string;
  
  // Profile completion status
  profileCompletionStep: 'basic' | 'reality' | 'complete';
  
  // ==========================================================================
  // Journey Progress (existing)
  // ==========================================================================
  
  // Journey progress
  currentStageIndex: number;
  stagesProgress: RoadmapStageProgress[];
  overallProgress: number; // 0-100
  
  // Goals tracking
  goals: UserGoal[];
  
  // Target programs
  targetPrograms: TargetProgram[];
  
  // Timeline
  targetStartDate?: Date; // When they want to start their program
  applicationSeason?: string; // e.g., "Fall 2026"
  
  // Academic background (legacy - use realityContext instead)
  academicBackground?: {
    currentDegree?: string;
    major?: string;
    university?: string;
    gpa?: number;
    gpaScale?: number;
  };
  
  // Test scores (legacy - use realityContext.tests instead)
  testScores?: {
    gre?: { verbal?: number; quant?: number; awa?: number; date?: Date };
    toefl?: { total?: number; date?: Date };
    ielts?: { band?: number; date?: Date };
    gmat?: { total?: number; date?: Date };
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

// Type for creating a new profile from dream migration
export interface CreateProfileFromDreamInput {
  userId: string;
  dreamSessionData: DreamSessionData;
  step2Data?: SignupStep2Data;  // Optional Step 2 data
}

// Type for profile update
export interface UpdateProfileInput {
  currentStageIndex?: number;
  stagesProgress?: RoadmapStageProgress[];
  goals?: UserGoal[];
  targetPrograms?: TargetProgram[];
  targetStartDate?: Date;
  applicationSeason?: string;
  academicBackground?: UserProfile['academicBackground'];
  testScores?: UserProfile['testScores'];
  realityContext?: RealityContext;
  futureAmbitions?: FutureAmbitions;
  profileCompletionStep?: UserProfile['profileCompletionStep'];
}
