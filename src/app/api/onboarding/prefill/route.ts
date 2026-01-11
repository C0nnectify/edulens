/**
 * Onboarding Prefill API
 * 
 * Extracts onboarding data from dream chat messages to pre-fill signup Step 2
 * POST: Extract and return prefill data from dream session (client-side extraction)
 */

import { NextResponse } from 'next/server';
import type { SignupStep2Data } from '@/types/roadmap';

// Types for extraction
interface ExtractedField {
  field: string;
  value: string | string[] | number;
  confidence: 'high' | 'medium' | 'low';
  source: 'dream_chat';
  sourceText?: string;
}

interface ExtractedOnboardingData {
  dreamCountries?: ExtractedField;
  preferredProgramType?: ExtractedField;
  budget?: ExtractedField;
  targetIntake?: ExtractedField;
  major?: ExtractedField;
  currentDegree?: ExtractedField;
}

interface PrefillResponse {
  success: boolean;
  prefill: Partial<SignupStep2Data>;
  extracted: ExtractedOnboardingData;
  fieldsExtracted: string[];
  confidence: {
    high: string[];
    medium: string[];
    low: string[];
  };
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
  'masters': ["master's", 'masters', 'ms', 'msc', 'ma', 'graduate degree', 'grad school'],
  'phd': ['phd', 'ph.d', 'doctorate', 'doctoral', 'research degree'],
  'mba': ['mba', 'business administration'],
};

// Budget patterns
const BUDGET_PATTERNS = [
  { pattern: /(?:under|below|less than)\s*\$?\s*20[,.]?000|budget.*(?:tight|limited|low)/i, value: 'under_20k' },
  { pattern: /\$?\s*20[,.]?000\s*(?:to|-)\s*40[,.]?000|moderate budget/i, value: '20k_40k' },
  { pattern: /\$?\s*40[,.]?000\s*(?:to|-)\s*60[,.]?000/i, value: '40k_60k' },
  { pattern: /\$?\s*60[,.]?000\s*(?:to|-)\s*80[,.]?000/i, value: '60k_80k' },
  { pattern: /(?:above|over|more than)\s*\$?\s*80[,.]?000|money.*(?:not|isn't).*(?:issue|problem)|unlimited/i, value: 'above_80k' },
  { pattern: /flexible|open budget|depends on school/i, value: 'flexible' },
  { pattern: /scholarship|funded|assistantship|need funding|financial aid/i, value: 'under_20k' },
];

// Semester patterns
const SEMESTER_PATTERNS = [
  { pattern: /fall\s*(?:20)?2[0-9]/i, semester: 'fall' as const },
  { pattern: /spring\s*(?:20)?2[0-9]/i, semester: 'spring' as const },
  { pattern: /summer\s*(?:20)?2[0-9]/i, semester: 'summer' as const },
  { pattern: /next fall|coming fall|this fall/i, semester: 'fall' as const },
  { pattern: /next spring|coming spring/i, semester: 'spring' as const },
];

// Year patterns
const YEAR_PATTERN = /(?:fall|spring|summer|intake|start|begin|enroll).*?(202[4-9]|203[0-9])|(?:202[4-9]|203[0-9]).*?(?:fall|spring|summer|intake)/i;

// Major/Field patterns
const FIELD_PATTERNS = [
  'computer science', 'software engineering', 'data science', 'machine learning', 'artificial intelligence',
  'electrical engineering', 'mechanical engineering', 'civil engineering', 'chemical engineering',
  'business', 'finance', 'marketing', 'management', 'economics',
  'biology', 'biotechnology', 'chemistry', 'physics', 'mathematics',
  'psychology', 'sociology', 'political science', 'international relations',
  'law', 'medicine', 'public health', 'nursing',
  'design', 'architecture', 'arts', 'film', 'music',
];

interface DreamMessage {
  role: 'user' | 'ai';
  content: string;
}

function extractFromMessages(messages: DreamMessage[]): ExtractedOnboardingData {
  const extracted: ExtractedOnboardingData = {};
  
  // Combine all user messages for analysis
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');
  
  const allMessages = messages
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
      value: foundCountries.slice(0, 3),
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
      value: 'bachelors',
      confidence: 'low',
      source: 'dream_chat',
    };
  }

  return extracted;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body as { messages?: DreamMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No messages provided',
        prefill: {},
        extracted: {},
        fieldsExtracted: [],
        confidence: { high: [], medium: [], low: [] },
      });
    }

    // Extract data from messages
    const extracted = extractFromMessages(messages);
    
    // Build prefill object
    const prefill: Partial<SignupStep2Data> = {};
    const confidence: { high: string[]; medium: string[]; low: string[] } = {
      high: [],
      medium: [],
      low: [],
    };
    const fieldsExtracted: string[] = [];

    for (const [key, data] of Object.entries(extracted)) {
      if (!data) continue;
      
      fieldsExtracted.push(key);
      const confidenceLevel = data.confidence as 'high' | 'medium' | 'low';
      confidence[confidenceLevel].push(key);

      // Only auto-fill high and medium confidence values
      if (data.confidence === 'high' || data.confidence === 'medium') {
        switch (key) {
          case 'dreamCountries':
            prefill.dreamCountries = data.value as string[];
            break;
          case 'preferredProgramType':
            prefill.preferredProgramType = data.value as SignupStep2Data['preferredProgramType'];
            break;
          case 'budget':
            prefill.budget = data.value as SignupStep2Data['budget'];
            break;
          case 'targetIntake':
            try {
              const intake = JSON.parse(data.value as string);
              prefill.targetIntake = intake;
            } catch {
              // Ignore parse errors
            }
            break;
          case 'major':
            prefill.major = data.value as string;
            break;
          case 'currentDegree':
            prefill.currentDegree = data.value as SignupStep2Data['currentDegree'];
            break;
        }
      }
    }

    const response: PrefillResponse = {
      success: true,
      prefill,
      extracted,
      fieldsExtracted,
      confidence,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Prefill extraction error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to extract prefill data',
        prefill: {},
        extracted: {},
        fieldsExtracted: [],
        confidence: { high: [], medium: [], low: [] },
      },
      { status: 500 }
    );
  }
}
