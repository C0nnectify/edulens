/**
 * Roadmap types for Dream Mode journey
 * PRD Section 7 - RoadmapPlan & Multi-Scenario Support
 */

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type RoadmapMode = 'dream' | 'reality' | 'future';

// =============================================================================
// PRD Section 7: RoadmapPlan Schema
// =============================================================================

/**
 * Task status within a milestone
 */
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

/**
 * Test preparation status for Reality mode
 */
export type TestPrepStatus = 'not_started' | 'preparing' | 'scheduled' | 'completed';

/**
 * Budget range categories
 */
export type BudgetRange = 
  | 'under_20k'      // < $20,000/year
  | '20k_40k'        // $20,000 - $40,000/year
  | '40k_60k'        // $40,000 - $60,000/year
  | '60k_80k'        // $60,000 - $80,000/year
  | 'above_80k'      // > $80,000/year
  | 'flexible';      // No budget constraint

/**
 * Intake semester options
 */
export type IntakeSemester = 'spring' | 'fall' | 'summer';

/**
 * RoadmapTaskTemplate - Template for generating tasks within milestones
 * Used for creating actionable items within each stage
 */
export interface RoadmapTaskTemplate {
  id: string;
  stageId: string;                    // Parent stage ID
  title: string;
  description: string;
  estimatedDays: number;              // Estimated completion time
  dependencies?: string[];            // Task IDs that must complete first
  category: 'preparation' | 'action' | 'review' | 'submission';
  isRequired: boolean;                // Required vs optional task
  evidenceType?: 'document' | 'score' | 'confirmation' | 'none';
  order: number;                      // Order within the stage
}

/**
 * RoadmapTask - Actual task instance (generated from template)
 */
export interface RoadmapTask {
  id: string;
  templateId: string;                 // Reference to RoadmapTaskTemplate
  title: string;
  description: string;
  status: TaskStatus;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  evidence?: {
    type: 'document' | 'score' | 'confirmation';
    value: string;                    // URL, score value, or confirmation text
    uploadedAt: Date;
  };
  notes?: string;
}

/**
 * RoadmapMilestoneRef - Linked milestone within a scenario
 * Represents a stage with its tasks and timeline in a specific scenario
 */
export interface RoadmapMilestoneRef {
  id: string;
  stageId: string;                    // Reference to StageConfig ID
  scenarioId: string;                 // Parent scenario
  order: number;
  
  // Timeline
  estimatedStartDate: Date;
  estimatedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  
  // Status
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  blockedReason?: string;
  
  // Tasks within this milestone
  tasks: RoadmapTask[];
  
  // Progress
  progress: number;                   // 0-100 based on task completion
  
  // Notes and customization
  userNotes?: string;
  isCustomized: boolean;              // User modified from default
}

/**
 * RoadmapScenario - A complete roadmap scenario (Dream/Reality/Future)
 * Each scenario represents a different projection of the user's journey
 */
export interface RoadmapScenario {
  id: string;
  planId: string;                     // Parent RoadmapPlan ID
  mode: RoadmapMode;
  name: string;                       // "My Dream Path", "Reality Check", "Best Case"
  description: string;
  
  // Milestones (stages with tasks)
  milestones: RoadmapMilestoneRef[];
  
  // Timeline summary
  estimatedStartDate: Date;
  estimatedCompletionDate: Date;
  targetIntake: {
    semester: IntakeSemester;
    year: number;
  };
  
  // Progress
  overallProgress: number;            // 0-100
  currentMilestoneId?: string;
  
  // Scenario-specific adjustments
  assumptions: string[];              // What this scenario assumes
  risks: string[];                    // Potential risks in this scenario
  
  // Metadata
  isActive: boolean;                  // Currently selected scenario
  createdAt: Date;
  updatedAt: Date;
}

/**
 * RoadmapPlan - Main container linking user to their scenarios
 * PRD R1: The root document that owns all scenarios
 */
export interface RoadmapPlan {
  id: string;
  userId: string;
  
  // Scenarios
  scenarios: {
    dream: RoadmapScenario;
    reality: RoadmapScenario;
    future: RoadmapScenario;
  };
  
  // Active scenario selection
  activeScenarioId: string;
  activeMode: RoadmapMode;
  
  // Origin tracking
  createdFromDreamSession: boolean;
  dreamSessionId?: string;
  
