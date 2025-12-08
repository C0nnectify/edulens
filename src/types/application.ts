export interface Application {
  id: string;
  userId: string;
  universityName: string;
  programName: string;
  degreeLevel: 'undergraduate' | 'graduate' | 'phd' | 'postdoc';
  status: 'draft' | 'submitted' | 'under_review' | 'interview_scheduled' | 'accepted' | 'rejected' | 'waitlisted';
  deadline: string;
  submittedDate?: string;
  lastUpdated: string;
  portalUrl?: string;
  applicationFee?: number;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  tags: string[];
  documents: ApplicationDocument[];
  statusHistory: StatusUpdate[];
  aiInsights?: AIInsights;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  name: string;
  type: 'sop' | 'resume' | 'transcript' | 'lor' | 'portfolio' | 'certificate' | 'other';
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  isRequired: boolean;
  status: 'uploaded' | 'processing' | 'approved' | 'rejected';
  aiAnalysis?: DocumentAnalysis;
}

export interface StatusUpdate {
  id: string;
  applicationId: string;
  status: string;
  message?: string;
  source: 'manual' | 'portal_scrape' | 'email_parsing' | 'ai_detection';
  timestamp: string;
  metadata?: any;
}

export interface AIInsights {
  id: string;
  applicationId: string;
  competitivenessScore: number; // 1-100
  recommendationScore: number; // 1-100
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  similarApplications: string[];
  predictedOutcome: 'likely_accept' | 'possible_accept' | 'unlikely_accept';
  confidence: number; // 0-1
  lastAnalyzed: string;
}

export interface DocumentAnalysis {
  id: string;
  documentId: string;
  qualityScore: number; // 1-100
  completenessScore: number; // 1-100
  suggestions: string[];
  issues: string[];
  analyzedAt: string;
}

export interface ApplicationFilters {
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  degreeLevel?: string;
  priority?: string;
  tags?: string[];
}

export interface ApplicationAnalytics {
  overview: {
    totalApplications: number;
    acceptedCount: number;
    rejectedCount: number;
    successRate: number;
    responseRate: number;
    averageFee: number;
    recentActivity: number;
    upcomingDeadlines: number;
  };
  statusDistribution: Record<string, number>;
  degreeLevelDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  universityDistribution: Record<string, number>;
  timelineData: Array<{
    id: string;
    university: string;
    status: string;
    submittedDate?: string;
    lastUpdated: string;
    daysToResponse: number;
  }>;
  documentStats: {
    averageCompletion: number;
    details: Array<{
      id: string;
      university: string;
      totalDocuments: number;
      uploadedDocuments: number;
      completionRate: number;
    }>;
  };
  insights: {
    mostAppliedUniversity: string;
    averageResponseTime: number;
    totalFeesSpent: number;
    applicationsInProgress: number;
    interviewsScheduled: number;
  };
}

export interface CreateApplicationDto {
  universityName: string;
  programName: string;
  degreeLevel: 'undergraduate' | 'graduate' | 'phd' | 'postdoc';
  deadline: string;
  portalUrl?: string;
  applicationFee?: number;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  tags?: string[];
}

export interface UpdateApplicationDto {
  universityName?: string;
  programName?: string;
  degreeLevel?: 'undergraduate' | 'graduate' | 'phd' | 'postdoc';
  status?: 'draft' | 'submitted' | 'under_review' | 'interview_scheduled' | 'accepted' | 'rejected' | 'waitlisted';
  deadline?: string;
  submittedDate?: string;
  portalUrl?: string;
  applicationFee?: number;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  tags?: string[];
}

export interface DuplicateApplicationDto {
  modifications?: Partial<CreateApplicationDto>;
}
