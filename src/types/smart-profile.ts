/**
 * SmartProfile - Single Source of Truth for User Data
 * 
 * This is the comprehensive user profile that serves as the central data store.
 * All components (Roadmap, Documents, Tracker, Applications) derive from this.
 * 
 * Features:
 * - Version tracking for sync operations
 * - Section-level timestamps for granular updates
 * - Bidirectional sync with Chat Controller
 */

// ============================================
// CORE TYPES
// ============================================

export interface VersionMetadata {
  version: number;
  lastModified: Date;
  modifiedBy: 'user' | 'chat' | 'import' | 'system';
  changeLog?: string[];
}

export interface SectionTimestamp {
  updatedAt: Date;
  updatedBy: 'user' | 'chat' | 'import' | 'system';
  syncedToRoadmap: boolean;
  lastSyncAt?: Date;
}

// ============================================
// PERSONAL INFORMATION
// ============================================

export interface PersonalInfo {
  _meta: SectionTimestamp;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth?: Date;
  nationality: string;
  countryOfResidence: string;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  pronouns?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
}

export interface ContactInfo {
  _meta: SectionTimestamp;
  email: string;
  phone?: string;
  alternateEmail?: string;
  address?: {
    street?: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
  };
  timezone?: string;
}

// ============================================
// EDUCATION
// ============================================

export interface EducationEntry {
  id: string;
  institution: string;
  institutionLocation?: {
    city: string;
    country: string;
  };
  degree: string;
  degreeType: 'bachelors' | 'masters' | 'phd' | 'associate' | 'diploma' | 'certificate' | 'other';
  major: string;
  minor?: string;
  gpa?: number;
  gpaScale?: number; // e.g., 4.0, 10.0, 100
  startDate: Date;
  endDate?: Date;
  isCurrently: boolean;
  honors?: string[];
  relevantCoursework?: string[];
  thesis?: {
    title: string;
    advisor?: string;
    abstract?: string;
  };
  ranking?: string; // e.g., "Top 10%"
}

export interface Education {
  _meta: SectionTimestamp;
  entries: EducationEntry[];
  highestDegree?: string;
}

// ============================================
// TEST SCORES
// ============================================

export interface GREScore {
  verbal?: number;
  quantitative?: number;
  analyticalWriting?: number;
  totalScore?: number;
  testDate?: Date;
  plannedDate?: Date;
  status: 'not-planned' | 'planned' | 'completed';
}

export interface TOEFLScore {
  reading?: number;
  listening?: number;
  speaking?: number;
  writing?: number;
  totalScore?: number;
  testDate?: Date;
  plannedDate?: Date;
  status: 'not-planned' | 'planned' | 'completed';
}

export interface IELTSScore {
  reading?: number;
  listening?: number;
  speaking?: number;
  writing?: number;
  overallBand?: number;
  testDate?: Date;
  plannedDate?: Date;
  status: 'not-planned' | 'planned' | 'completed';
}

export interface GMATScore {
  verbal?: number;
  quantitative?: number;
  integratedReasoning?: number;
  analyticalWriting?: number;
  totalScore?: number;
  testDate?: Date;
  plannedDate?: Date;
  status: 'not-planned' | 'planned' | 'completed';
}

export interface TestScores {
  _meta: SectionTimestamp;
  gre?: GREScore;
  toefl?: TOEFLScore;
  ielts?: IELTSScore;
  gmat?: GMATScore;
  otherTests?: {
    name: string;
    score: string;
    testDate?: Date;
  }[];
}

// ============================================
// WORK EXPERIENCE
// ============================================

export interface WorkExperienceEntry {
  id: string;
  company: string;
  companyLocation?: {
    city: string;
    country: string;
  };
  position: string;
  employmentType: 'full-time' | 'part-time' | 'internship' | 'contract' | 'freelance';
  startDate: Date;
  endDate?: Date;
  isCurrently: boolean;
  responsibilities: string[];
  achievements?: string[];
  skills?: string[];
  supervisor?: {
    name: string;
    title?: string;
    email?: string;
    canContact: boolean;
  };
}

