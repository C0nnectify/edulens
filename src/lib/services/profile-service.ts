// Profile Service - Handles user profile operations and dream data migration

import type { 
  UserProfile, 
  CreateProfileFromDreamInput, 
  UpdateProfileInput,
  RoadmapStageProgress,
  DreamSessionData,
  SignupStep2Data
} from '@/types/profile';

const DREAM_STORAGE_KEY = 'edulens_dream_state_v1';

interface DreamStateV1 {
  version: 1;
  anonId: string;
  sessionId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'ai';
    content: string;
    ts: number;
    reflection?: string;
    roadmap_stages?: Array<{
      order: number;
      title: string;
      description: string;
    }>;
    next_question?: string;
  }>;
}

/**
 * Load dream state from localStorage
 */
export function loadDreamState(): DreamStateV1 | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const raw = localStorage.getItem(DREAM_STORAGE_KEY);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw) as DreamStateV1;
    if (parsed && parsed.version === 1 && parsed.anonId && parsed.sessionId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear dream state from localStorage after successful migration
 */
export function clearDreamState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DREAM_STORAGE_KEY);
}

/**
 * Convert localStorage dream state to DreamSessionData format
 */
export function convertDreamStateToSessionData(state: DreamStateV1): DreamSessionData {
  // Find the first user message as the original dream
  const firstUserMessage = state.messages.find(m => m.role === 'user');
  const originalDream = firstUserMessage?.content || '';

  // Find the latest AI response with roadmap stages
  const aiMessagesWithRoadmap = state.messages
    .filter(m => m.role === 'ai' && m.roadmap_stages && m.roadmap_stages.length > 0)
    .sort((a, b) => b.ts - a.ts);

  const latestRoadmap = aiMessagesWithRoadmap[0];

  return {
    sessionId: state.sessionId,
    anonId: state.anonId,
    originalDream,
    reflection: latestRoadmap?.reflection,
    roadmapStages: latestRoadmap?.roadmap_stages || [],
    messages: state.messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.ts,
    })),
    createdAt: new Date(),
  };
}

/**
 * Create initial stage progress from dream roadmap stages
 */
export function createInitialStageProgress(
  stages: Array<{ order: number; title: string; description: string }>
): RoadmapStageProgress[] {
  return stages.map((stage, index) => ({
    stageId: `stage_${stage.order}`,
    order: stage.order,
    title: stage.title,
    description: stage.description,
    status: index === 0 ? 'in_progress' : 'not_started',
    startedAt: index === 0 ? new Date() : undefined,
  }));
}

/**
 * Migrate dream data to user profile via API
 * @param userId - The authenticated user's ID
 * @param step2Data - Optional Step 2 data for Reality mode initialization
 */
export async function migrateDreamToProfile(
  userId: string, 
  step2Data?: SignupStep2Data
): Promise<UserProfile | null> {
  const dreamState = loadDreamState();
  
  if (!dreamState) {
    console.log('No dream state found to migrate');
    return null;
  }

  const dreamSessionData = convertDreamStateToSessionData(dreamState);
  
  try {
    const response = await fetch('/api/profile/migrate-dream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        dreamSessionData,
        step2Data,  // Include Step 2 data if provided
      } as CreateProfileFromDreamInput),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to migrate dream data');
    }

    const profile = await response.json() as UserProfile;
    
    // Clear localStorage after successful migration
    clearDreamState();
    
    return profile;
  } catch (error) {
    console.error('Dream migration failed:', error);
    throw error;
  }
}

/**
 * Fetch user profile
 */
export async function fetchProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch('/api/profile');
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return await response.json() as UserProfile;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(updates: UpdateProfileInput): Promise<UserProfile> {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }

  return await response.json() as UserProfile;
}

/**
 * Create a new profile (for users who didn't come from dream)
 */
export async function createProfile(): Promise<UserProfile> {
  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create profile');
  }

  return await response.json() as UserProfile;
}

/**
 * Check if there's pending dream data to migrate
 */
export function hasPendingDreamData(): boolean {
  const state = loadDreamState();
  return state !== null && state.messages.length > 0;
}

/**
 * Get summary of pending dream data (for UI preview)
 */
export function getDreamDataSummary(): { 
  originalDream: string; 
  stageCount: number; 
  sessionId: string;
} | null {
  const state = loadDreamState();
  if (!state || state.messages.length === 0) return null;

  const firstUserMessage = state.messages.find(m => m.role === 'user');
  const aiWithRoadmap = state.messages.find(
    m => m.role === 'ai' && m.roadmap_stages && m.roadmap_stages.length > 0
  );

  return {
    originalDream: firstUserMessage?.content || '',
    stageCount: aiWithRoadmap?.roadmap_stages?.length || 0,
    sessionId: state.sessionId,
  };
}
