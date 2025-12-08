// POST /api/job/extract-keywords - Extract keywords from job description text

import { NextRequest, NextResponse } from 'next/server';
import { jobDescriptionSchema } from '@/lib/validations/resume';
import {
  authenticateRequest,
  errorResponse,
  successResponse,
  handleApiError,
  handleValidationError,
  checkRateLimit,
} from '@/lib/api-utils';

interface KeywordResult {
  word: string;
  score: number;
  category: string;
  frequency: number;
}

// Categorize keywords based on common patterns
function categorizeKeyword(keyword: string): string {
  const techKeywords = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'sql',
    'mongodb', 'aws', 'docker', 'kubernetes', 'api', 'git', 'html', 'css',
    'typescript', 'golang', 'rust', 'c++', 'php', 'ruby', 'swift', 'kotlin'
  ];

  const softSkills = [
    'communication', 'teamwork', 'leadership', 'problem-solving', 'analytical',
    'creative', 'organized', 'detail-oriented', 'self-motivated', 'collaborative',
    'adaptable', 'innovative', 'strategic', 'critical thinking'
  ];

  const actionWords = [
    'develop', 'design', 'implement', 'manage', 'lead', 'coordinate', 'analyze',
    'optimize', 'deliver', 'build', 'create', 'maintain', 'support', 'test',
    'deploy', 'configure', 'troubleshoot', 'document', 'review'
  ];

  const qualifications = [
    'degree', 'bachelor', 'master', 'phd', 'certification', 'years', 'experience',
    'expert', 'senior', 'junior', 'mid-level', 'entry-level', 'professional'
  ];

  const keywordLower = keyword.toLowerCase();

  if (techKeywords.some(tech => keywordLower.includes(tech))) {
    return 'technical';
  } else if (softSkills.some(skill => keywordLower.includes(skill))) {
    return 'soft-skill';
  } else if (actionWords.some(action => keywordLower.includes(action))) {
    return 'action';
  } else if (qualifications.some(qual => keywordLower.includes(qual))) {
    return 'qualification';
  } else {
    return 'general';
  }
}

// Advanced keyword extraction with scoring
function extractKeywordsWithScoring(text: string, extractTop: number = 20): KeywordResult[] {
  // Preprocessing
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');

  // Stop words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'we', 'they', 'it', 'its', 'our', 'your'
  ]);

  // Extract words
  const words = cleanText.split(/\s+/).filter(word =>
    word.length > 2 && !stopWords.has(word)
  );

  // Calculate word frequency
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Extract n-grams (2-grams and 3-grams for phrases)
  const nGrams: Record<string, number> = {};

  for (let i = 0; i < words.length - 1; i++) {
    // 2-grams
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
      nGrams[bigram] = (nGrams[bigram] || 0) + 1;
    }

    // 3-grams
    if (i < words.length - 2) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (!stopWords.has(words[i]) && !stopWords.has(words[i + 2])) {
        nGrams[trigram] = (nGrams[trigram] || 0) + 1;
      }
    }
  }

  // Combine single words and n-grams
  const allTerms = { ...wordFreq };
  Object.entries(nGrams).forEach(([ngram, freq]) => {
    if (freq > 1) { // Only include n-grams that appear more than once
      allTerms[ngram] = freq * 1.5; // Boost n-gram scores
    }
  });

  // Calculate TF-IDF-like scores
  const maxFreq = Math.max(...Object.values(allTerms));
  const keywords: KeywordResult[] = [];

  Object.entries(allTerms).forEach(([term, freq]) => {
    // Calculate base score (normalized frequency)
    let score = (freq / maxFreq) * 100;

    // Boost score based on position (earlier = more important)
    const firstPosition = cleanText.indexOf(term);
    const positionBoost = 1 + (1 - firstPosition / cleanText.length) * 0.3;
    score *= positionBoost;

    // Boost technical terms and important keywords
    const category = categorizeKeyword(term);
    if (category === 'technical') {
      score *= 1.5;
    } else if (category === 'qualification') {
      score *= 1.3;
    }

    // Check if term appears in important sections
    const inRequirements = /requirement|required|must have/i.test(
      text.substring(Math.max(0, text.indexOf(term) - 50), text.indexOf(term) + 50)
    );
    if (inRequirements) {
      score *= 1.4;
    }

    keywords.push({
      word: term,
      score: Math.round(score * 10) / 10,
      category,
      frequency: freq
    });
  });

  // Sort by score and return top keywords
  return keywords
    .sort((a, b) => b.score - a.score)
    .slice(0, extractTop);
}

