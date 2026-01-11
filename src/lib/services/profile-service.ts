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

// ============================================
// DREAM CHAT EXTRACTION FOR PRE-FILLING
// ============================================

export interface ExtractedOnboardingField {
  field: string;
  value: string | string[] | number;
  confidence: 'high' | 'medium' | 'low';
  source: 'dream_chat';
  sourceText?: string;
}

export interface ExtractedOnboardingData {
  dreamCountries?: ExtractedOnboardingField;
  preferredProgramType?: ExtractedOnboardingField;
  budget?: ExtractedOnboardingField;
  targetIntake?: ExtractedOnboardingField;
  major?: ExtractedOnboardingField;
  currentDegree?: ExtractedOnboardingField;
}

// Country patterns - mapping common mentions to standardized codes
const COUNTRY_PATTERNS: Record<string, string[]> = {
  'USA': ['usa', 'us', 'united states', 'america', 'american', 'states'],
  'UK': ['uk', 'united kingdom', 'england', 'britain', 'british', 'london'],
  'Canada': ['canada', 'canadian', 'toronto', 'vancouver'],
  'Germany': ['germany', 'german', 'deutschland', 'munich', 'berlin'],
  'Australia': ['australia', 'australian', 'sydney', 'melbourne'],
  'Netherlands': ['netherlands', 'dutch', 'holland', 'amsterdam'],
  'France': ['france', 'french', 'paris'],
  'Singapore': ['singapore'],
  'Japan': ['japan', 'japanese', 'tokyo'],
  'Ireland': ['ireland', 'irish', 'dublin'],
};

// Degree patterns
const DEGREE_PATTERNS: Record<string, string[]> = {
  'masters': ["master's", 'masters', 'ms', 'msc', 'ma', 'mba', 'graduate degree', 'grad school'],
  'phd': ['phd', 'ph.d', 'doctorate', 'doctoral', 'research degree'],
  'mba': ['mba', 'business administration'],
  'bachelors': ["bachelor's", 'bachelors', 'undergraduate', 'bs', 'ba'],
};

