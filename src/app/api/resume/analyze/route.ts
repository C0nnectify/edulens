// POST /api/resume/analyze - Analyze resume content and provide scoring

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { resumeAnalysisSchema } from '@/lib/validations/resume';
import {
  authenticateRequest,
  errorResponse,
  successResponse,
  handleApiError,
  handleValidationError,
  checkRateLimit,
} from '@/lib/api-utils';
import { RESUME_ANALYSIS_PROMPT } from '@/lib/ai/resume-prompts';
import { Resume, AIScore } from '@/types/resume';

// Helper function to format resume for AI analysis
function formatResumeForAnalysis(resume: Resume): string {
  const sections = [];

  // Personal Information
  sections.push('PERSONAL INFORMATION:');
  sections.push(`Name: ${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`);
  sections.push(`Email: ${resume.personalInfo.email}`);
  if (resume.personalInfo.phone) sections.push(`Phone: ${resume.personalInfo.phone}`);
  if (resume.personalInfo.location) {
    const loc = resume.personalInfo.location;
    sections.push(`Location: ${[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}`);
  }
  if (resume.personalInfo.linkedin) sections.push(`LinkedIn: ${resume.personalInfo.linkedin}`);
  if (resume.personalInfo.github) sections.push(`GitHub: ${resume.personalInfo.github}`);

  // Summary
  if (resume.summary) {
    sections.push('\nPROFESSIONAL SUMMARY:');
    sections.push(resume.summary);
  }

  // Experience
  if (resume.experience?.length > 0) {
    sections.push('\nEXPERIENCE:');
    resume.experience.forEach(exp => {
      sections.push(`\n${exp.position} at ${exp.company}`);
      sections.push(`${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || 'Present'}`);
      if (exp.location) sections.push(`Location: ${exp.location}`);
      if (exp.description) sections.push(exp.description);
      if (exp.bullets?.length > 0) {
        exp.bullets.forEach(bullet => sections.push(`• ${bullet}`));
      }
    });
  }

  // Education
  if (resume.education?.length > 0) {
    sections.push('\nEDUCATION:');
    resume.education.forEach(edu => {
      sections.push(`\n${edu.degree} in ${edu.field || 'N/A'}`);
      sections.push(`${edu.institution}`);
      if (edu.gpa) sections.push(`GPA: ${edu.gpa}`);
      if (edu.honors?.length > 0) {
        sections.push(`Honors: ${edu.honors.join(', ')}`);
      }
    });
  }

  // Skills
  if (resume.skills?.length > 0) {
    sections.push('\nSKILLS:');
    const skillsByCategory = resume.skills.reduce((acc, skill) => {
      const category = skill.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(skill.name);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(skillsByCategory).forEach(([category, skills]) => {
      sections.push(`${category}: ${skills.join(', ')}`);
    });
  }

  // Projects
  if (resume.projects?.length > 0) {
    sections.push('\nPROJECTS:');
    resume.projects.forEach(project => {
      sections.push(`\n${project.name}`);
      sections.push(project.description);
      sections.push(`Technologies: ${project.technologies.join(', ')}`);
      if (project.url) sections.push(`URL: ${project.url}`);
    });
  }

  // Certifications
  if (resume.certifications?.length > 0) {
    sections.push('\nCERTIFICATIONS:');
    resume.certifications.forEach(cert => {
      sections.push(`${cert.name} - ${cert.issuer} (${cert.date})`);
    });
  }

  return sections.join('\n');
}

// Simulate AI analysis (replace with actual AI API call)
async function analyzeWithAI(resumeContent: string, analyzeFor: string): Promise<AIScore> {
  // This is a placeholder for AI analysis
  // In production, you would call your AI service (OpenAI, Claude, etc.)

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Calculate basic scores based on content length and completeness
  const hasPersonalInfo = resumeContent.includes('PERSONAL INFORMATION');
  const hasSummary = resumeContent.includes('PROFESSIONAL SUMMARY');
  const hasExperience = resumeContent.includes('EXPERIENCE');
  const hasEducation = resumeContent.includes('EDUCATION');
  const hasSkills = resumeContent.includes('SKILLS');

  // Simple scoring logic (replace with AI)
  const personalInfoScore = hasPersonalInfo ? 85 : 40;
  const summaryScore = hasSummary ? 75 : 30;
  const experienceScore = hasExperience ? 80 : 20;
  const educationScore = hasEducation ? 70 : 30;
  const skillsScore = hasSkills ? 75 : 25;

  // Check for keywords and formatting
  const hasQuantifiableMetrics = /\d+%|\$\d+|#\d+/.test(resumeContent);
  const hasActionVerbs = /managed|developed|implemented|achieved|increased|decreased/i.test(resumeContent);

  const keywordsScore = hasQuantifiableMetrics && hasActionVerbs ? 70 : 40;
  const formattingScore = 75; // Default formatting score
  const impactScore = hasQuantifiableMetrics ? 80 : 50;

  // Calculate overall score
  const weights = {
    personalInfo: 0.1,
    summary: 0.1,
    experience: 0.25,
    education: 0.15,
    skills: 0.15,
    formatting: 0.1,
    keywords: 0.1,
    impact: 0.05,
  };

  const overall = Math.round(
    personalInfoScore * weights.personalInfo +
    summaryScore * weights.summary +
    experienceScore * weights.experience +
    educationScore * weights.education +
    skillsScore * weights.skills +
    formattingScore * weights.formatting +
    keywordsScore * weights.keywords +
    impactScore * weights.impact
  );

  // Generate suggestions based on scores
  const suggestions = [];
  const strengths = [];
  const weaknesses = [];

  if (!hasSummary) {
    suggestions.push('Add a professional summary to highlight your key qualifications');
    weaknesses.push('Missing professional summary');
  } else {
    strengths.push('Includes professional summary');
  }

  if (!hasQuantifiableMetrics) {
    suggestions.push('Include quantifiable achievements (percentages, dollar amounts, etc.)');
    weaknesses.push('Lacks quantifiable metrics');
  } else {
    strengths.push('Contains quantifiable achievements');
  }

  if (!hasActionVerbs) {
    suggestions.push('Use strong action verbs to describe your accomplishments');
    weaknesses.push('Needs stronger action verbs');
  }

  if (hasExperience) {
    strengths.push('Comprehensive experience section');
  } else {
    weaknesses.push('Experience section needs development');
  }

  if (analyzeFor === 'ats') {
    suggestions.push('Ensure resume is in a simple format without tables or graphics for ATS compatibility');
    suggestions.push('Use standard section headings (Experience, Education, Skills)');
  }

  if (analyzeFor === 'keywords') {
    suggestions.push('Research job-specific keywords and incorporate them naturally');
    suggestions.push('Match the terminology used in your target job descriptions');
  }

  return {
    overall,
    sections: {
      personalInfo: personalInfoScore,
      summary: summaryScore,
      experience: experienceScore,
      education: educationScore,
      skills: skillsScore,
      formatting: formattingScore,
      keywords: keywordsScore,
      impact: impactScore,
    },
    atsCompatibility: Math.round((formattingScore + keywordsScore) / 2),
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    suggestions: suggestions.slice(0, 10),
  };
}

// POST: Analyze resume
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    // Rate limiting (stricter for AI endpoints)
    if (!checkRateLimit(`ai_${authResult.user.id}`, 10, 60000)) {
      return errorResponse('Rate limit exceeded for AI analysis', 429);
    }

    // Parse and validate request
    const body = await req.json();
    const validation = resumeAnalysisSchema.safeParse(body);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const { resumeId, analyzeFor } = validation.data;

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

    // Check if recently analyzed (cache for 24 hours)
    if (resume.lastAnalyzedAt && resume.aiScore) {
      const hoursSinceAnalysis = (Date.now() - new Date(resume.lastAnalyzedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceAnalysis < 24) {
        console.log(`Returning cached analysis for resume ${resumeId}`);
        return successResponse({
          ...resume.aiScore,
          cached: true,
          analyzedAt: resume.lastAnalyzedAt,
        });
      }
    }

    // Format resume for analysis
    const resumeContent = formatResumeForAnalysis(resume);

    // Perform AI analysis
    const analysisResult = await analyzeWithAI(resumeContent, analyzeFor);

    // Save analysis results to database
    await ResumeModel.findByIdAndUpdate(resumeId, {
      aiScore: analysisResult,
      lastAnalyzedAt: new Date(),
    });

    // Log analysis
    console.log(`AI analysis completed for resume ${resumeId}, score: ${analysisResult.overall}`);

    return successResponse({
      ...analysisResult,
      cached: false,
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