export interface WorkExperience {
  _meta: SectionTimestamp;
  entries: WorkExperienceEntry[];
  totalYearsExperience?: number;
}

// ============================================
// RESEARCH EXPERIENCE
// ============================================

export interface ResearchEntry {
  id: string;
  title: string;
  institution: string;
  role: 'principal-investigator' | 'co-investigator' | 'research-assistant' | 'lab-member' | 'other';
  advisor?: {
    name: string;
    title?: string;
    email?: string;
    canContact: boolean;
  };
  startDate: Date;
  endDate?: Date;
  isCurrently: boolean;
  description: string;
  methodology?: string[];
  outcomes?: string[];
  publications?: string[];
  presentations?: string[];
  fundingSource?: string;
  skills?: string[];
}

export interface Research {
  _meta: SectionTimestamp;
  entries: ResearchEntry[];
  researchInterests: string[];
  preferredMethodologies?: string[];
}

// ============================================
// PUBLICATIONS
// ============================================

export interface PublicationEntry {
  id: string;
  title: string;
  authors: string[];
  authorPosition: number; // 1 for first author, etc.
  type: 'journal' | 'conference' | 'book-chapter' | 'thesis' | 'preprint' | 'other';
  venue: string;
  year: number;
  doi?: string;
  url?: string;
  abstract?: string;
  citations?: number;
  impactFactor?: number;
  status: 'published' | 'accepted' | 'under-review' | 'in-preparation';
}

export interface Publications {
  _meta: SectionTimestamp;
  entries: PublicationEntry[];
  totalPublications?: number;
  hIndex?: number;
}

// ============================================
// AWARDS & ACHIEVEMENTS
// ============================================

export interface AwardEntry {
  id: string;
  title: string;
  issuer: string;
  date: Date;
  description?: string;
  type: 'academic' | 'research' | 'professional' | 'community' | 'competition' | 'scholarship' | 'fellowship' | 'other';
  monetary?: {
    amount: number;
    currency: string;
  };
  url?: string;
}

export interface Awards {
  _meta: SectionTimestamp;
  entries: AwardEntry[];
}

// ============================================
// SKILLS & CERTIFICATIONS
// ============================================

export interface SkillEntry {
  name: string;
  category: 'technical' | 'language' | 'soft' | 'domain' | 'tool';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  url?: string;
}

export interface Skills {
  _meta: SectionTimestamp;
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  languages: {
    language: string;
    proficiency: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
  }[];
}

// ============================================
// EXTRACURRICULAR ACTIVITIES
// ============================================

export interface ActivityEntry {
  id: string;
  organization: string;
  role: string;
  type: 'leadership' | 'volunteer' | 'club' | 'sports' | 'arts' | 'community' | 'professional' | 'other';
  startDate: Date;
  endDate?: Date;
  isCurrently: boolean;
  description: string;
  achievements?: string[];
  hoursPerWeek?: number;
}

export interface Activities {
  _meta: SectionTimestamp;
  entries: ActivityEntry[];
}

// ============================================
// LETTERS OF RECOMMENDATION
// ============================================

export interface LORContact {
  id: string;
  name: string;
  title: string;
  institution: string;
  email: string;
  phone?: string;
  relationship: 'professor' | 'research-advisor' | 'employer' | 'mentor' | 'other';
  relationshipDescription: string;
  yearsKnown: number;
  capacity: string; // In what capacity do they know you
  status: 'not-contacted' | 'contacted' | 'agreed' | 'submitted' | 'declined';
  notes?: string;
  deadlineReminders?: Date[];
  universities?: string[]; // Which schools this LOR is for
}

export interface LORTracking {
  _meta: SectionTimestamp;
  contacts: LORContact[];
  totalNeeded?: number;
  totalSecured?: number;
}

// ============================================
// FINANCIAL INFORMATION
// ============================================

