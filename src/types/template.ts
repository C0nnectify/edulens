/**
 * Template Type Definitions
 *
 * Comprehensive types for industry-specific resume templates
 */

import { IndustryTemplate, IndustryCategory } from './resume';

/**
 * Template layout configuration
 */
export interface TemplateLayout {
  columns: 1 | 2;
  spacing: 'compact' | 'normal' | 'spacious';
  headerStyle: 'centered' | 'left' | 'split';
  showIcons?: boolean;
  showDividers?: boolean;
}

/**
 * Template font configuration
 */
export interface TemplateFonts {
  heading: string;
  body: string;
  size: {
    name: number;
    heading: number;
    subheading: number;
    body: number;
    small: number;
  };
}

/**
 * Template color scheme
 */
export interface TemplateColors {
  primary: string;
  secondary?: string;
  accent?: string;
  text: string;
  heading: string;
  background: string;
  border?: string;
}

/**
 * Custom section definition for industry-specific needs
 */
export interface CustomSectionDefinition {
  label: string;
  key: string;
  type: 'licenses' | 'publications' | 'portfolio' | 'research' | 'clinical' | 'projects';
  required?: boolean;
  description?: string;
}

/**
 * Sample content for template guidance
 */
export interface TemplateSampleContent {
  summary?: string;
  experience?: string[];
  skills?: string[];
  customSections?: Record<string, string[]>;
}

/**
 * Complete industry template configuration
 */
export interface IndustryTemplateConfig {
  id: string;
  name: string;
  industry: IndustryTemplate;
  category: IndustryCategory;
  description: string;
  preview?: string;
  atsScore: number;
  isPremium?: boolean;
  features?: string[];

  // Section configuration
  sectionOrder: string[];
  requiredSections: string[];
  optionalSections: string[];
  customSections?: CustomSectionDefinition[];

  // Visual configuration
  layout: TemplateLayout;
  fonts: TemplateFonts;
  colors: TemplateColors;

  // Sample content
  sampleContent?: TemplateSampleContent;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Base ATS-friendly template settings
 */
export const ATSBaseTemplate: Partial<IndustryTemplateConfig> = {
  layout: {
    columns: 1,
    spacing: 'normal',
    headerStyle: 'left',
    showIcons: false,
    showDividers: true,
  },
  fonts: {
    heading: 'Arial',
    body: 'Arial',
    size: {
      name: 18,
      heading: 14,
      subheading: 12,
      body: 11,
      small: 10,
    },
  },
  colors: {
    primary: '#000000',
    text: '#000000',
    heading: '#000000',
    background: '#ffffff',
    accent: '#333333',
    border: '#cccccc',
  },
};

/**
 * Template filter options
 */
export interface TemplateFilter {
  category?: IndustryCategory;
  atsMinScore?: number;
  isPremium?: boolean;
  search?: string;
}

/**
 * Template selection state
 */
export interface TemplateSelection {
  templateId: string;
  template: IndustryTemplateConfig;
  previewData?: any;
}