// Budget patterns - looking for mentions of cost/budget/funding
const BUDGET_PATTERNS = [
  { pattern: /(?:under|below|less than)\s*\$?\s*20[,.]?000|budget.*(?:tight|limited|low)/i, value: 'under_20k' },
  { pattern: /\$?\s*20[,.]?000\s*(?:to|-)\s*40[,.]?000|moderate budget/i, value: '20k_40k' },
  { pattern: /\$?\s*40[,.]?000\s*(?:to|-)\s*60[,.]?000/i, value: '40k_60k' },
  { pattern: /\$?\s*60[,.]?000\s*(?:to|-)\s*80[,.]?000/i, value: '60k_80k' },
  { pattern: /(?:above|over|more than)\s*\$?\s*80[,.]?000|money.*(?:not|isn't).*(?:issue|problem)|unlimited/i, value: 'above_80k' },
  { pattern: /flexible|open budget|depends on school/i, value: 'flexible' },
  { pattern: /scholarship|funded|assistantship|need funding|financial aid/i, value: 'under_20k' }, // Implies tight budget
];

// Semester patterns
const SEMESTER_PATTERNS = [
  { pattern: /fall\s*(?:20)?2[0-9]/i, semester: 'fall' },
  { pattern: /spring\s*(?:20)?2[0-9]/i, semester: 'spring' },
  { pattern: /summer\s*(?:20)?2[0-9]/i, semester: 'summer' },
  { pattern: /next fall|coming fall|this fall/i, semester: 'fall' },
  { pattern: /next spring|coming spring/i, semester: 'spring' },
];

// Year patterns
const YEAR_PATTERN = /(?:fall|spring|summer|intake|start|begin|enroll).*?(202[4-9]|203[0-9])|(?:202[4-9]|203[0-9]).*?(?:fall|spring|summer|intake)/i;

// Major/Field patterns
const FIELD_PATTERNS = [
  'computer science', 'cs', 'software engineering', 'data science', 'machine learning', 'ai', 'artificial intelligence',
  'electrical engineering', 'mechanical engineering', 'civil engineering', 'chemical engineering',
  'business', 'finance', 'marketing', 'management', 'economics',
  'biology', 'biotechnology', 'chemistry', 'physics', 'mathematics',
  'psychology', 'sociology', 'political science', 'international relations',
  'law', 'medicine', 'public health', 'nursing',
  'design', 'architecture', 'arts', 'film', 'music',
];

/**
 * Extract onboarding data from dream chat messages
 * Uses pattern matching with confidence scores
 */
export function extractOnboardingFromDreamChat(): ExtractedOnboardingData {
  const state = loadDreamState();
  if (!state || state.messages.length === 0) return {};

  const extracted: ExtractedOnboardingData = {};
  
  // Combine all user messages for analysis
  const userMessages = state.messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');
  
  const allMessages = state.messages
    .map(m => m.content)
    .join(' ');
  
  const textLower = userMessages.toLowerCase();
  const allTextLower = allMessages.toLowerCase();

  // Extract countries
  const foundCountries: string[] = [];
  for (const [country, patterns] of Object.entries(COUNTRY_PATTERNS)) {
    for (const pattern of patterns) {
      if (textLower.includes(pattern)) {
        if (!foundCountries.includes(country)) {
          foundCountries.push(country);
        }
        break;
      }
    }
  }
  if (foundCountries.length > 0) {
    extracted.dreamCountries = {
      field: 'dreamCountries',
      value: foundCountries.slice(0, 3), // Max 3
      confidence: foundCountries.length === 1 ? 'high' : 'medium',
      source: 'dream_chat',
      sourceText: userMessages.slice(0, 100),
    };
  }

  // Extract degree type
  for (const [degree, patterns] of Object.entries(DEGREE_PATTERNS)) {
    for (const pattern of patterns) {
      if (textLower.includes(pattern)) {
        extracted.preferredProgramType = {
          field: 'preferredProgramType',
          value: degree,
          confidence: 'high',
          source: 'dream_chat',
        };
        break;
      }
    }
    if (extracted.preferredProgramType) break;
  }

  // Extract budget hints
  for (const { pattern, value } of BUDGET_PATTERNS) {
    if (pattern.test(allTextLower)) {
      extracted.budget = {
        field: 'budget',
        value,
        confidence: value === 'under_20k' && /scholarship|funded/i.test(allTextLower) ? 'medium' : 'high',
        source: 'dream_chat',
      };
      break;
    }
  }

  // Extract target intake
  for (const { pattern, semester } of SEMESTER_PATTERNS) {
    if (pattern.test(textLower)) {
      const yearMatch = YEAR_PATTERN.exec(textLower);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear() + 1;
      
      extracted.targetIntake = {
        field: 'targetIntake',
        value: JSON.stringify({ semester, year }),
        confidence: yearMatch ? 'high' : 'medium',
        source: 'dream_chat',
      };
      break;
    }
  }

  // Extract field/major
  for (const field of FIELD_PATTERNS) {
    if (textLower.includes(field)) {
      extracted.major = {
        field: 'major',
        value: field.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        confidence: 'high',
        source: 'dream_chat',
      };
      break;
    }
  }

  // Infer current degree from context
  if (textLower.includes('currently studying') || textLower.includes('final year') || 
      textLower.includes('graduating') || textLower.includes('undergraduate')) {
    extracted.currentDegree = {
      field: 'currentDegree',
      value: 'bachelors',
      confidence: 'medium',
      source: 'dream_chat',
    };
  } else if (textLower.includes('working') || textLower.includes('job') || 
             textLower.includes('experience') || textLower.includes('professional')) {
    extracted.currentDegree = {
      field: 'currentDegree',
      value: 'bachelors', // Likely completed
      confidence: 'low',
      source: 'dream_chat',
    };
  }

  return extracted;
}

/**
 * Get prefill data for SignupStep2Form based on dream chat
 * Filters by confidence threshold
 */
export function getPrefillDataFromDream(minConfidence: 'low' | 'medium' | 'high' = 'medium'): Partial<SignupStep2Data> & { 
  _extracted: ExtractedOnboardingData;
} {
  const extracted = extractOnboardingFromDreamChat();
  const prefill: Partial<SignupStep2Data> = {};
  
  const confidenceOrder = ['low', 'medium', 'high'];
  const minIndex = confidenceOrder.indexOf(minConfidence);
  
  const shouldInclude = (conf: 'low' | 'medium' | 'high') => 
    confidenceOrder.indexOf(conf) >= minIndex;

  if (extracted.dreamCountries && shouldInclude(extracted.dreamCountries.confidence)) {
    prefill.dreamCountries = extracted.dreamCountries.value as string[];
  }

  if (extracted.preferredProgramType && shouldInclude(extracted.preferredProgramType.confidence)) {
    prefill.preferredProgramType = extracted.preferredProgramType.value as SignupStep2Data['preferredProgramType'];
  }

  if (extracted.budget && shouldInclude(extracted.budget.confidence)) {
    prefill.budget = extracted.budget.value as SignupStep2Data['budget'];
  }

  if (extracted.targetIntake && shouldInclude(extracted.targetIntake.confidence)) {
    try {
      const intake = JSON.parse(extracted.targetIntake.value as string);
      prefill.targetIntake = intake;
    } catch {
      // Ignore parse errors
    }
  }

  if (extracted.major && shouldInclude(extracted.major.confidence)) {
    prefill.major = extracted.major.value as string;
  }

  if (extracted.currentDegree && shouldInclude(extracted.currentDegree.confidence)) {
    prefill.currentDegree = extracted.currentDegree.value as SignupStep2Data['currentDegree'];
  }

  return { ...prefill, _extracted: extracted };
}
