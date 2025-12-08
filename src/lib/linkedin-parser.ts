/**
 * LinkedIn PDF Parser
 *
 * Parses LinkedIn PDF exports to extract resume data
 * Handles text extraction and pattern matching for different sections
 */

import { Experience, Education, Skill, Certification } from '@/types/resume';

interface ParsedLinkedInData {
  experience: Partial<Experience>[];
  education: Partial<Education>[];
  skills: Partial<Skill>[];
  certifications: Partial<Certification>[];
  summary?: string;
}

/**
 * Parse LinkedIn PDF export
 */
export async function parseLinkedInPDF(file: File): Promise<ParsedLinkedInData> {
  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Import pdf-parse dynamically (client-side)
    const pdfParse = (await import('pdf-parse')).default;

    // Parse PDF
    const data = await pdfParse(buffer);
    const text = data.text;

    // Parse sections
    const experience = parseExperience(text);
    const education = parseEducation(text);
    const skills = parseSkills(text);
    const certifications = parseCertifications(text);
    const summary = parseSummary(text);

    return {
      experience,
      education,
      skills,
      certifications,
      summary,
    };
  } catch (error) {
    console.error('Error parsing LinkedIn PDF:', error);
    throw new Error('Failed to parse LinkedIn PDF. Please ensure the file is a valid LinkedIn export.');
  }
}

/**
 * Parse work experience section
 */
function parseExperience(text: string): Partial<Experience>[] {
  const experiences: Partial<Experience>[] = [];

  // Look for experience section
  const experienceMatch = text.match(/Experience\s+([\s\S]*?)(?=Education|Skills|Certifications|$)/i);
  if (!experienceMatch) return experiences;

  const experienceText = experienceMatch[1];

  // Split by company (typically separated by multiple newlines)
  const entries = experienceText.split(/\n\s*\n/);

  entries.forEach((entry) => {
    const lines = entry.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) return;

    // Extract position (usually first line)
    const position = lines[0].trim();

    // Extract company (usually second line)
    const company = lines[1].trim();

    // Extract dates (look for patterns like "Jan 2020 - Present" or "2020-2022")
    const dateMatch = entry.match(/(\w{3}\s+\d{4}|\d{4})\s*[-–]\s*(\w{3}\s+\d{4}|\d{4}|Present)/i);
    let startDate: string | undefined;
    let endDate: string | undefined;
    let current = false;

    if (dateMatch) {
      startDate = parseDate(dateMatch[1]);
      if (dateMatch[2].toLowerCase() === 'present') {
        current = true;
      } else {
        endDate = parseDate(dateMatch[2]);
      }
    }

    // Extract location (often follows dates or company)
    const locationMatch = entry.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2,})/);
    const location = locationMatch ? locationMatch[1] : undefined;

    // Extract description and bullets (remaining lines)
    const descriptionLines = lines.slice(2).filter(line =>
      !dateMatch || !line.includes(dateMatch[0])
    );
    const achievements = descriptionLines.map(line => line.trim().replace(/^[•\-\*]\s*/, ''));

    experiences.push({
      id: `exp-${Date.now()}-${Math.random()}`,
      company,
      position,
      location,
      startDate,
      endDate,
      current,
      achievements: achievements.filter(a => a.length > 0),
    });
  });

  return experiences;
}

/**
 * Parse education section
 */
function parseEducation(text: string): Partial<Education>[] {
  const educationList: Partial<Education>[] = [];

  // Look for education section
  const educationMatch = text.match(/Education\s+([\s\S]*?)(?=Experience|Skills|Certifications|$)/i);
  if (!educationMatch) return educationList;

  const educationText = educationMatch[1];

  // Split by institution
  const entries = educationText.split(/\n\s*\n/);

  entries.forEach((entry) => {
    const lines = entry.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) return;

    // Extract institution (usually first line)
    const institution = lines[0].trim();

    // Extract degree (usually second line)
    const degreeMatch = lines[1].match(/(.*?)(?:\s+in\s+(.+))?$/i);
    const degree = degreeMatch ? degreeMatch[1].trim() : lines[1].trim();
    const field = degreeMatch?.[2]?.trim() || '';

    // Extract dates
    const dateMatch = entry.match(/(\d{4})\s*[-–]\s*(\d{4}|Present)/i);
    let startDate: string | undefined;
    let endDate: string | undefined;
    let current = false;

    if (dateMatch) {
      startDate = dateMatch[1];
      if (dateMatch[2].toLowerCase() === 'present') {
        current = true;
      } else {
        endDate = dateMatch[2];
      }
    }

    // Extract GPA if present
    const gpaMatch = entry.match(/GPA[:\s]+(\d+\.?\d*)/i);
    const gpa = gpaMatch ? parseFloat(gpaMatch[1]) : undefined;

    educationList.push({
      id: `edu-${Date.now()}-${Math.random()}`,
      institution,
      degree,
      field,
      startDate,
      endDate,
      current,
      gpa,
    });
  });

  return educationList;
}

