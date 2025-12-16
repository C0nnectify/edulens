import { ResumeTemplate, TemplateConfig } from '@/types/resume';

export const TEMPLATE_PRESETS: TemplateConfig[] = [
  {
    id: 'modern',
    name: 'Modern',
    category: ResumeTemplate.MODERN,
    description: 'Clean and contemporary design with subtle accents',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      text: '#1f2937',
      heading: '#111827',
      background: '#ffffff',
      border: '#e5e7eb',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      size: {
        heading: 24,
        subheading: 18,
        body: 11,
        small: 9,
      },
    },
    layout: {
      columns: 1,
      spacing: 'normal',
      sectionOrder: [],
      showIcons: false,
      showDividers: true,
      headerStyle: 'centered',
    },
    atsScore: 95,
  },
  {
    id: 'classic',
    name: 'Classic',
    category: ResumeTemplate.CLASSIC,
    description: 'Traditional format with timeless elegance',
    colors: {
      primary: '#1f2937',
      secondary: '#4b5563',
      text: '#374151',
      heading: '#111827',
      background: '#ffffff',
      border: '#d1d5db',
    },
    fonts: {
      heading: 'Georgia',
      body: 'Georgia',
      size: {
        heading: 22,
        subheading: 16,
        body: 11,
        small: 9,
      },
    },
    layout: {
      columns: 1,
      spacing: 'normal',
      sectionOrder: [],
      showIcons: false,
      showDividers: false,
      headerStyle: 'left',
    },
    atsScore: 100,
  },
  {
    id: 'creative',
    name: 'Creative',
    category: ResumeTemplate.CREATIVE,
    description: 'Bold and expressive for creative professionals',
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      text: '#1f2937',
      heading: '#111827',
      background: '#ffffff',
      border: '#e5e7eb',
    },
    fonts: {
      heading: 'Poppins',
      body: 'Poppins',
      size: {
        heading: 26,
        subheading: 18,
        body: 11,
        small: 9,
      },
    },
    layout: {
      columns: 2,
      spacing: 'spacious',
      sectionOrder: [],
      showIcons: true,
      showDividers: true,
      headerStyle: 'split',
    },
    atsScore: 75,
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    category: ResumeTemplate.MINIMALIST,
    description: 'Simple and refined with maximum whitespace',
    colors: {
      primary: '#000000',
      secondary: '#6b7280',
      text: '#374151',
      heading: '#000000',
      background: '#ffffff',
      border: '#e5e7eb',
    },
    fonts: {
      heading: 'Helvetica',
      body: 'Helvetica',
      size: {
        heading: 24,
        subheading: 16,
        body: 10,
        small: 8,
      },
    },
    layout: {
      columns: 1,
      spacing: 'spacious',
      sectionOrder: [],
      showIcons: false,
      showDividers: false,
      headerStyle: 'left',
    },
    atsScore: 90,
  },
  {
    id: 'professional',
    name: 'Professional',
    category: ResumeTemplate.PROFESSIONAL,
    description: 'Corporate-friendly and highly readable',
    colors: {
      primary: '#0f172a',
      secondary: '#334155',
      text: '#475569',
      heading: '#0f172a',
      background: '#ffffff',
      border: '#cbd5e1',
    },
    fonts: {
      heading: 'Arial',
      body: 'Arial',
      size: {
        heading: 22,
        subheading: 16,
        body: 11,
        small: 9,
      },
    },
    layout: {
      columns: 1,
      spacing: 'compact',
      sectionOrder: [],
      showIcons: false,
      showDividers: true,
      headerStyle: 'left',
    },
    atsScore: 98,
  },
  {
    id: 'ats-friendly',
    name: 'ATS-Friendly',
    category: ResumeTemplate.ATS_FRIENDLY,
    description: 'Optimized for Applicant Tracking Systems',
    colors: {
      primary: '#000000',
      secondary: '#374151',
      text: '#1f2937',
      heading: '#000000',
      background: '#ffffff',
      border: '#e5e7eb',
    },
    fonts: {
      heading: 'Arial',
      body: 'Arial',
      size: {
        heading: 20,
        subheading: 14,
        body: 11,
        small: 9,
      },
    },
    layout: {
      columns: 1,
      spacing: 'normal',
      sectionOrder: [],
      showIcons: false,
      showDividers: false,
      headerStyle: 'left',
    },
    atsScore: 100,
  },
];

export const COLOR_PRESETS = [
  { name: 'Blue', primary: '#3b82f6', secondary: '#8b5cf6' },
  { name: 'Green', primary: '#10b981', secondary: '#06b6d4' },
  { name: 'Purple', primary: '#8b5cf6', secondary: '#ec4899' },
  { name: 'Red', primary: '#ef4444', secondary: '#f97316' },
  { name: 'Slate', primary: '#475569', secondary: '#64748b' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#06b6d4' },
  { name: 'Indigo', primary: '#6366f1', secondary: '#8b5cf6' },
  { name: 'Black', primary: '#000000', secondary: '#374151' },
] as const;

export const FONT_OPTIONS = [
  'Inter',
  'Poppins',
  'Roboto',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Playfair Display',
  'Montserrat',
  'Open Sans',
] as const;

export function getTemplatePresetById(templateId?: string): TemplateConfig {
  const fallback = TEMPLATE_PRESETS[0];
  if (!templateId) return fallback;
  return TEMPLATE_PRESETS.find((t) => t.id === templateId) ?? fallback;
}
