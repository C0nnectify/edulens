/**
 * Resume Builder Type Definitions
 *
 * Comprehensive TypeScript types and interfaces for an AI-powered resume builder
 * application with ATS optimization, job matching, and intelligent analysis.
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Resume template styles
 */
export enum ResumeTemplate {
  MODERN = 'modern',
  CLASSIC = 'classic',
  ATS_FRIENDLY = 'ats-friendly',
  CREATIVE = 'creative',
  MINIMALIST = 'minimalist',
  PROFESSIONAL = 'professional',
}

/**
 * Industry-specific resume templates
 */
export enum IndustryTemplate {
  // Healthcare
  HEALTHCARE_DOCTOR = 'healthcare-doctor',
  HEALTHCARE_NURSE = 'healthcare-nurse',
  HEALTHCARE_MEDICAL_ASSISTANT = 'healthcare-medical-assistant',

  // Engineering
  ENGINEERING_CIVIL = 'engineering-civil',
  ENGINEERING_MECHANICAL = 'engineering-mechanical',
  ENGINEERING_ELECTRICAL = 'engineering-electrical',

  // Technology
  TECH_SOFTWARE_ENGINEER = 'tech-software-engineer',
  TECH_FRONTEND_DEVELOPER = 'tech-frontend-developer',
  TECH_BACKEND_DEVELOPER = 'tech-backend-developer',
  TECH_FULLSTACK = 'tech-fullstack',
  TECH_ML_AI_ENGINEER = 'tech-ml-ai-engineer',
  TECH_DATA_SCIENTIST = 'tech-data-scientist',
  TECH_DEVOPS = 'tech-devops',

  // Design
  DESIGN_UI_UX = 'design-ui-ux',
  DESIGN_GRAPHIC = 'design-graphic',
  DESIGN_PRODUCT = 'design-product',

  // Business
  BUSINESS_MBA = 'business-mba',
  BUSINESS_ANALYST = 'business-analyst',
  BUSINESS_CONSULTANT = 'business-consultant',

  // Education
  EDUCATION_ARTS = 'education-arts',
  EDUCATION_SCIENCES = 'education-sciences',

  // Generic/ATS
  GENERIC_ATS_SIMPLE = 'generic-ats-simple',
  GENERIC_MODERN = 'generic-modern',
  GENERIC_CLASSIC = 'generic-classic',
}

/**
 * Industry categories for grouping templates
 */
export enum IndustryCategory {
  HEALTHCARE = 'healthcare',
  ENGINEERING = 'engineering',
  TECHNOLOGY = 'technology',
  DESIGN = 'design',
  BUSINESS = 'business',
  EDUCATION = 'education',
  GENERIC = 'generic',
}

/**
 * Skill categories for organization and filtering
 */
export enum SkillCategory {
  TECHNICAL = 'technical',
  SOFT = 'soft',
  LANGUAGE = 'language',
  TOOL = 'tool',
  FRAMEWORK = 'framework',
  OTHER = 'other',
}

/**
 * Skill proficiency levels
 */
export enum ProficiencyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

/**
 * Suggestion severity levels for AI recommendations
 */
export enum SuggestionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Types of AI suggestions
 */
export enum SuggestionType {
  CONTENT = 'content',
  FORMATTING = 'formatting',
  KEYWORD = 'keyword',
  ATS = 'ats',
  GRAMMAR = 'grammar',
  IMPACT = 'impact',
  STRUCTURE = 'structure',
}

/**
 * Export format options
 */
export enum ExportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  JSON = 'json',
  TXT = 'txt',
  HTML = 'html',
}

/**
 * Page size options for export
 */
export enum PageSize {
  A4 = 'a4',
  LETTER = 'letter',
  LEGAL = 'legal',
}

// ============================================================================
// Core Resume Types
// ============================================================================

/**
 * Location information for addresses
 */
export interface Location {
  city?: string;
  state?: string;
  country: string;
  zipCode?: string;
}

/**
 * Personal information section of the resume
 */
export interface PersonalInfo {
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  location?: Location;
  linkedIn?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
  professionalTitle?: string;
  profilePhoto?: string;
  customLinks?: { label: string; url: string }[];
}

/**
 * Work experience entry
 */