  // Plan-level metadata
  version: number;                    // For versioning/history
  lastSyncedAt: Date;                 // Last sync with AI recommendations
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Reality Context & Future Ambitions (SmartProfile Extension)
// =============================================================================

/**
 * Test score with preparation status
 */
export interface TestScoreWithStatus {
  status: TestPrepStatus;
  targetScore?: number;
  currentScore?: number;
  scheduledDate?: Date;
  completedDate?: Date;
}

/**
 * RealityContext - Evidence-based current state
 * Used to calculate realistic timelines and recommendations
 */
export interface RealityContext {
  // Academic
  gpa: number;
  gpaScale: number;                   // 4.0, 10.0, etc.
  currentDegree: 'bachelors' | 'masters' | 'phd' | 'other';
  graduationYear?: number;
  major?: string;
  university?: string;
  
  // Test scores with status
  tests: {
    gre?: TestScoreWithStatus;
    toefl?: TestScoreWithStatus;
    ielts?: TestScoreWithStatus;
    gmat?: TestScoreWithStatus;
  };
  
  // Constraints
  budget: BudgetRange;
  workExperienceYears?: number;
  canRelocateImmediately: boolean;
  
  // Timeline constraints
  targetIntake: {
    semester: IntakeSemester;
    year: number;
  };
  
  // Additional constraints
  constraints?: string[];             // Free-form constraints
}

/**
 * FutureAmbitions - User's dream goals and preferences
 * Used to personalize recommendations and future scenario
 */
export interface FutureAmbitions {
  // Dream destinations
  dreamCountries: string[];           // Top 1-3 countries
  dreamUniversities?: string[];       // Specific universities (optional)
  
  // Program preferences
  preferredProgramType: 'masters' | 'phd' | 'mba' | 'any';
  fieldOfStudy?: string;
  
  // Career goals
  careerGoal?: string;
  industryPreference?: string[];
  
  // Improvement levers - what user is willing to do
  levers: {
    willingToImproveGPA: boolean;
    willingToRetakeTests: boolean;
    willingToGainExperience: boolean;
    willingToDoResearch: boolean;
    willingToExtendTimeline: boolean;
  };
  
  // Priorities
  priorities: ('ranking' | 'cost' | 'location' | 'career_outcomes' | 'research')[];
}

export interface StageMeta {
  durationHint: string;
  difficulty: DifficultyLevel;
}

export interface FeatureHook {
  title: string;
  body: string;
}

export interface StageConfig {
  id: string;
  order: number;
  shortLabel: string;
  fullTitle: string;
  themeColor: string;
  goal: string;
  dos: string[];
  donts: string[];
  edulensFeatureHook: FeatureHook;
  meta: StageMeta;
}

export interface StageListResponse {
  success: boolean;
  stages: StageConfig[];
  total: number;
}

export interface StageResponse {
  success: boolean;
  stage: StageConfig;
}

export type AnalyticsEventType =
  | 'roadmap_opened'
  | 'dream_mode_started'
  | 'dream_stage_viewed'
  | 'dream_mode_completed'
  | 'dream_mode_to_signup_click'
  | 'dream_mode_to_reality_mode_click';

export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  stage_id?: string;
  session_id: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsEventResponse {
  success: boolean;
  message: string;
  event_id: string;
}

export interface DreamModeState {
  currentStageIndex: number;
  completedStages: Set<string>;
  sessionId: string;
  showCompletion: boolean;
}

// =============================================================================
// Scenario Calculation Utilities
// =============================================================================

/**
 * Buffer days added based on test preparation status
 * Used for Reality scenario calculation
 */
export const TEST_PREP_BUFFER_DAYS: Record<TestPrepStatus, number> = {
  not_started: 120,    // 4 months buffer
  preparing: 60,       // 2 months buffer
  scheduled: 30,       // 1 month buffer
  completed: 0,        // No buffer needed
};

/**
 * Input for creating a new RoadmapPlan
 */
export interface CreateRoadmapPlanInput {
  userId: string;
  dreamSessionId?: string;
  dreamStages: Array<{
    order: number;
    title: string;
    description: string;
  }>;
  realityContext: RealityContext;
  futureAmbitions: FutureAmbitions;
}

/**
 * Step 2 signup data for Reality mode initialization
 */
export interface SignupStep2Data {
  // Academic
  gpa: number;
  gpaScale: number;
  currentDegree: 'bachelors' | 'masters' | 'phd' | 'other';
  major?: string;
  
  // Test status
  tests: {
    gre?: { status: TestPrepStatus; targetScore?: number };
    toefl?: { status: TestPrepStatus; targetScore?: number };
    ielts?: { status: TestPrepStatus; targetScore?: number };
  };
  
  // Constraints
  budget: BudgetRange;
  targetIntake: {
    semester: IntakeSemester;
    year: number;
  };
  
  // Future ambitions
  dreamCountries: string[];
  dreamUniversities?: string[];
  preferredProgramType: 'masters' | 'phd' | 'mba' | 'any';
}
