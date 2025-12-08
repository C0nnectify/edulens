export interface UniversityRequirements {
  id: string;
  universityId: string;
  universityName: string;
  programId?: string;
  programName?: string;
  degreeLevel: 'undergraduate' | 'graduate' | 'phd' | 'postdoc';
  documents: DocumentRequirement[];
  specialInstructions?: string;
  scrapedAt: string;
  lastVerified?: string;
  source: 'scraped' | 'manual' | 'user_submitted';
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRequirement {
  id: string;
  type: 'sop' | 'resume' | 'transcript' | 'lor' | 'writing_sample' | 'portfolio' | 'test_scores' | 'other';
  name: string; // Display name
  required: boolean;
  formats: string[]; // ['PDF', 'DOCX']
  maxSizeMB?: number;
  maxPages?: number;
  minPages?: number;
  wordCountMin?: number;
  wordCountMax?: number;
  instructions?: string;
  examples?: string[]; // URLs to example docs
  notes?: string;
}

export interface DocumentValidation {
  documentId: string;
  validations: ValidationResult[];
  overallStatus: 'valid' | 'has_warnings' | 'invalid';
  validatedAt: string;
}

export interface ValidationResult {
  type: 'format' | 'size' | 'content' | 'requirements' | 'pages' | 'word_count';
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: any;
  suggestion?: string;
}

export interface CreateRequirementsDto {
  universityId: string;
  universityName: string;
  programId?: string;
  programName?: string;
  degreeLevel: 'undergraduate' | 'graduate' | 'phd' | 'postdoc';
  documents: Omit<DocumentRequirement, 'id'>[];
  specialInstructions?: string;
  source?: 'manual' | 'user_submitted';
}

export interface UpdateRequirementsDto {
  documents?: Omit<DocumentRequirement, 'id'>[];
  specialInstructions?: string;
  lastVerified?: string;
}

export interface DocumentChecklist {
  applicationId: string;
  requirements: Array<{
    requirement: DocumentRequirement;
    status: 'pending' | 'uploaded' | 'validated' | 'approved' | 'rejected';
    uploadedDocument?: {
      id: string;
      name: string;
      fileUrl: string;
      uploadedAt: string;
    };
    validation?: DocumentValidation;
  }>;
  completionPercentage: number;
  missingRequired: DocumentRequirement[];
  missingOptional: DocumentRequirement[];
}