export interface FinancialDetails {
  _meta: SectionTimestamp;
  budget: {
    totalBudget?: number;
    currency: string;
    includesLiving: boolean;
  };
  fundingPreferences: {
    needFullFunding: boolean;
    acceptPartialFunding: boolean;
    canSelfFund: boolean;
    selfFundAmount?: number;
  };
  scholarshipsApplied?: {
    name: string;
    status: 'researching' | 'applying' | 'submitted' | 'awarded' | 'rejected';
    amount?: number;
    deadline?: Date;
  }[];
  financialAid?: {
    hasApplied: boolean;
    fafsaCompleted?: boolean;
    cssProfileCompleted?: boolean;
  };
}

// ============================================
// APPLICATION GOALS
// ============================================

export interface TargetProgram {
  id: string;
  university: string;
  universityRanking?: number;
  program: string;
  degree: 'masters' | 'phd' | 'mba' | 'jd' | 'md' | 'other';
  department?: string;
  deadline: Date;
  priority: 'dream' | 'target' | 'safety';
  status: 'researching' | 'preparing' | 'in-progress' | 'submitted' | 'interview' | 'accepted' | 'rejected' | 'waitlisted' | 'enrolled' | 'declined';
  facultyOfInterest?: {
    name: string;
    researchArea: string;
    contacted: boolean;
    contactDate?: Date;
    response?: string;
  }[];
  applicationFee?: number;
  requirements?: {
    gre: boolean;
    toefl: boolean;
    ielts: boolean;
    writingSample: boolean;
    portfolio: boolean;
    interview: boolean;
    otherRequirements?: string[];
  };
  documents?: {
    sop: { status: 'not-started' | 'drafting' | 'review' | 'final'; documentId?: string };
    resume: { status: 'not-started' | 'drafting' | 'review' | 'final'; documentId?: string };
    writingSample?: { status: 'not-started' | 'drafting' | 'review' | 'final'; documentId?: string };
    diversityStatement?: { status: 'not-started' | 'drafting' | 'review' | 'final'; documentId?: string };
  };
  notes?: string;
}

export interface ApplicationGoals {
  _meta: SectionTimestamp;
  targetSeason: string; // e.g., "Fall 2025"
  targetYear: number;
  targetDegree: 'masters' | 'phd' | 'mba' | 'jd' | 'md' | 'other';
  targetCountries: string[];
  targetFields: string[];
  programs: TargetProgram[];
  totalTargetPrograms?: number;
}

// ============================================
// READINESS & TIMELINE
// ============================================

export interface ApplicationReadiness {
  _meta: SectionTimestamp;
  overallReadiness: number; // 0-100
  sectionReadiness: {
    profile: number;
    education: number;
    testScores: number;
    research: number;
    workExperience: number;
    documents: number;
    recommendations: number;
    schools: number;
    finances: number;
  };
  milestones: {
    id: string;
    title: string;
    description?: string;
    targetDate: Date;
    completedDate?: Date;
    status: 'pending' | 'in-progress' | 'completed' | 'overdue';
    category: 'test' | 'document' | 'application' | 'research' | 'networking' | 'other';
  }[];
  nextDeadline?: {
    title: string;
    date: Date;
    university?: string;
  };
}

// ============================================
// SYNC LOG
// ============================================

export interface SyncLogEntry {
  id: string;
  timestamp: Date;
  source: 'chat' | 'manual' | 'import' | 'roadmap';
  action: 'create' | 'update' | 'delete';
  section: string;
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
  description: string;
  syncedToRoadmap: boolean;
  syncedAt?: Date;
}

export interface SyncLog {
  entries: SyncLogEntry[];
  lastFullSync?: Date;
  pendingChanges: number;
}

// ============================================
// SMART PROFILE - MAIN TYPE
// ============================================

export interface SmartProfile {
  // Metadata
  _id: string;
  userId: string;
  version: VersionMetadata;
  createdAt: Date;
  updatedAt: Date;
  
  // Personal
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  
  // Academic
  education: Education;
  testScores: TestScores;
  research: Research;
  publications: Publications;
  
  // Professional
  workExperience: WorkExperience;
  skills: Skills;
  activities: Activities;
  awards: Awards;
  
  // Application Materials
  lorTracking: LORTracking;
  applicationGoals: ApplicationGoals;
  
  // Financial
  financialDetails: FinancialDetails;
  
  // Readiness
  readiness: ApplicationReadiness;
  