// Identify must-have vs nice-to-have keywords
function classifyRequirements(text: string, keywords: KeywordResult[]): {
  mustHave: string[];
  niceToHave: string[];
  preferred: string[];
} {
  const mustHavePatterns = [
    /must have|required|essential|mandatory|minimum/i,
    /\d+\+?\s*years?\s*(?:of\s+)?(.+?)(?:\.|,|;|$)/i
  ];

  const niceToHavePatterns = [
    /nice to have|preferred|bonus|plus|desirable|ideal/i,
    /experience with (.+?) (?:is )?a plus/i
  ];

  const mustHave: Set<string> = new Set();
  const niceToHave: Set<string> = new Set();
  const preferred: Set<string> = new Set();

  // Split text into sentences/lines for analysis
  const segments = text.split(/[.\n]/);

  segments.forEach(segment => {
    const segmentLower = segment.toLowerCase();

    // Check if segment contains must-have patterns
    const isMustHave = mustHavePatterns.some(pattern => pattern.test(segment));
    const isNiceToHave = niceToHavePatterns.some(pattern => pattern.test(segment));

    // Find keywords in this segment
    keywords.forEach(keyword => {
      if (segmentLower.includes(keyword.word.toLowerCase())) {
        if (isMustHave) {
          mustHave.add(keyword.word);
        } else if (isNiceToHave) {
          niceToHave.add(keyword.word);
        } else if (keyword.score > 50) {
          // High-scoring keywords not explicitly marked are likely preferred
          preferred.add(keyword.word);
        }
      }
    });
  });

  return {
    mustHave: Array.from(mustHave),
    niceToHave: Array.from(niceToHave),
    preferred: Array.from(preferred).filter(k => !mustHave.has(k) && !niceToHave.has(k))
  };
}

// POST: Extract keywords from job description
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    // Rate limiting
    if (!checkRateLimit(`keyword_extract_${authResult.user.id}`, 30, 60000)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    // Parse and validate request
    const body = await req.json();
    const validation = jobDescriptionSchema.safeParse(body);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const { description, extractTop } = validation.data;

    // Extract keywords with scoring
    const keywords = extractKeywordsWithScoring(description, extractTop);

    // Classify requirements
    const requirements = classifyRequirements(description, keywords);

    // Group keywords by category
    const keywordsByCategory: Record<string, KeywordResult[]> = {};
    keywords.forEach(keyword => {
      if (!keywordsByCategory[keyword.category]) {
        keywordsByCategory[keyword.category] = [];
      }
      keywordsByCategory[keyword.category].push(keyword);
    });

    // Extract top keywords by category
    const topTechnical = keywordsByCategory.technical?.slice(0, 10).map(k => k.word) || [];
    const topSoftSkills = keywordsByCategory['soft-skill']?.slice(0, 5).map(k => k.word) || [];
    const topQualifications = keywordsByCategory.qualification?.slice(0, 5).map(k => k.word) || [];

    // Determine seniority level based on keywords
    const seniorityIndicators = [];
    if (/senior|sr\.|lead|principal|staff/i.test(description)) {
      seniorityIndicators.push('Senior Level');
    }
    if (/junior|jr\.|entry|graduate|intern/i.test(description)) {
      seniorityIndicators.push('Entry Level');
    }
    if (/mid-?level|intermediate|\d-\d\s*years/i.test(description)) {
      seniorityIndicators.push('Mid Level');
    }
    if (/manager|director|head|vp|vice president/i.test(description)) {
      seniorityIndicators.push('Management Level');
    }

    // Identify culture keywords
    const cultureKeywords = [];
    const culturePatterns = [
      'fast-paced', 'collaborative', 'innovative', 'startup', 'agile',
      'remote', 'flexible', 'work-life balance', 'diversity', 'inclusive',
      'growth', 'learning', 'mentorship', 'autonomous', 'ownership'
    ];

    culturePatterns.forEach(pattern => {
      if (new RegExp(pattern, 'i').test(description)) {
        cultureKeywords.push(pattern);
      }
    });

    // Log extraction
    console.log(`Extracted ${keywords.length} keywords from job description`);

    return successResponse({
      keywords,
      topKeywords: keywords.slice(0, 10).map(k => k.word),
      keywordsByCategory: {
        technical: topTechnical,
        softSkills: topSoftSkills,
        qualifications: topQualifications,
        action: keywordsByCategory.action?.slice(0, 10).map(k => k.word) || []
      },
      requirements: {
        mustHave: requirements.mustHave.slice(0, 10),
        niceToHave: requirements.niceToHave.slice(0, 10),
        preferred: requirements.preferred.slice(0, 10)
      },
      seniorityIndicators,
      cultureKeywords,
      analysis: {
        totalKeywords: keywords.length,
        avgScore: Math.round(keywords.reduce((sum, k) => sum + k.score, 0) / keywords.length * 10) / 10,
        topCategory: Object.entries(keywordsByCategory)
          .sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'general'
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS: Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}