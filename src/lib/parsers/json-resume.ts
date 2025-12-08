/**
 * JSON Resume Import Parser
 *
 * Parses JSON Resume format (https://jsonresume.org/)
 */

import { Resume, Experience, Education, Skill, Project, Certification } from '@/types/resume';

/**
 * JSON Resume Schema (https://jsonresume.org/schema/)
 */
interface JSONResume {
  basics: {
    name: string;
    label?: string;
    image?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: {
      address?: string;
      postalCode?: string;
      city?: string;
      countryCode?: string;
      region?: string;
    };
    profiles?: Array<{
      network: string;
      username: string;
      url: string;
    }>;
  };
  work?: Array<{
    name: string;
    position: string;
    url?: string;
    startDate: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
    location?: string;
  }>;
  volunteer?: Array<{
    organization: string;
    position: string;
    url?: string;
    startDate: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  education?: Array<{
    institution: string;
    url?: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate?: string;
    score?: string;
    courses?: string[];
  }>;
  awards?: Array<{
    title: string;
    date: string;
    awarder: string;
    summary?: string;
  }>;
  certificates?: Array<{
    name: string;
    date: string;
    issuer: string;
    url?: string;
  }>;
  publications?: Array<{
    name: string;
    publisher: string;
    releaseDate: string;
    url?: string;
    summary?: string;
  }>;
  skills?: Array<{
    name: string;
    level?: string;
    keywords?: string[];
  }>;
  languages?: Array<{
    language: string;
    fluency: string;
  }>;
  interests?: Array<{
    name: string;
    keywords?: string[];
  }>;
  references?: Array<{
    name: string;
    reference: string;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    highlights?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
    roles?: string[];
    entity?: string;
    type?: string;
  }>;
}

/**
 * Parse JSON Resume file
 */
export async function parseJSONResume(file: File): Promise<Partial<Resume>> {
  try {
    const text = await file.text();
    const jsonResume: JSONResume = JSON.parse(text);

    return convertJSONResumeToResume(jsonResume);
  } catch (error) {
    throw new Error('Invalid JSON Resume format');
  }
}

/**
 * Convert JSON Resume to our Resume format
 */
export function convertJSONResumeToResume(jsonResume: JSONResume): Partial<Resume> {
  const resume: Partial<Resume> = {
    personalInfo: {
      fullName: jsonResume.basics.name,
      email: jsonResume.basics.email || '',
      phone: jsonResume.basics.phone || '',
      location: {
        city: jsonResume.basics.location?.city,
        state: jsonResume.basics.location?.region,
        country: jsonResume.basics.location?.countryCode || '',
        zipCode: jsonResume.basics.location?.postalCode,
      },
      website: jsonResume.basics.url,
      professionalTitle: jsonResume.basics.label,
      profilePhoto: jsonResume.basics.image,
    },
    summary: jsonResume.basics.summary || '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
  };

  // Extract LinkedIn/GitHub from profiles
  if (jsonResume.basics.profiles) {
    jsonResume.basics.profiles.forEach(profile => {
      const network = profile.network.toLowerCase();
      if (network.includes('linkedin')) {
        resume.personalInfo!.linkedIn = profile.url;
      } else if (network.includes('github')) {
        resume.personalInfo!.github = profile.url;
      }
    });
  }

  // Work Experience
  if (jsonResume.work && jsonResume.work.length > 0) {
    resume.experience = jsonResume.work.map((work, index) => ({
      id: `exp-${index}`,
      company: work.name,
      position: work.position,
      location: work.location || '',
      startDate: work.startDate,
      endDate: work.endDate || '',
      current: !work.endDate,
      description: work.summary,
      achievements: work.highlights || [],
      order: index,
    }));
  }

  // Education
  if (jsonResume.education && jsonResume.education.length > 0) {
    resume.education = jsonResume.education.map((edu, index) => ({
      id: `edu-${index}`,
      institution: edu.institution,
      degree: edu.studyType,
      field: edu.area,
      location: '',
      startDate: edu.startDate,
      endDate: edu.endDate || '',
      current: !edu.endDate,
      gpa: edu.score,
      coursework: edu.courses,
      order: index,
    }));
  }

  // Skills
  if (jsonResume.skills && jsonResume.skills.length > 0) {
    resume.skills = jsonResume.skills.map((skill, index) => ({
      id: `skill-${index}`,
      name: skill.name,
      category: 'technical',
      proficiency: mapJSONResumeLevel(skill.level),
      order: index,
    }));
  }

  // Languages
  if (jsonResume.languages && jsonResume.languages.length > 0) {
    resume.languages = jsonResume.languages.map((lang, index) => ({
      id: `lang-${index}`,
      name: lang.language,
      proficiency: mapJSONResumeFluency(lang.fluency),
    }));
  }

  // Certifications
  if (jsonResume.certificates && jsonResume.certificates.length > 0) {
    resume.certifications = jsonResume.certificates.map((cert, index) => ({
      id: `cert-${index}`,
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date,
      url: cert.url,
      order: index,
    }));
  }

  // Projects
  if (jsonResume.projects && jsonResume.projects.length > 0) {
    resume.projects = jsonResume.projects.map((project, index) => ({
      id: `proj-${index}`,
      name: project.name,
      description: project.description || '',
      role: project.roles?.[0],
      startDate: project.startDate,
      endDate: project.endDate,
      current: !project.endDate,
      technologies: project.keywords || [],
      achievements: project.highlights,
      url: project.url,
      order: index,
    }));
  }

  return resume;
}

/**
 * Map JSON Resume skill level to our format
 */
function mapJSONResumeLevel(level?: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (!level) return 'intermediate';

  const lower = level.toLowerCase();

  if (lower.includes('master') || lower.includes('expert')) return 'expert';
  if (lower.includes('advanced') || lower.includes('senior')) return 'advanced';
  if (lower.includes('beginner') || lower.includes('junior')) return 'beginner';

  return 'intermediate';
}

/**
 * Map JSON Resume fluency to our format
 */
function mapJSONResumeFluency(fluency: string): 'native' | 'fluent' | 'professional' | 'intermediate' | 'basic' {
  const lower = fluency.toLowerCase();

  if (lower.includes('native')) return 'native';
  if (lower.includes('fluent')) return 'fluent';
  if (lower.includes('professional') || lower.includes('full')) return 'professional';
  if (lower.includes('limited') || lower.includes('basic') || lower.includes('elementary')) return 'basic';

  return 'intermediate';
}

/**
 * Validate JSON Resume format
 */
export function validateJSONResume(data: any): boolean {
  try {
    // Check for required fields
    if (!data.basics || !data.basics.name) {
      return false;
    }

    // Validate structure (basic check)
    if (data.work && !Array.isArray(data.work)) return false;
    if (data.education && !Array.isArray(data.education)) return false;
    if (data.skills && !Array.isArray(data.skills)) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Export Resume to JSON Resume format
 */
export function convertResumeToJSONResume(resume: Resume): JSONResume {
  const jsonResume: JSONResume = {
    basics: {
      name: resume.personalInfo.fullName,
      label: resume.personalInfo.professionalTitle,
      email: resume.personalInfo.email,
      phone: resume.personalInfo.phone,
      url: resume.personalInfo.website,
      summary: resume.summary,
      location: {
        city: resume.personalInfo.location?.city,
        region: resume.personalInfo.location?.state,
        countryCode: resume.personalInfo.location?.country,
        postalCode: resume.personalInfo.location?.zipCode,
      },
      profiles: [],
    },
  };

  // Add profiles
  if (resume.personalInfo.linkedIn) {
    jsonResume.basics.profiles?.push({
      network: 'LinkedIn',
      username: '',
      url: resume.personalInfo.linkedIn,
    });
  }
  if (resume.personalInfo.github) {
    jsonResume.basics.profiles?.push({
      network: 'GitHub',
      username: '',
      url: resume.personalInfo.github,
    });
  }

  // Work Experience
  if (resume.experience && resume.experience.length > 0) {
    jsonResume.work = resume.experience.map(exp => ({
      name: exp.company,
      position: exp.position,
      startDate: exp.startDate.toString(),
      endDate: exp.endDate?.toString(),
      summary: exp.description,
      highlights: exp.achievements,
      location: typeof exp.location === 'string' ? exp.location : exp.location?.city || '',
    }));
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    jsonResume.education = resume.education.map(edu => ({
      institution: edu.institution,
      area: edu.field,
      studyType: edu.degree,
      startDate: edu.startDate.toString(),
      endDate: edu.endDate?.toString(),
      score: edu.gpa?.toString(),
      courses: edu.coursework,
    }));
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    jsonResume.skills = resume.skills.map(skill => ({
      name: skill.name,
      level: skill.proficiency || skill.level,
      keywords: [],
    }));
  }

  // Languages
  if (resume.languages && resume.languages.length > 0) {
    jsonResume.languages = resume.languages.map(lang => ({
      language: lang.name,
      fluency: lang.proficiency,
    }));
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    jsonResume.certificates = resume.certifications.map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date.toString(),
      url: cert.url,
    }));
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    jsonResume.projects = resume.projects.map(project => ({
      name: project.name,
      description: project.description,
      startDate: project.startDate?.toString(),
      endDate: project.endDate?.toString(),
      url: project.url,
      keywords: project.technologies,
      highlights: project.achievements,
    }));
  }

  return jsonResume;
}