  // Sync
  syncLog: SyncLog;
  
  // Flags
  isProfileComplete: boolean;
  profileCompleteness: number; // 0-100
  lastChatSync?: Date;
  lastRoadmapSync?: Date;
}

// ============================================
// PROFILE UPDATE TYPES
// ============================================

export interface ProfileUpdateRequest {
  section: keyof Omit<SmartProfile, '_id' | 'userId' | 'version' | 'createdAt' | 'updatedAt' | 'syncLog'>;
  data: Partial<SmartProfile[keyof SmartProfile]>;
  source: 'user' | 'chat' | 'import' | 'system';
  syncToRoadmap?: boolean;
}

export interface ProfileUpdateResult {
  success: boolean;
  updatedSection: string;
  newVersion: number;
  syncedToRoadmap: boolean;
  error?: string;
}

export interface ChatExtractionResult {
  extractedFields: {
    section: string;
    field: string;
    value: unknown;
    confidence: number;
  }[];
  suggestedUpdates: ProfileUpdateRequest[];
  requiresConfirmation: boolean;
  message: string;
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createDefaultSectionTimestamp(): SectionTimestamp {
  return {
    updatedAt: new Date(),
    updatedBy: 'system',
    syncedToRoadmap: false,
  };
}

export function createEmptySmartProfile(userId: string): SmartProfile {
  const defaultMeta = createDefaultSectionTimestamp();
  
  return {
    _id: '',
    userId,
    version: {
      version: 1,
      lastModified: new Date(),
      modifiedBy: 'system',
      changeLog: ['Profile created'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    
    personalInfo: {
      _meta: defaultMeta,
      firstName: '',
      lastName: '',
      nationality: '',
      countryOfResidence: '',
    },
    
    contactInfo: {
      _meta: defaultMeta,
      email: '',
    },
    
    education: {
      _meta: defaultMeta,
      entries: [],
    },
    
    testScores: {
      _meta: defaultMeta,
    },
    
    research: {
      _meta: defaultMeta,
      entries: [],
      researchInterests: [],
    },
    
    publications: {
      _meta: defaultMeta,
      entries: [],
    },
    
    workExperience: {
      _meta: defaultMeta,
      entries: [],
    },
    
    skills: {
      _meta: defaultMeta,
      skills: [],
      certifications: [],
      languages: [],
    },
    
    activities: {
      _meta: defaultMeta,
      entries: [],
    },
    
    awards: {
      _meta: defaultMeta,
      entries: [],
    },
    
    lorTracking: {
      _meta: defaultMeta,
      contacts: [],
    },
    
    applicationGoals: {
      _meta: defaultMeta,
      targetSeason: '',
      targetYear: new Date().getFullYear() + 1,
      targetDegree: 'masters',
      targetCountries: [],
      targetFields: [],
      programs: [],
    },
    
    financialDetails: {
      _meta: defaultMeta,
      budget: {
        currency: 'USD',
        includesLiving: true,
      },
      fundingPreferences: {
        needFullFunding: false,
        acceptPartialFunding: true,
        canSelfFund: false,
      },
    },
    
    readiness: {
      _meta: defaultMeta,
      overallReadiness: 0,
      sectionReadiness: {
        profile: 0,
        education: 0,
        testScores: 0,
        research: 0,
        workExperience: 0,
        documents: 0,
        recommendations: 0,
        schools: 0,
        finances: 0,
      },
      milestones: [],
    },
    
    syncLog: {
      entries: [],
      pendingChanges: 0,
    },
    
    isProfileComplete: false,
    profileCompleteness: 0,
  };
}

// ============================================
// UTILITY TYPES
// ============================================

export type SmartProfileSection = keyof Pick<SmartProfile, 
  'personalInfo' | 'contactInfo' | 'education' | 'testScores' | 
  'research' | 'publications' | 'workExperience' | 'skills' | 
  'activities' | 'awards' | 'lorTracking' | 'applicationGoals' | 
  'financialDetails' | 'readiness'
>;

export type ProfileUpdateSource = 'user' | 'chat' | 'import' | 'system';

// Re-export for convenience
export type { UserProfile } from './profile';