export interface Experience {
  id: string;
  company: string;
  position: string;
  location?: Location | string;
  startDate: Date | string;
  endDate?: Date | string;
  current: boolean;
  description?: string;
  bullets?: string[];
  achievements: string[];
  keywords?: string[];
  skillsUsed?: string[];
  order?: number;
}

/**
 * Education entry
 */
export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location?: Location | string;
  startDate: Date | string;
  endDate?: Date | string;
  current?: boolean;
  gpa?: number | string;
  maxGpa?: number;
  achievements?: string[];
  coursework?: string[];
  honors?: string[];
  order?: number;
}

/**
 * Skill entry with proficiency tracking
 */
export interface Skill {
  id?: string;
  name: string;
  category: SkillCategory | string;
  proficiency?: ProficiencyLevel | string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  years?: number;
  endorsed?: boolean;
  order?: number;
}

/**
 * Project entry for portfolio items
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  role?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  current?: boolean;
  technologies: string[];
  achievements?: string[];
  bullets?: string[];
  url?: string;
  github?: string;
  githubUrl?: string;
  order?: number;
}

/**
 * Certification entry
 */
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: Date | string;
  expiryDate?: Date | string;
  credentialId?: string;
  url?: string;
  order?: number;
}

/**
 * Language proficiency
 */
export interface Language {
  id?: string;
  name: string;
  proficiency: 'native' | 'fluent' | 'professional' | 'intermediate' | 'basic';
}

/**
 * Section visibility and ordering configuration
 */
export interface SectionConfig {
  id: string;
  visible: boolean;
  order: number;
}

/**
 * Resume design overrides selected in the builder UI.
 * These are optional and can layer on top of the base template.
 */
export interface ResumeDesign {
  colors?: {
    primary?: string;
    secondary?: string;
  };
  font?: string;
  layout?: {
    columns?: 1 | 2;
    spacing?: 'compact' | 'normal' | 'spacious';
  };
}

/**
 * Resume metadata for versioning and tracking
 */
export interface ResumeMetadata {
  version: number;
  isPublic: boolean;
  isFavorite?: boolean;
  tags?: string[];
  targetRole?: string;
  targetIndustry?: string[];
  lastAnalyzed?: Date;
  atsScore?: number;
  sectionOrder?: string[];
  sectionVisibility?: Record<string, boolean>;
  sectionConfigs?: SectionConfig[];
}

/**
 * Main resume document interface
 */
export interface Resume {
  id?: string;
  _id?: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  personalInfo: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects?: Project[];
  certifications?: Certification[];
  languages?: Language[];
  customSections?: CustomSection[];
  template: ResumeTemplate | string;
  design?: ResumeDesign;
  metadata?: ResumeMetadata;
  aiScore?: AIScore;
  lastAnalyzedAt?: Date;
}

/**
 * Custom section for flexible resume content
 */
export interface CustomSection {
  id?: string;
  title: string;
  content?: string | string[];
  items?: {
    title?: string;
    subtitle?: string;
    description?: string;
    date?: string;
    bullets?: string[];
  }[];
  order: number;
  type?: 'text' | 'list' | 'table';
}

// ============================================================================
// AI Analysis Types
// ============================================================================

/**
 * Individual score component of resume analysis
 */
export interface ScoreComponent {
  score: number; // 0-100
  weight: number; // Contribution to overall score
  details?: string;
}

/**
 * Detailed scoring breakdown
 */
export interface ResumeScores {
  content: ScoreComponent;
  formatting: ScoreComponent;
  keywords: ScoreComponent;
  ats: ScoreComponent;
  impact: ScoreComponent;
  grammar?: ScoreComponent;
}

/**
 * AI-generated suggestion for improvement
 */
export interface Suggestion {
  id: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  section: string; // Which resume section this applies to
  field?: string; // Specific field within section
  message: string;
  example?: string;
  beforeText?: string;
  afterText?: string;
  applied?: boolean;
}

/**
 * Legacy AI Score interface (for backward compatibility)
 */