/**
 * Parse skills section
 */
function parseSkills(text: string): Partial<Skill>[] {
  const skills: Partial<Skill>[] = [];

  // Look for skills section
  const skillsMatch = text.match(/Skills\s+([\s\S]*?)(?=Experience|Education|Certifications|$)/i);
  if (!skillsMatch) return skills;

  const skillsText = skillsMatch[1];

  // Split by commas, bullets, or newlines
  const skillNames = skillsText
    .split(/[,•\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 50); // Filter out invalid entries

  skillNames.forEach((name) => {
    // Try to categorize skill
    const category = categorizeSkill(name);

    skills.push({
      id: `skill-${Date.now()}-${Math.random()}`,
      name,
      category,
    });
  });

  return skills;
}

/**
 * Parse certifications section
 */
function parseCertifications(text: string): Partial<Certification>[] {
  const certifications: Partial<Certification>[] = [];

  // Look for certifications section
  const certsMatch = text.match(/Certifications?\s+([\s\S]*?)(?=Experience|Education|Skills|$)/i);
  if (!certsMatch) return certifications;

  const certsText = certsMatch[1];

  // Split by entries
  const entries = certsText.split(/\n\s*\n/);

  entries.forEach((entry) => {
    const lines = entry.trim().split('\n').filter(line => line.trim());
    if (lines.length < 1) return;

    // Extract name (usually first line)
    const name = lines[0].trim();

    // Extract issuer (usually second line or part of first line)
    const issuerMatch = entry.match(/(?:Issued by|from)\s+(.+?)(?:\n|$)/i) ||
                        (lines.length > 1 ? { 1: lines[1] } : null);
    const issuer = issuerMatch ? issuerMatch[1].trim() : 'Unknown';

    // Extract date
    const dateMatch = entry.match(/(\w{3}\s+\d{4}|\d{4})/);
    const date = dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString();

    certifications.push({
      id: `cert-${Date.now()}-${Math.random()}`,
      name,
      issuer,
      date,
    });
  });

  return certifications;
}

/**
 * Parse summary/about section
 */
function parseSummary(text: string): string | undefined {
  const summaryMatch = text.match(/(?:Summary|About)\s+([\s\S]*?)(?=Experience|Education|Skills|$)/i);
  if (!summaryMatch) return undefined;

  return summaryMatch[1].trim();
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr: string): string {
  // Handle "Jan 2020" format
  const monthYearMatch = dateStr.match(/(\w{3})\s+(\d{4})/);
  if (monthYearMatch) {
    const monthMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04',
      may: '05', jun: '06', jul: '07', aug: '08',
      sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const month = monthMap[monthYearMatch[1].toLowerCase()] || '01';
    return `${monthYearMatch[2]}-${month}-01`;
  }

  // Handle "2020" format
  if (/^\d{4}$/.test(dateStr)) {
    return `${dateStr}-01-01`;
  }

  return dateStr;
}

/**
 * Categorize skill based on name
 */
function categorizeSkill(skillName: string): string {
  const name = skillName.toLowerCase();

  // Programming languages
  if (/javascript|python|java|c\+\+|typescript|ruby|php|swift|kotlin|go|rust/.test(name)) {
    return 'technical';
  }

  // Frameworks
  if (/react|angular|vue|node|express|django|flask|spring|laravel/.test(name)) {
    return 'framework';
  }

  // Tools
  if (/git|docker|kubernetes|aws|azure|jenkins|jira|figma|photoshop/.test(name)) {
    return 'tool';
  }

  // Soft skills
  if (/leadership|communication|teamwork|problem|management|creative/.test(name)) {
    return 'soft';
  }

  // Default to technical
  return 'technical';
}

/**
 * Clean and normalize parsed data
 */
export function cleanLinkedInData(data: ParsedLinkedInData): ParsedLinkedInData {
  return {
    experience: data.experience.map(exp => ({
      ...exp,
      company: exp.company?.trim(),
      position: exp.position?.trim(),
      achievements: exp.achievements?.filter(a => a.length > 10) || [],
    })),
    education: data.education.map(edu => ({
      ...edu,
      institution: edu.institution?.trim(),
      degree: edu.degree?.trim(),
      field: edu.field?.trim(),
    })),
    skills: data.skills.filter(skill =>
      skill.name && skill.name.length > 1 && skill.name.length < 50
    ),
    certifications: data.certifications.map(cert => ({
      ...cert,
      name: cert.name?.trim(),
      issuer: cert.issuer?.trim(),
    })),
    summary: data.summary?.trim(),
  };
}
