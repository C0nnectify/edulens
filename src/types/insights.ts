/**
 * TypeScript Types for AI Insights Dashboard
 *
 * Comprehensive type definitions for the AI-powered insights system
 * that provides admission predictions, profile analysis, and recommendations.
 */

/**
 * Priority levels for recommendations and action items
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * Effort levels required to implement recommendations
 */
export type EffortLevel = 'low' | 'medium' | 'high';

/**
 * Application category based on admission probability
 */
export type ApplicationCategory = 'reach' | 'target' | 'safety';

/**
 * Profile categories for analysis
 */
export type ProfileCategory = 'gpa' | 'test_scores' | 'research' | 'experience' | 'essays' | 'lors';

/**
 * Timeline milestone types
 */
export type MilestoneType = 'gre_prep' | 'sop_writing' | 'lor_requests' | 'applications' | 'interviews' | 'other';

/**
 * Key factor influencing admission probability
 */
export interface KeyFactor {
  category: ProfileCategory;
  name: string;
  impact: number; // -100 to 100, negative = hurts chances, positive = helps
  description: string;
}

/**
 * Admission prediction for a specific university/program
 */
export interface AdmissionPrediction {
  universityId: string;
  universityName: string;
  programName: string;
  probability: number; // 0-100
  confidenceInterval: [number, number]; // [lower, upper] bounds
  category: ApplicationCategory;
  keyFactors: KeyFactor[];
  historicalDataPoints?: number; // Number of similar profiles analyzed
  lastUpdated: Date;
}

/**
 * Profile strength in a specific category
 */
export interface ProfileStrength {
  id: string;
  category: ProfileCategory;
  title: string;
  description: string;
  percentile: number; // 0-100, compared to admitted students
  score: number; // Normalized 0-100
  evidence: string[]; // Supporting data points
  impact: number; // Estimated impact on admission chances (0-100)
}

/**
 * Profile weakness or gap
 */
export interface ProfileWeakness {
  id: string;
  category: ProfileCategory;
  title: string;
  description: string;
  percentile: number; // 0-100, compared to admitted students
  score: number; // Normalized 0-100
  gap: number; // How far behind the average (-100 to 0)
  impact: number; // Estimated negative impact on admission chances (0-100)
  addressable: boolean; // Can this be improved before application deadline?
}

/**
 * Actionable recommendation to improve profile
 */
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  effort: EffortLevel;
  potentialImpact: number; // Estimated improvement to admission chances (0-100)
  category: ProfileCategory;
  timeline: string; // "2-3 months", "Before December 2025", etc.
  actionItems: string[];
  relatedWeaknesses: string[]; // IDs of weaknesses this addresses
  completed: boolean;
  completedDate?: Date;
}

/**
 * Faculty member match at a specific university
 */
export interface FacultyMatch {
  id: string;
  universityId: string;
  universityName: string;
  name: string;
  title: string;
  department: string;
  email?: string;
  profileUrl?: string;
  matchScore: number; // 0-100
  matchReasoning: string;
  researchAreas: string[];
  recentPublications: Publication[];
  acceptingStudents: boolean;
  fundingAvailable: boolean;
  addedToApplication: boolean;
}

/**
 * Research publication
 */
export interface Publication {
  title: string;
  year: number;
  venue: string;
  url?: string;
  citations?: number;
}

/**
 * Timeline milestone or task
 */
export interface TimelineSuggestion {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  deadline?: Date;
  completed: boolean;
  completedDate?: Date;
  priority: Priority;
  dependencies?: string[]; // IDs of milestones that must be completed first
  estimatedHours?: number;
}

/**
 * Profile comparison data point
 */
export interface ProfileComparison {
  category: ProfileCategory;
  categoryLabel: string;
  userScore: number; // 0-100
  averageScore: number; // 0-100
  admittedAverageScore: number; // 0-100
  percentile: number; // User's percentile among applicants
}

/**
 * Success factor breakdown for a program
 */
export interface SuccessFactor {
  category: ProfileCategory;
  categoryLabel: string;
  importance: number; // 0-100, how important this is for admission
  description: string;
  userScore: number; // User's performance in this category
}

/**
 * Overall insights summary
 */
export interface OverallInsights {
  profileScore: number; // 0-100, overall profile strength
  admissionProbabilityAverage: number; // Average across all applications
  totalApplications: number;
  reachCount: number;
  targetCount: number;
  safetyCount: number;
  topStrengths: ProfileStrength[]; // Top 3
  criticalWeaknesses: ProfileWeakness[]; // Top 3
  nextActions: Recommendation[]; // Top 5 most impactful
  lastAnalyzed: Date;
  dataCompleteness: number; // 0-100, how complete the user's profile is
}

/**
 * Historical trend data point
 */
export interface TrendDataPoint {
  date: Date;
  probability: number;
  event?: string; // "GRE score improved", "Published paper", etc.
  eventType?: 'positive' | 'negative' | 'neutral';
}

/**
 * Scenario forecast
 */
export interface ScenarioForecast {
  id: string;
  name: string;
  description: string;
  assumptions: string[];
  predictedProbability: number;
  probabilityDelta: number; // Change from current
  confidenceInterval: [number, number];
  feasibility: EffortLevel;
  timeline: string;
}

/**
 * Complete AI insights data structure
 */
export interface AIInsights {
  userId: string;
  overall: OverallInsights;
  strengths: ProfileStrength[];
  weaknesses: ProfileWeakness[];
  recommendations: Recommendation[];
  facultyMatches: FacultyMatch[];
  timeline: TimelineSuggestion[];
  predictions: AdmissionPrediction[];
  comparisons: ProfileComparison[];
  successFactors: SuccessFactor[];
  trends?: TrendDataPoint[];
  scenarios?: ScenarioForecast[];
  generatedAt: Date;
  expiresAt: Date; // Insights should be refreshed after this
}

/**
 * Per-application insights summary
 */
export interface ApplicationInsights {
  applicationId: string;
  universityName: string;
  programName: string;
  prediction: AdmissionPrediction;
  topStrength: ProfileStrength;
  topWeakness: ProfileWeakness;
  relevantRecommendations: Recommendation[];
  facultyMatches: FacultyMatch[];
  successFactors: SuccessFactor[];
}

/**
 * Insight notification
 */
export interface InsightNotification {
  id: string;
  type: 'new_insight' | 'probability_change' | 'recommendation' | 'deadline_alert' | 'faculty_match';
  severity: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Export options for insights report
 */
export interface ExportOptions {
  format: 'pdf' | 'json';
  includeSections: {
    overview: boolean;
    strengths: boolean;
    weaknesses: boolean;
    recommendations: boolean;
    facultyMatches: boolean;
    timeline: boolean;
    charts: boolean;
  };
  applications?: string[]; // Specific application IDs to include
  emailTo?: string;
}

/**
 * API request to refresh insights
 */
export interface RefreshInsightsRequest {
  userId: string;
  applicationIds?: string[]; // Refresh specific applications only
  forceRecalculation?: boolean; // Ignore cache
}

/**
 * API response for insights generation
 */
export interface InsightsGenerationResponse {
  success: boolean;
  insights?: AIInsights;
  error?: string;
  processingTime?: number; // milliseconds
  cached?: boolean;
}

/**
 * Chart data formats
 */
export interface RadarChartData {
  category: string;
  user: number;
  average: number;
  admitted: number;
}

export interface LineChartData {
  date: string;
  probability: number;
  event?: string;
}

export interface BarChartData {
  category: string;
  value: number;
  average: number;
  label: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}
