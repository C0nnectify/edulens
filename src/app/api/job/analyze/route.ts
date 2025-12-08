// POST /api/job/analyze - Analyze job posting URL (with Firecrawl MCP integration)

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { JobPostingModel } from '@/lib/db/models/JobPosting';
import { jobAnalysisSchema } from '@/lib/validations/resume';
import {
  authenticateRequest,
  errorResponse,
  successResponse,
  handleApiError,
  handleValidationError,
  checkRateLimit,
} from '@/lib/api-utils';
import { JobPosting } from '@/types/resume';
import { KEYWORD_EXTRACTION_PROMPT } from '@/lib/ai/resume-prompts';

// Extract structured data from scraped content
function parseJobContent(content: string): {
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
} {
  // Extract title (usually in first few lines or after "Position:" or "Title:")
  const titleMatch = content.match(/(?:position|title|role):\s*(.+)/i) ||
                     content.match(/^(.+?)(?:\n|$)/);
  const title = titleMatch ? titleMatch[1].trim() : 'Unknown Position';

  // Extract company
  const companyMatch = content.match(/(?:company|employer|organization):\s*(.+)/i) ||
                       content.match(/at\s+(.+?)(?:\.|,|\n|$)/i);
  const company = companyMatch ? companyMatch[1].trim() : 'Unknown Company';

  // Extract location
  const locationMatch = content.match(/(?:location|based in|office):\s*(.+)/i);
  const location = locationMatch ? locationMatch[1].trim() : undefined;

  // Extract sections
  const requirements: string[] = [];
  const responsibilities: string[] = [];
  const qualifications: string[] = [];

  // Split content into lines for processing
  const lines = content.split('\n');
  let currentSection = 'description';
  let description = '';

  for (const line of lines) {
    const lineLower = line.toLowerCase();

    // Detect section changes
    if (lineLower.includes('requirement') || lineLower.includes('required')) {
      currentSection = 'requirements';
      continue;
    } else if (lineLower.includes('responsibilit')) {
      currentSection = 'responsibilities';
      continue;
    } else if (lineLower.includes('qualification')) {
      currentSection = 'qualifications';
      continue;
    }

    // Process bullet points and content
    const bulletMatch = line.match(/^[\s]*[•·\-*]\s*(.+)/);
    const content = bulletMatch ? bulletMatch[1] : line;

    if (content.trim()) {
      switch (currentSection) {
        case 'requirements':
          requirements.push(content.trim());
          break;
        case 'responsibilities':
          responsibilities.push(content.trim());
          break;
        case 'qualifications':
          qualifications.push(content.trim());
          break;
        default:
          description += content + ' ';
      }
    }
  }

  return {
    title,
    company,
    location,
    description: description.trim() || content.substring(0, 500),
    requirements,
    responsibilities,
    qualifications
  };
}

// Extract keywords using NLP-like techniques
function extractKeywords(text: string, extractTop: number = 20): Array<{ word: string; score: number }> {
  // Common stop words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'could', 'need', 'needs'
  ]);

  // Technical keywords to prioritize
  const technicalTerms = new Set([
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'nodejs',
    'typescript', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'git', 'agile',
    'scrum', 'api', 'rest', 'graphql', 'microservices', 'cloud', 'devops',
    'machine learning', 'ai', 'data science', 'analytics', 'frontend', 'backend',
    'fullstack', 'mobile', 'ios', 'android', 'testing', 'security'
  ]);

  // Clean and tokenize text
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Count frequency and calculate scores
  const frequency: Record<string, number> = {};
  const positions: Record<string, number[]> = {};

  words.forEach((word, index) => {
    frequency[word] = (frequency[word] || 0) + 1;
    if (!positions[word]) positions[word] = [];
    positions[word].push(index);
  });

  // Calculate keyword scores
  const keywordScores: Array<{ word: string; score: number }> = [];

  Object.entries(frequency).forEach(([word, count]) => {
    let score = count;

    // Boost score for technical terms
    if (technicalTerms.has(word)) {
      score *= 2;
    }

    // Boost score for capitalized words (likely proper nouns/technologies)
    if (text.includes(word.charAt(0).toUpperCase() + word.slice(1))) {
      score *= 1.5;
    }

    // Consider position (earlier mentions might be more important)
    const avgPosition = positions[word].reduce((a, b) => a + b, 0) / positions[word].length;
    const positionBoost = 1 + (1 - avgPosition / words.length) * 0.5;
    score *= positionBoost;

    keywordScores.push({ word, score: Math.round(score * 10) / 10 });
  });

  // Sort by score and return top keywords
  return keywordScores
    .sort((a, b) => b.score - a.score)
    .slice(0, extractTop);
}

