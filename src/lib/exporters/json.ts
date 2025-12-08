/**
 * JSON Export Utilities
 *
 * Export resume to JSON formats (native + JSON Resume)
 */

import { Resume } from '@/types/resume';
import { convertResumeToJSONResume } from '@/lib/parsers/json-resume';

/**
 * Export resume as native JSON format
 */
export function exportToJSON(resume: Resume): Blob {
  const jsonString = JSON.stringify(resume, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Export resume as JSON Resume format
 */
export function exportToJSONResume(resume: Resume): Blob {
  const jsonResume = convertResumeToJSONResume(resume);
  const jsonString = JSON.stringify(jsonResume, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Generate filename for JSON export
 */
export function generateJSONFilename(resume: Resume, format: 'native' | 'jsonresume'): string {
  const name = resume.personalInfo.fullName || 'resume';
  const sanitized = name.toLowerCase().replace(/\s+/g, '-');
  const timestamp = new Date().toISOString().split('T')[0];
  const suffix = format === 'jsonresume' ? '-jsonresume' : '';

  return `${sanitized}${suffix}-${timestamp}.json`;
}

/**
 * Trigger download of JSON file
 */
export function downloadJSON(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export resume as TXT (plain text, ultra ATS-safe)
 */
export function exportToTXT(resume: Resume): Blob {
  let text = '';

  // Personal Info
  text += `${resume.personalInfo.fullName}\n`;
  if (resume.personalInfo.professionalTitle) {
    text += `${resume.personalInfo.professionalTitle}\n`;
  }
  text += '\n';

  if (resume.personalInfo.email) text += `Email: ${resume.personalInfo.email}\n`;
  if (resume.personalInfo.phone) text += `Phone: ${resume.personalInfo.phone}\n`;
  if (resume.personalInfo.location) {
    const loc = resume.personalInfo.location;
    const location = [loc.city, loc.state, loc.country].filter(Boolean).join(', ');
    if (location) text += `Location: ${location}\n`;
  }
  if (resume.personalInfo.linkedIn) text += `LinkedIn: ${resume.personalInfo.linkedIn}\n`;
  if (resume.personalInfo.github) text += `GitHub: ${resume.personalInfo.github}\n`;
  if (resume.personalInfo.website) text += `Website: ${resume.personalInfo.website}\n`;
  text += '\n';

  // Summary
  if (resume.summary) {
    text += 'PROFESSIONAL SUMMARY\n';
    text += '='.repeat(50) + '\n';
    text += `${resume.summary}\n\n`;
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    text += 'WORK EXPERIENCE\n';
    text += '='.repeat(50) + '\n';
    resume.experience.forEach((exp) => {
      text += `\n${exp.company}\n`;
      text += `${exp.position}\n`;
      if (exp.location) {
        const loc = typeof exp.location === 'string' ? exp.location : exp.location.city || '';
        text += `${loc} | `;
      }
      text += `${exp.startDate} - ${exp.endDate || 'Present'}\n`;
      if (exp.description) text += `\n${exp.description}\n`;
      if (exp.achievements && exp.achievements.length > 0) {
        text += '\n';
        exp.achievements.forEach((achievement) => {
          text += `• ${achievement}\n`;
        });
      }
      text += '\n';
    });
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    text += '\nEDUCATION\n';
    text += '='.repeat(50) + '\n';
    resume.education.forEach((edu) => {
      text += `\n${edu.institution}\n`;
      text += `${edu.degree} in ${edu.field}\n`;
      text += `${edu.startDate} - ${edu.endDate || 'Present'}\n`;
      if (edu.gpa) text += `GPA: ${edu.gpa}\n`;
      if (edu.achievements && edu.achievements.length > 0) {
        edu.achievements.forEach((achievement) => {
          text += `• ${achievement}\n`;
        });
      }
      text += '\n';
    });
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    text += '\nSKILLS\n';
    text += '='.repeat(50) + '\n';
    const skillsByCategory: Record<string, string[]> = {};

    resume.skills.forEach((skill) => {
      const category = skill.category || 'Other';
      if (!skillsByCategory[category]) {
        skillsByCategory[category] = [];
      }
      skillsByCategory[category].push(skill.name);
    });

    Object.entries(skillsByCategory).forEach(([category, skills]) => {
      text += `\n${category.charAt(0).toUpperCase() + category.slice(1)}:\n`;
      text += skills.join(', ') + '\n';
    });
    text += '\n';
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    text += '\nPROJECTS\n';
    text += '='.repeat(50) + '\n';
    resume.projects.forEach((project) => {
      text += `\n${project.name}\n`;
      if (project.description) text += `${project.description}\n`;
      if (project.technologies && project.technologies.length > 0) {
        text += `Technologies: ${project.technologies.join(', ')}\n`;
      }
      if (project.url) text += `URL: ${project.url}\n`;
      text += '\n';
    });
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    text += '\nCERTIFICATIONS\n';
    text += '='.repeat(50) + '\n';
    resume.certifications.forEach((cert) => {
      text += `\n${cert.name}\n`;
      text += `${cert.issuer} | ${cert.date}\n`;
      if (cert.credentialId) text += `Credential ID: ${cert.credentialId}\n`;
      if (cert.url) text += `URL: ${cert.url}\n`;
    });
    text += '\n';
  }

  // Languages
  if (resume.languages && resume.languages.length > 0) {
    text += '\nLANGUAGES\n';
    text += '='.repeat(50) + '\n';
    resume.languages.forEach((lang) => {
      text += `${lang.name}: ${lang.proficiency}\n`;
    });
    text += '\n';
  }

  return new Blob([text], { type: 'text/plain' });
}

/**
 * Generate filename for TXT export
 */
export function generateTXTFilename(resume: Resume): string {
  const name = resume.personalInfo.fullName || 'resume';
  const sanitized = name.toLowerCase().replace(/\s+/g, '-');
  const timestamp = new Date().toISOString().split('T')[0];

  return `${sanitized}-${timestamp}.txt`;
}
