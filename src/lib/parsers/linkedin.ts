/**
 * LinkedIn Import Parser
 *
 * Parses LinkedIn data export (ZIP file containing CSVs)
 */

import { Resume, Experience, Education, Skill, Certification, Language, Project } from '@/types/resume';

/**
 * LinkedIn data structures from CSV export
 */
interface LinkedInProfile {
  'First Name': string;
  'Last Name': string;
  'Email Address'?: string;
  'Headline': string;
  'Summary': string;
  'Geo Location': string;
  'Websites': string;
  'Twitter Handles'?: string;
}

interface LinkedInPosition {
  'Company Name': string;
  'Title': string;
  'Description': string;
  'Location': string;
  'Started On': string;
  'Finished On': string;
}

interface LinkedInEducation {
  'School Name': string;
  'Degree Name': string;
  'Notes': string;
  'Start Date': string;
  'End Date': string;
}

interface LinkedInSkill {
  'Name': string;
}

interface LinkedInLanguage {
  'Name': string;
  'Proficiency': string;
}

interface LinkedInCertification {
  'Name': string;
  'Authority': string;
  'Url': string;
  'Started On': string;
  'Finished On': string;
}

interface LinkedInProject {
  'Title': string;
  'Description': string;
  'Url': string;
  'Started On': string;
  'Finished On': string;
}

interface LinkedInData {
  Profile?: LinkedInProfile[];
  'Email Addresses'?: Array<{ 'Email Address': string }>;
  Positions?: LinkedInPosition[];
  Education?: LinkedInEducation[];
  Skills?: LinkedInSkill[];
  Languages?: LinkedInLanguage[];
  Certifications?: LinkedInCertification[];
  Projects?: LinkedInProject[];
}

/**
 * Parse CSV content (simplified - you'd use papaparse in production)
 */
function parseCSV(content: string): any[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Extract URL from LinkedIn websites field
 * Format: [TYPE:URL,TYPE:URL,...]
 */
function extractFirstWebsite(websites: string): string {
  if (!websites) return '';
  const match = websites.match(/:(https?:\/\/[^,\]]+)/);
  return match ? match[1] : '';
}

/**
 * Parse LinkedIn ZIP file
 */
export async function parseLinkedInZip(file: File): Promise<Partial<Resume>> {
  // In production, use JSZip to extract files
  // For now, we'll return the structure

  throw new Error('Please install jszip: npm install jszip');

  // Example implementation with jszip:
  /*
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const linkedInData: LinkedInData = {};

  // Extract and parse each CSV
  for (const [filename, fileObj] of Object.entries(zip.files)) {
    if (filename.endsWith('.csv')) {
      const content = await fileObj.async('text');
      const parsed = parseCSV(content);

      if (filename.includes('Profile')) linkedInData.Profile = parsed;
      if (filename.includes('Email')) linkedInData['Email Addresses'] = parsed;
      if (filename.includes('Positions')) linkedInData.Positions = parsed;
      if (filename.includes('Education')) linkedInData.Education = parsed;
      if (filename.includes('Skills')) linkedInData.Skills = parsed;
      if (filename.includes('Languages')) linkedInData.Languages = parsed;
      if (filename.includes('Certifications')) linkedInData.Certifications = parsed;
      if (filename.includes('Projects')) linkedInData.Projects = parsed;
    }
  }

  return convertLinkedInToResume(linkedInData);
  */
}

/**
 * Convert LinkedIn data to Resume format
 */
export function convertLinkedInToResume(data: LinkedInData): Partial<Resume> {
  const resume: Partial<Resume> = {
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: { country: '' },
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
  };

  // Profile data
  if (data.Profile && data.Profile.length > 0) {
    const profile = data.Profile[0];
    resume.personalInfo = {
      fullName: `${profile['First Name']} ${profile['Last Name']}`.trim(),
      firstName: profile['First Name'],
      lastName: profile['Last Name'],
      email: profile['Email Address'] || '',
      phone: '',
      location: { country: profile['Geo Location'] || '' },
      linkedIn: extractFirstWebsite(profile.Websites),
      professionalTitle: profile.Headline,
    };
    resume.summary = profile.Summary;
  }

  // Email
  if (data['Email Addresses'] && data['Email Addresses'].length > 0) {
    resume.personalInfo!.email = data['Email Addresses'][0]['Email Address'];
  }

  // Experience
  if (data.Positions && data.Positions.length > 0) {
    resume.experience = data.Positions.map((pos, index) => ({
      id: `exp-${index}`,
      company: pos['Company Name'],
      position: pos.Title,
      location: pos.Location,
      startDate: pos['Started On'],
      endDate: pos['Finished On'] || '',
      current: !pos['Finished On'],
      description: pos.Description,
      achievements: pos.Description ? [pos.Description] : [],
      order: index,
    }));
  }

  // Education
  if (data.Education && data.Education.length > 0) {
    resume.education = data.Education.map((edu, index) => ({
      id: `edu-${index}`,
      institution: edu['School Name'],
      degree: edu['Degree Name'],
      field: '',
      location: '',
      startDate: edu['Start Date'],
      endDate: edu['End Date'] || '',
      current: !edu['End Date'],
      achievements: edu.Notes ? [edu.Notes] : [],
      order: index,
    }));
  }

  // Skills
  if (data.Skills && data.Skills.length > 0) {
    resume.skills = data.Skills.map((skill, index) => ({
      id: `skill-${index}`,
      name: skill.Name,
      category: 'technical',
      proficiency: 'intermediate',
      order: index,
    }));
  }

  // Languages
  if (data.Languages && data.Languages.length > 0) {
    resume.languages = data.Languages.map((lang, index) => ({
      id: `lang-${index}`,
      name: lang.Name,
      proficiency: mapLinkedInProficiency(lang.Proficiency),
    }));
  }

  // Certifications
  if (data.Certifications && data.Certifications.length > 0) {
    resume.certifications = data.Certifications.map((cert, index) => ({
      id: `cert-${index}`,
      name: cert.Name,
      issuer: cert.Authority,
      date: cert['Started On'],
      expiryDate: cert['Finished On'] || undefined,
      url: cert.Url,
      order: index,
    }));
  }

  // Projects
  if (data.Projects && data.Projects.length > 0) {
    resume.projects = data.Projects.map((proj, index) => ({
      id: `proj-${index}`,
      name: proj.Title,
      description: proj.Description,
      startDate: proj['Started On'],
      endDate: proj['Finished On'] || undefined,
      current: !proj['Finished On'],
      technologies: [],
      url: proj.Url,
      order: index,
    }));
  }

  return resume;
}

/**
 * Map LinkedIn proficiency levels to our format
 */
function mapLinkedInProficiency(proficiency: string): 'native' | 'fluent' | 'professional' | 'intermediate' | 'basic' {
  const lower = proficiency.toLowerCase();

  if (lower.includes('native')) return 'native';
  if (lower.includes('fluent')) return 'fluent';
  if (lower.includes('professional')) return 'professional';
  if (lower.includes('limited') || lower.includes('basic')) return 'basic';

  return 'intermediate';
}

/**
 * Validate LinkedIn ZIP structure
 */
export function validateLinkedInZip(files: string[]): boolean {
  // Check for required files
  const hasProfile = files.some(f => f.includes('Profile'));
  const hasPositions = files.some(f => f.includes('Positions'));

  return hasProfile || hasPositions;
}
