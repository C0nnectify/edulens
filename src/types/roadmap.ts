/**
 * Roadmap types for Dream Mode journey
 */

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type RoadmapMode = 'dream' | 'reality' | 'future';

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
