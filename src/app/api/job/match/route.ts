import { NextRequest, NextResponse } from 'next/server';

/**
 * AI-powered resume-job matching API
 */
export async function POST(request: NextRequest) {
  try {
    const { resume, job } = await request.json();

    // Simple matching algorithm based on skills and experience
    let matchScore = 0;
    const maxScore = 100;

    // Check skills match (40 points)
    const resumeSkills = resume.skills?.map((s: any) =>
      typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase()
    ) || [];
    const jobRequirements = job.requirements?.map((r: string) => r.toLowerCase()) || [];

    const skillMatches = resumeSkills.filter((skill: string) =>
      jobRequirements.some((req: string) => req.includes(skill))
    );
    matchScore += (skillMatches.length / Math.max(resumeSkills.length, 1)) * 40;

    // Check experience level (30 points)
    if (resume.experience && resume.experience.length > 0) {
      matchScore += 30;
    } else if (job.type === 'internship') {
      matchScore += 20; // Less experience needed for internships
    }

    // Check education (30 points)
    if (resume.education && resume.education.length > 0) {
      matchScore += 30;
    }

    // Cap at 100
    matchScore = Math.min(Math.round(matchScore), maxScore);

    return NextResponse.json({ matchScore });
  } catch (error) {
    console.error('Matching error:', error);
    return NextResponse.json(
      { error: 'Failed to match resume' },
      { status: 500 }
    );
  }
}