// Extract skills from job content
function extractSkills(content: string): string[] {
  const skills = new Set<string>();

  // Common skill patterns
  const skillPatterns = [
    /(?:experience with|proficient in|knowledge of|familiar with|expertise in)\s+([^,.]+)/gi,
    /(?:skills?:)\s*([^.]+)/gi,
    /\b(\w+(?:\.\w+)?)\s+(?:development|programming|experience)/gi,
  ];

  skillPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const skillText = match[1].trim().toLowerCase();
      // Split by common separators
      const individualSkills = skillText.split(/[,;]|\s+and\s+|\s+or\s+/);
      individualSkills.forEach(skill => {
        const cleaned = skill.trim().replace(/[^\w\s+#.-]/g, '');
        if (cleaned.length > 1 && cleaned.length < 30) {
          skills.add(cleaned);
        }
      });
    }
  });

  // Also extract from requirements and qualifications sections
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.includes('year') && line.match(/\d+/)) {
      // Extract experience requirements like "3+ years of Python"
      const expMatch = line.match(/\d+\+?\s*years?\s*(?:of\s+)?([^,.\n]+)/i);
      if (expMatch) {
        skills.add(expMatch[1].trim().toLowerCase());
      }
    }
  });

  return Array.from(skills).slice(0, 30);
}

// Simulate Firecrawl MCP integration
async function scrapeWithFirecrawl(url: string): Promise<string> {
  // In production, you would integrate with Firecrawl MCP here
  // Example integration point:
  /*
  try {
    const firecrawlResponse = await fetch('http://localhost:3000/mcp/firecrawl/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, mode: 'markdown' })
    });
    const data = await firecrawlResponse.json();
    return data.content;
  } catch (error) {
    console.error('Firecrawl error:', error);
    throw new Error('Failed to scrape job posting');
  }
  */

  // For demonstration, return sample content
  await new Promise(resolve => setTimeout(resolve, 1000));

  return `
Senior Software Engineer
Company: TechCorp Inc.
Location: San Francisco, CA

We are seeking an experienced Senior Software Engineer to join our growing team.

Responsibilities:
• Design and implement scalable web applications using React and Node.js
• Collaborate with cross-functional teams to deliver high-quality products
• Mentor junior developers and conduct code reviews
• Optimize application performance and ensure security best practices

Requirements:
• 5+ years of experience in software development
• Strong proficiency in JavaScript, TypeScript, and React
• Experience with Node.js and RESTful API development
• Familiarity with cloud platforms (AWS, Azure, or GCP)
• Knowledge of database systems (PostgreSQL, MongoDB)
• Experience with Docker and Kubernetes
• Strong problem-solving and communication skills

Qualifications:
• Bachelor's degree in Computer Science or related field
• Experience with Agile/Scrum methodologies
• Understanding of CI/CD pipelines
• Contribution to open-source projects is a plus

Benefits:
• Competitive salary and equity
• Health, dental, and vision insurance
• Flexible work arrangements
• Professional development opportunities
`;
}

// POST: Analyze job posting
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    // Rate limiting
    if (!checkRateLimit(`job_analyze_${authResult.user.id}`, 15, 60000)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    // Parse and validate request
    const body = await req.json();
    const validation = jobAnalysisSchema.safeParse(body);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const { url, extractKeywords: shouldExtractKeywords } = validation.data;

    // Connect to database
    await connectDB();

    // Check if URL was already analyzed recently
    const existingJob = await JobPostingModel.findOne({
      url,
      scrapedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
    }).lean();

    if (existingJob) {
      console.log(`Returning cached job analysis for ${url}`);
      return successResponse({
        ...existingJob,
        cached: true
      });
    }

    // Scrape job posting content
    let scrapedContent: string;
    try {
      scrapedContent = await scrapeWithFirecrawl(url);
    } catch (error) {
      return errorResponse('Failed to scrape job posting. Please check the URL and try again.', 400);
    }

    // Parse job content
    const parsedJob = parseJobContent(scrapedContent);

    // Extract keywords if requested
    let keywords: Array<{ word: string; score: number }> = [];
    if (shouldExtractKeywords) {
      keywords = extractKeywords(scrapedContent, 30);
    }

    // Extract skills
    const skills = extractSkills(scrapedContent);

    // Determine experience level and employment type
    const experienceLevel = scrapedContent.match(/senior/i) ? 'Senior' :
                           scrapedContent.match(/junior/i) ? 'Junior' :
                           scrapedContent.match(/mid-?level/i) ? 'Mid-level' :
                           scrapedContent.match(/entry/i) ? 'Entry-level' : 'Not specified';

    const employmentType = scrapedContent.match(/full-?time/i) ? 'full-time' :
                          scrapedContent.match(/part-?time/i) ? 'part-time' :
                          scrapedContent.match(/contract/i) ? 'contract' :
                          scrapedContent.match(/intern/i) ? 'internship' : undefined;

    // Create job posting object
    const jobPosting: JobPosting = {
      url,
      ...parsedJob,
      skills,
      keywords,
      experienceLevel,
      employmentType,
      scrapedAt: new Date()
    };

    // Save to database
    const savedJob = await JobPostingModel.create(jobPosting);

    console.log(`Analyzed job posting from ${url}: ${parsedJob.title} at ${parsedJob.company}`);

    return successResponse({
      id: savedJob._id.toString(),
      ...jobPosting,
      cached: false
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