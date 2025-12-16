// Zod validation schemas for Resume API

import { z } from 'zod';

// Personal Info Schema
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  portfolio: z.string().url().optional().or(z.literal('')),
  customLinks: z.array(z.object({
    label: z.string().min(1),
    url: z.string().url(),
  })).optional(),
});

// Experience Schema
export const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().max(500).optional(),
  bullets: z.array(z.string()).min(1, 'At least one bullet point is required'),
  keywords: z.array(z.string()).optional(),
});

// Education Schema
export const educationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  gpa: z.string().optional(),
  honors: z.array(z.string()).optional(),
  coursework: z.array(z.string()).optional(),
});

// Skill Schema
export const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  category: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  years: z.number().min(0).max(50).optional(),
});

// Project Schema
export const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Description is required'),
  technologies: z.array(z.string()).min(1, 'At least one technology is required'),
  url: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bullets: z.array(z.string()).optional(),
});

// Certification Schema
export const certificationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string().min(1, 'Date is required'),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
});

// Language Schema
export const languageSchema = z.object({
  name: z.string().min(1, 'Language name is required'),
  proficiency: z.enum(['native', 'fluent', 'professional', 'intermediate', 'basic']),
});

// Custom Section Schema
export const customSectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Section title is required'),
  items: z.array(z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    date: z.string().optional(),
    bullets: z.array(z.string()).optional(),
  })).min(1, 'At least one item is required'),
});

// Complete Resume Schema
export const resumeSchema = z.object({
  title: z.string().min(1, 'Resume title is required').max(100),
  personalInfo: personalInfoSchema,
  summary: z.string().max(500).optional(),
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(skillSchema).default([]),
  projects: z.array(projectSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  languages: z.array(languageSchema).optional(),
  customSections: z.array(customSectionSchema).optional(),
  template: z.string().optional(),
  design: z
    .object({
      colors: z
        .object({
          primary: z.string().optional(),
          secondary: z.string().optional(),
        })
        .optional(),
      font: z.string().optional(),
      layout: z
        .object({
          columns: z.union([z.literal(1), z.literal(2)]).optional(),
          spacing: z.enum(['compact', 'normal', 'spacious']).optional(),
        })
        .optional(),
    })
    .optional(),
});

// Update Resume Schema (all fields optional)
export const updateResumeSchema = resumeSchema.partial();

// Job Analysis Schema
export const jobAnalysisSchema = z.object({
  url: z.string().url('Valid URL is required'),
  extractKeywords: z.boolean().optional().default(true),
});

// Job Description Schema
export const jobDescriptionSchema = z.object({
  description: z.string().min(50, 'Job description must be at least 50 characters'),
  extractTop: z.number().min(5).max(50).optional().default(20),
});

// Job Match Schema
export const jobMatchSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  jobDescription: z.string().min(50, 'Job description is required').optional(),
  jobUrl: z.string().url().optional(),
  jobPostingId: z.string().optional(),
}).refine(
  (data) => data.jobDescription || data.jobUrl || data.jobPostingId,
  { message: 'Either jobDescription, jobUrl, or jobPostingId must be provided' }
);

// Resume Analysis Schema
export const resumeAnalysisSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  analyzeFor: z.enum(['general', 'ats', 'impact', 'keywords']).optional().default('general'),
});

// Resume Optimization Schema
export const resumeOptimizationSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  targetRole: z.string().optional(),
  industry: z.string().optional(),
  optimizeFor: z.enum(['ats', 'impact', 'clarity', 'keywords']).optional().default('ats'),
});

// Export Schema
export const exportSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  format: z.enum(['pdf', 'docx', 'txt']),
  template: z.string().optional(),
  includePhoto: z.boolean().optional().default(false),
  colorScheme: z.string().optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional().default('medium'),
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  sort: z.string().optional().default('-createdAt'),
  search: z.string().optional(),
});