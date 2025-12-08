/**
 * Job Scraper using Firecrawl MCP
 * Scrapes job postings from various job boards for students
 */

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'internship' | 'contract';
  description: string;
  requirements: string[];
  salary?: string;
  url: string;
  postedDate: Date;
  matchScore?: number;
  source: string;
}

export interface JobSearchParams {
  keywords: string[];
  location?: string;
  type?: string[];
  experienceLevel?: 'entry' | 'mid' | 'senior';
}

/**
 * Scrape jobs from multiple job boards
 */
export async function scrapeJobs(params: JobSearchParams): Promise<JobPosting[]> {
  const jobBoards = [
    `https://www.linkedin.com/jobs/search/?keywords=${params.keywords.join(' ')}&location=${params.location || ''}`,
    `https://www.indeed.com/jobs?q=${params.keywords.join('+')}&l=${params.location || ''}`,
    `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${params.keywords.join(' ')}`,
  ];

  const jobs: JobPosting[] = [];

  for (const url of jobBoards) {
    try {
      // Using Firecrawl MCP to scrape job listings
      const response = await fetch('/api/job/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, params }),
      });

      if (response.ok) {
        const scrapedJobs = await response.json();
        jobs.push(...scrapedJobs);
      }
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
    }
  }

  return jobs;
}

/**
 * Match resume with job posting using AI
 */
export async function matchResumeToJob(
  resume: any,
  job: JobPosting
): Promise<number> {
  try {
    const response = await fetch('/api/job/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, job }),
    });

    if (response.ok) {
      const { matchScore } = await response.json();
      return matchScore;
    }
  } catch (error) {
    console.error('Failed to match resume:', error);
  }

  return 0;
}

/**
 * Generate tailored resume for specific job
 */
export async function tailorResumeForJob(
  resume: any,
  job: JobPosting
): Promise<any> {
  try {
    const response = await fetch('/api/job/tailor-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, job }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to tailor resume:', error);
  }

  return resume;
}

/**
 * Generate cover letter for job application
 */
export async function generateCoverLetter(
  resume: any,
  job: JobPosting
): Promise<string> {
  try {
    const response = await fetch('/api/job/cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, job }),
    });

    if (response.ok) {
      const { coverLetter } = await response.json();
      return coverLetter;
    }
  } catch (error) {
    console.error('Failed to generate cover letter:', error);
  }

  return '';
}
