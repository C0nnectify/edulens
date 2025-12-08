// POST /api/resume/optimize - Get AI suggestions for resume optimization

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { resumeOptimizationSchema } from '@/lib/validations/resume';
import {
  authenticateRequest,
  errorResponse,
  successResponse,
  handleApiError,
  handleValidationError,
  checkRateLimit,
} from '@/lib/api-utils';
import { RESUME_OPTIMIZATION_PROMPT } from '@/lib/ai/resume-prompts';
import { Resume } from '@/types/resume';

interface OptimizationSuggestion {
  section: string;
  type: 'content' | 'keyword' | 'formatting' | 'structure';
  current: string;
  suggested: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
}

// Simulate AI optimization suggestions (replace with actual AI API)
async function generateOptimizations(
  resume: Resume,
  targetRole: string | undefined,
  industry: string | undefined,
  optimizeFor: string
): Promise<{
  suggestions: OptimizationSuggestion[];
  keywordSuggestions: string[];
  overallRecommendations: string[];
}> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  const suggestions: OptimizationSuggestion[] = [];
  const keywordSuggestions: string[] = [];
  const overallRecommendations: string[] = [];

  // Analyze and generate suggestions based on optimization focus
  if (optimizeFor === 'ats' || optimizeFor === 'keywords') {
    // ATS and Keyword Optimization
    keywordSuggestions.push(
      'Python', 'JavaScript', 'React', 'Node.js', 'AWS',
      'Docker', 'CI/CD', 'Agile', 'SQL', 'Git'
    );

    if (resume.summary) {
      suggestions.push({
        section: 'summary',
        type: 'keyword',
        current: resume.summary.substring(0, 50) + '...',
        suggested: `Results-driven ${targetRole || 'professional'} with expertise in modern technologies and proven track record...`,
        reason: 'Include target role and key technical skills in summary for better ATS matching',
        impact: 'high'
      });
    }

    overallRecommendations.push('Use standard section headings like "Experience", "Education", "Skills"');
    overallRecommendations.push('Avoid tables, graphics, and special characters that ATS cannot parse');
    overallRecommendations.push('Include both acronyms and full forms (e.g., "AI (Artificial Intelligence)")');
  }

  if (optimizeFor === 'impact' || optimizeFor === 'clarity') {
    // Impact and Clarity Optimization
    if (resume.experience?.length > 0) {
      const firstExp = resume.experience[0];
      if (firstExp.bullets && firstExp.bullets.length > 0) {
        const bullet = firstExp.bullets[0];
        suggestions.push({
          section: 'experience',
          type: 'content',
          current: bullet,
          suggested: `Increased team productivity by 40% through implementing automated testing framework, reducing deployment time from 2 hours to 30 minutes`,
          reason: 'Add quantifiable metrics and specific outcomes to demonstrate impact',
          impact: 'high'
        });
      }

      suggestions.push({
        section: 'experience',
        type: 'content',
        current: firstExp.description || 'No description',
        suggested: 'Led cross-functional team of 8 engineers to deliver $2M revenue-generating product feature ahead of schedule',
        reason: 'Start with strong action verb and include team size, budget, or revenue impact',
        impact: 'high'
      });
    }

    overallRecommendations.push('Start each bullet point with a strong action verb');
    overallRecommendations.push('Include metrics: percentages, dollar amounts, time saved, team size');
    overallRecommendations.push('Focus on achievements and outcomes rather than responsibilities');
  }

  // Skills section optimization
  if (resume.skills?.length > 0) {
    const skillNames = resume.skills.map(s => s.name);

    if (targetRole?.toLowerCase().includes('frontend') && !skillNames.some(s => s.toLowerCase().includes('react'))) {
      suggestions.push({
        section: 'skills',
        type: 'keyword',
        current: skillNames.slice(0, 3).join(', '),
        suggested: 'React, TypeScript, Next.js, ' + skillNames.slice(0, 3).join(', '),
        reason: `Add relevant frontend technologies for ${targetRole} position`,
        impact: 'high'
      });
    }

    if (!resume.skills.some(s => s.category)) {
      suggestions.push({
        section: 'skills',
        type: 'structure',
        current: 'Uncategorized skills list',
        suggested: 'Group skills by category: Technical Skills, Programming Languages, Tools & Technologies',
        reason: 'Organized skills are easier to scan and improve ATS parsing',
        impact: 'medium'
      });
    }
  }

  // Summary optimization
  if (!resume.summary) {
    suggestions.push({
      section: 'summary',
      type: 'structure',
      current: 'No professional summary',
      suggested: `Experienced ${targetRole || 'professional'} with [X] years of expertise in ${industry || 'technology'}. Proven track record of delivering high-impact solutions and leading cross-functional teams.`,
      reason: 'Add a compelling professional summary to capture recruiter attention',
      impact: 'high'
    });
  }

  // Education optimization
  if (resume.education?.length > 0) {
    const edu = resume.education[0];
    if (edu.gpa && typeof edu.gpa === 'string' && parseFloat(edu.gpa) < 3.5) {
      suggestions.push({
        section: 'education',
        type: 'content',
        current: `GPA: ${edu.gpa}`,
        suggested: 'Remove GPA (only include if 3.5 or higher)',
        reason: 'GPA below 3.5 may not add value to your application',
        impact: 'low'
      });
    }
  }

  // Format suggestions
  suggestions.push({
    section: 'formatting',
    type: 'formatting',
    current: 'Current format',
    suggested: 'Use consistent bullet point style and spacing throughout',
    reason: 'Consistent formatting improves readability and ATS parsing',
    impact: 'medium'
  });

  // Industry-specific recommendations
  if (industry) {
    overallRecommendations.push(`Tailor your resume to ${industry} industry standards and terminology`);
    overallRecommendations.push(`Research and include ${industry}-specific certifications if applicable`);
  }

  return {
    suggestions: suggestions.slice(0, 10),
    keywordSuggestions: keywordSuggestions.slice(0, 15),
    overallRecommendations: overallRecommendations.slice(0, 5)
  };
}

// POST: Generate optimization suggestions
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    // Rate limiting for AI endpoints
    if (!checkRateLimit(`ai_optimize_${authResult.user.id}`, 10, 60000)) {
      return errorResponse('Rate limit exceeded for AI optimization', 429);
    }

    // Parse and validate request
    const body = await req.json();
    const validation = resumeOptimizationSchema.safeParse(body);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const { resumeId, targetRole, industry, optimizeFor } = validation.data;

    // Connect to database
    await connectDB();

    // Fetch resume
    const resume = await ResumeModel.findOne({
      _id: resumeId,
      userId: authResult.user.id,
    }).lean() as Resume;

    if (!resume) {
      return errorResponse('Resume not found', 404);
    }

    // Generate optimization suggestions
    const optimizations = await generateOptimizations(
      resume,
      targetRole,
      industry,
      optimizeFor
    );

    // Calculate potential score improvement
    const currentScore = resume.aiScore?.overall || 65;
    const potentialScore = Math.min(currentScore + 15, 95);
    const scoreImprovement = potentialScore - currentScore;

    // Log optimization request
    console.log(`Generated ${optimizations.suggestions.length} optimizations for resume ${resumeId}`);

    return successResponse({
      resumeId,
      currentScore,
      potentialScore,
      scoreImprovement,
      ...optimizations,
      generatedAt: new Date(),
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