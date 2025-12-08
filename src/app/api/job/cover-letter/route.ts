import { NextRequest, NextResponse } from 'next/server';

/**
 * AI-powered cover letter generation API
 */
export async function POST(request: NextRequest) {
  try {
    const { resume, job } = await request.json();

    // Generate personalized cover letter
    const coverLetter = generateCoverLetterTemplate(resume, job);

    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}

function generateCoverLetterTemplate(resume: any, job: any): string {
  const name = resume.personalInfo?.fullName || 'Your Name';
  const email = resume.personalInfo?.email || 'your.email@example.com';
  const phone = resume.personalInfo?.phone || '(555) 123-4567';
  const company = job.company || 'Hiring Company';
  const position = job.title || 'the position';

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Extract top skills from resume
  const skills = resume.skills?.slice(0, 3).map((s: any) =>
    typeof s === 'string' ? s : s.name
  ).join(', ') || 'relevant technical skills';

  // Get latest education
  const education = resume.education?.[0];
  const degree = education ? `${education.degree} in ${education.field} from ${education.institution}` : 'my academic background';

  return `${name}
${email} | ${phone}
${resume.personalInfo?.location?.city || ''}, ${resume.personalInfo?.location?.state || ''}

${today}

Dear Hiring Manager,

I am writing to express my strong interest in the ${position} position at ${company}. As a motivated student with ${skills}, I am excited about the opportunity to contribute to your team.

${resume.summary || `I am currently pursuing ${degree}, where I have developed a strong foundation in problem-solving and technical skills. My academic journey has equipped me with the knowledge and enthusiasm necessary to excel in this role.`}

What particularly excites me about ${company} is your commitment to innovation and excellence. I am eager to bring my skills and passion to your organization, and I am confident that my background aligns well with the requirements of this position.

${resume.experience && resume.experience.length > 0
  ? `Through my previous experience at ${resume.experience[0].company}, I have demonstrated my ability to work effectively in team environments and deliver results under pressure. This experience has prepared me to make meaningful contributions to your team from day one.`
  : 'I am eager to apply my academic knowledge in a professional setting and contribute fresh perspectives to your team. My strong work ethic and willingness to learn make me an ideal candidate for this opportunity.'
}

I would welcome the opportunity to discuss how my skills and enthusiasm can benefit ${company}. Thank you for considering my application.

Sincerely,
${name}`;
}