export interface AIScore {
  overall: number;
  sections: {
    personalInfo: number;
    summary: number;
    experience: number;
    education: number;
    skills: number;
    formatting: number;
    keywords: number;
    impact: number;
  };
  atsCompatibility: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

/**
 * Comprehensive resume analysis from AI
 */
export interface ResumeAnalysis {
  resumeId: string;
  analyzedAt: Date;
  overallScore: number; // 0-100
  scores: ResumeScores;
  suggestions: Suggestion[];
  strengths: string[];
  weaknesses: string[];
  keywordAnalysis?: KeywordAnalysis;
  readabilityScore?: number;
  estimatedAtsPassRate?: number;
}

/**
 * Keyword analysis for ATS optimization
 */
export interface KeywordAnalysis {
  totalKeywords: number;
  uniqueKeywords: number;
  keywordDensity: number;
  topKeywords: KeywordFrequency[];
  missingKeywords?: string[];
  overusedKeywords?: string[];
}

/**
 * Keyword frequency tracking
 */
export interface KeywordFrequency {
  keyword: string;
  word?: string;
  count: number;
  score?: number;
  relevance?: number;
}

/**
 * ATS (Applicant Tracking System) compatibility analysis
 */
export interface ATSCompatibility {
  score: number; // 0-100
  issues: ATSIssue[];
  recommendations: string[];
  keywordDensity: number;
  formattingScore: number;
  parseability: number;
  estimatedPassRate: number;
}

/**
 * Specific ATS issue detected
 */
export interface ATSIssue {
  id: string;
  severity: SuggestionSeverity;
  issue: string;
  solution: string;
  section?: string;
}

// ============================================================================
// Job Matching Types
// ============================================================================

/**
 * Job posting information (scraped or manually entered)
 */
export interface JobPosting {
  id?: string;
  url?: string;
  title: string;
  company: string;
  location?: Location | string;
  description: string;
  requirements: string[];
  responsibilities?: string[];
  qualifications?: string[];
  skills: string[];
  keywords: KeywordFrequency[];
  experienceLevel?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  scrapedAt?: Date;
  source?: string;
  salaryRange?: SalaryRange;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  benefits?: string[];
}

/**
 * Salary range information
 */
export interface SalaryRange {
  min?: number;
  max?: number;
  currency: string;
  period?: 'hourly' | 'monthly' | 'yearly';
}

/**
 * Job-to-resume matching result
 */
export interface JobMatch {
  jobId: string;
  resumeId: string;
  matchScore: number; // 0-100
  matchedSkills: SkillMatch[];
  missingSkills: string[];
  recommendations: string[];
  strengthAreas: string[];
  improvementAreas: string[];
  analyzedAt: Date;
}

/**
 * Legacy job match result (for backward compatibility)
 */
export interface JobMatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: {
    category: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  sectionScores: {
    skills: number;
    experience: number;
    education: number;
    overall: number;
  };
}

/**
 * Individual skill match information
 */
export interface SkillMatch {
  skill: string;
  resumeHas: boolean;
  jobRequires: boolean;
  proficiencyMatch?: boolean;
  importance?: 'required' | 'preferred' | 'nice-to-have';
}

/**
 * Skill gap analysis between resume and job requirements
 */
export interface SkillGap {
  requiredSkills: string[];
  currentSkills: string[];
  missingSkills: string[];
  partialMatches: PartialSkillMatch[];
  developmentPlan?: DevelopmentRecommendation[];
}

/**
 * Partial skill match (related but not exact)
 */
export interface PartialSkillMatch {
  requiredSkill: string;
  relatedSkills: string[];
  similarity: number; // 0-1
}

/**
 * Skill development recommendation
 */
export interface DevelopmentRecommendation {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: string;
  resources?: LearningResource[];
  rationale?: string;
}

/**
 * Learning resource for skill development
 */
export interface LearningResource {
  title: string;
  type: 'course' | 'book' | 'tutorial' | 'certification' | 'practice';
  url?: string;
  provider?: string;
  cost?: 'free' | 'paid';
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * Resume template configuration
 */
export interface TemplateConfig {
  id: string;
  name: string;
  category: ResumeTemplate | string;
  description: string;
  preview?: string;
  colors: TemplateColors;
  fonts: TemplateFonts;
  layout: TemplateLayout;
  isPremium?: boolean;
  atsScore?: number;
  features?: string[];
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
 * Template font configuration
 */
export interface TemplateFonts {
  heading: string;
  body: string;
  size: {
    heading: number;
    subheading: number;
    body: number;
    small: number;
  };
}

/**
 * Template layout configuration
 */
export interface TemplateLayout {
  columns: 1 | 2;
  spacing: 'compact' | 'normal' | 'spacious';
  sectionOrder: string[];
  showIcons?: boolean;
  showDividers?: boolean;
  headerStyle?: 'centered' | 'left' | 'split';
}

// ============================================================================
// Export Types
// ============================================================================

/**
 * Export configuration options
 */
export interface ExportOptions {
  format: ExportFormat | 'pdf' | 'docx' | 'txt';
  template?: ResumeTemplate | string;
  includePhoto?: boolean;
  pageSize?: PageSize;
  margins?: PageMargins;
  fileName?: string;
  watermark?: boolean;
  color?: boolean; // For PDF/DOCX - colored or black & white
  colorScheme?: string;
  fontSize?: 'small' | 'medium' | 'large';
}

/**
 * Page margin configuration
 */
export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
  unit: 'mm' | 'in' | 'px';
}

/**
 * Export result with metadata
 */
export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  url?: string;
  blob?: Blob;
  fileName: string;
  size?: number;
  error?: string;
  exportedAt: Date;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Resume creation input (for new resumes)
 */
export type CreateResumeInput = Omit<Resume, 'id' | '_id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

/**
 * Resume update input (partial updates allowed)
 */
export type UpdateResumeInput = Partial<Omit<Resume, 'id' | '_id' | 'userId' | 'createdAt'>> & {
  id: string;
};

/**
 * Resume section type for generic operations
 */
export type ResumeSection =
  | 'personalInfo'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'customSections';

/**
 * Section item types (union of all section item types)
 */
export type ResumeSectionItem =
  | Experience
  | Education
  | Skill
  | Project
  | Certification
  | Language
  | CustomSection;

/**
 * Resume filter options for queries
 */
export interface ResumeFilter {
  userId?: string;
  tags?: string[];
  template?: ResumeTemplate | string;
  isFavorite?: boolean;
  minAtsScore?: number;
  targetRole?: string;
  updatedAfter?: Date;
}

/**
 * Sorting options for resume lists
 */
export interface ResumeSortOptions {
  field: 'createdAt' | 'updatedAt' | 'title' | 'atsScore';
  direction: 'asc' | 'desc';
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Paginated resume result
 */
export interface PaginatedResumes {
  resumes: Resume[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * AI optimization request
 */
export interface OptimizationRequest {
  resumeId: string;
  targetJob?: JobPosting;
  focus?: ('ats' | 'keywords' | 'impact' | 'formatting')[];
  autoApply?: boolean;
}

/**
 * AI optimization result
 */
export interface OptimizationResult {
  resumeId: string;
  changes: OptimizationChange[];
  beforeScore: number;
  afterScore: number;
  estimatedImprovement: number;
  appliedAt?: Date;
}

/**
 * Individual optimization change
 */
export interface OptimizationChange {
  section: ResumeSection;
  field?: string;
  before: string;
  after: string;
  reason: string;
  impact: number; // Estimated score improvement
  applied: boolean;
}

/**
 * Bulk resume operations result
 */
export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a section item is an Experience
 */
export function isExperience(item: ResumeSectionItem): item is Experience {
  return 'company' in item && 'position' in item;
}

/**
 * Type guard to check if a section item is an Education
 */
export function isEducation(item: ResumeSectionItem): item is Education {
  return 'institution' in item && 'degree' in item;
}

/**
 * Type guard to check if a section item is a Skill
 */
export function isSkill(item: ResumeSectionItem): item is Skill {
  return 'name' in item && 'category' in item;
}

/**
 * Type guard to check if a section item is a Project
 */
export function isProject(item: ResumeSectionItem): item is Project {
  return 'name' in item && 'technologies' in item;
}

/**
 * Type guard to check if a section item is a Certification
 */
export function isCertification(item: ResumeSectionItem): item is Certification {
  return 'issuer' in item && 'name' in item;
}

/**
 * Type guard to check if a section item is a Language
 */
export function isLanguage(item: ResumeSectionItem): item is Language {
  return 'name' in item && 'proficiency' in item;
}