// POST /api/resume/match-job - Match resume against job description

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { JobPostingModel } from '@/lib/db/models/JobPosting';
import { jobMatchSchema } from '@/lib/validations/resume';
import {
  authenticateRequest,
  errorResponse,
  successResponse,
  handleApiError,
  handleValidationError,
  checkRateLimit,
} from '@/lib/api-utils';
import { Resume, JobMatchResult } from '@/types/resume';

// Calculate similarity between two strings using basic algorithm
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;

  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

// Extract keywords from text
function extractKeywords(text: string): string[] {
  // Simple keyword extraction - in production, use NLP library
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were']);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Count frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

// Match resume against job description
async function matchResumeToJob(
  resume: Resume,
  jobDescription: string
): Promise<JobMatchResult> {
  // Extract keywords from job description
  const jobKeywords = extractKeywords(jobDescription);

  // Extract resume content for matching
  const resumeSkills = resume.skills?.map(s => s.name.toLowerCase()) || [];
  const resumeKeywords: string[] = [];

  // Extract keywords from resume sections
  if (resume.summary) {
    resumeKeywords.push(...extractKeywords(resume.summary));
  }

  resume.experience?.forEach(exp => {
    if (exp.description) {
      resumeKeywords.push(...extractKeywords(exp.description));
    }
    exp.bullets?.forEach(bullet => {
      resumeKeywords.push(...extractKeywords(bullet));
    });
    if (exp.position) {
      resumeKeywords.push(...extractKeywords(exp.position));
    }
  });

  resume.projects?.forEach(proj => {
    resumeKeywords.push(...extractKeywords(proj.description));
    resumeKeywords.push(...proj.technologies.map(t => t.toLowerCase()));
  });

  // Calculate matches
  const matchedKeywords = jobKeywords.filter(keyword =>
    resumeKeywords.includes(keyword) || resumeSkills.includes(keyword)
  );

  const missingKeywords = jobKeywords.filter(keyword =>
    !matchedKeywords.includes(keyword)
  );

  // Extract skills from job description
  const commonTechSkills = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'git', 'agile', 'typescript', 'mongodb', 'postgresql', 'redis'];

  const jobSkills = jobKeywords.filter(keyword =>
    commonTechSkills.some(skill => keyword.includes(skill))
  );

  const matchedSkills = resumeSkills.filter(skill =>
    jobSkills.some(jobSkill => skill.toLowerCase().includes(jobSkill))
  );

  const missingSkills = jobSkills.filter(skill =>
    !matchedSkills.some(resumeSkill => resumeSkill.toLowerCase().includes(skill))
  );

  // Calculate match scores
  const keywordMatchScore = jobKeywords.length > 0
    ? (matchedKeywords.length / jobKeywords.length) * 100
    : 0;

  const skillMatchScore = jobSkills.length > 0
    ? (matchedSkills.length / jobSkills.length) * 100
    : 0;

  // Calculate experience relevance
  let experienceScore = 50; // Default score
  if (resume.experience?.length > 0) {
    const relevantExp = resume.experience.filter(exp => {
      const expText = `${exp.position} ${exp.description || ''} ${exp.bullets?.join(' ') || ''}`.toLowerCase();
      return jobKeywords.some(keyword => expText.includes(keyword));
    });
    experienceScore = (relevantExp.length / resume.experience.length) * 100;
  }

  // Calculate education relevance
  let educationScore = 50; // Default score
  const requiresDegree = /bachelor|master|phd|degree/i.test(jobDescription);
  if (requiresDegree && resume.education?.length > 0) {
    educationScore = 100;
  } else if (requiresDegree && !resume.education?.length) {
    educationScore = 0;
  }

  // Overall match score (weighted average)
  const overallScore = Math.round(
    keywordMatchScore * 0.3 +
    skillMatchScore * 0.35 +
    experienceScore * 0.25 +
    educationScore * 0.1
  );

  // Generate recommendations
  const recommendations: JobMatchResult['recommendations'] = [];

  if (missingSkills.length > 0) {
    recommendations.push({
      category: 'skills',
      suggestion: `Add these missing skills to your resume if you have them: ${missingSkills.slice(0, 5).join(', ')}`,
      priority: 'high'
    });
  }

  if (missingKeywords.length > 3) {
    recommendations.push({
      category: 'keywords',
      suggestion: `Incorporate these keywords naturally in your resume: ${missingKeywords.slice(0, 5).join(', ')}`,
      priority: 'high'
    });
  }

  if (!resume.summary) {
    recommendations.push({
      category: 'summary',
      suggestion: 'Add a professional summary that highlights your fit for this specific role',
      priority: 'medium'
    });
  }

  if (experienceScore < 50) {
    recommendations.push({
      category: 'experience',
      suggestion: 'Emphasize experiences that align with the job requirements',
      priority: 'high'
    });
  }

  // Add more specific recommendations
  if (jobDescription.toLowerCase().includes('team') && !resumeKeywords.includes('team')) {
    recommendations.push({
      category: 'experience',
      suggestion: 'Highlight your teamwork and collaboration experiences',
      priority: 'medium'
    });
  }

  if (jobDescription.toLowerCase().includes('lead') && !resumeKeywords.includes('lead')) {
    recommendations.push({
      category: 'experience',
      suggestion: 'Emphasize any leadership roles or initiatives you\'ve taken',
      priority: 'medium'
    });
  }

  return {
    matchScore: overallScore,
    matchedSkills,
    missingSkills,
    matchedKeywords,
    missingKeywords,
    recommendations,
    sectionScores: {
      skills: Math.round(skillMatchScore),
      experience: Math.round(experienceScore),
      education: Math.round(educationScore),
      overall: overallScore
    }
  };
}

// POST: Match resume to job
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    // Rate limiting
    if (!checkRateLimit(`job_match_${authResult.user.id}`, 20, 60000)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    // Parse and validate request
    const body = await req.json();
    const validation = jobMatchSchema.safeParse(body);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const { resumeId, jobDescription, jobUrl, jobPostingId } = validation.data;

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

    let jobDescriptionText = jobDescription;

    // If jobPostingId provided, fetch from database
    if (jobPostingId) {
      const jobPosting = await JobPostingModel.findById(jobPostingId).lean();
      if (jobPosting) {
        jobDescriptionText = `${jobPosting.title} at ${jobPosting.company}. ${jobPosting.description}. Requirements: ${jobPosting.requirements.join('. ')}`;
      }
    }

    // If jobUrl provided but no description, you would scrape it here
    // For now, we'll require jobDescription to be provided
    if (!jobDescriptionText) {
      return errorResponse('Job description is required', 400);
    }

    // Perform matching analysis
    const matchResult = await matchResumeToJob(resume, jobDescriptionText);

    // Log match analysis
    console.log(`Job match analysis for resume ${resumeId}: ${matchResult.matchScore}% match`);

    return successResponse({
      ...matchResult,
      resumeId,
      analyzedAt: new Date(),
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