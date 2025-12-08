/**
 * API client for resume operations
 */

import type {
  Resume,
  ResumeAnalysis,
  JobPosting,
  JobMatchResult,
  ExportOptions,
  ExportResult,
  TemplateConfig,
  OptimizationResult,
  Suggestion,
} from '@/types/resume';

// Base API URL
const API_BASE = '/api/resume';

// Error handling helper
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `API error: ${response.statusText}`);
  }
  return response.json();
}

// Resume CRUD operations
export const resumeApi = {
  // List all resumes for the current user
  async listResumes(): Promise<Resume[]> {
    const response = await fetch(API_BASE);
    return handleResponse<Resume[]>(response);
  },

  // Get a single resume by ID
  async getResume(id: string): Promise<Resume> {
    const response = await fetch(`${API_BASE}/${id}`);
    return handleResponse<Resume>(response);
  },

  // Create a new resume
  async createResume(resume: Partial<Resume>): Promise<Resume> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resume),
    });
    return handleResponse<Resume>(response);
  },

  // Update an existing resume
  async updateResume(id: string, updates: Partial<Resume>): Promise<Resume> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse<Resume>(response);
  },

  // Delete a resume
  async deleteResume(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete resume');
    }
  },

  // Duplicate a resume
  async duplicateResume(id: string): Promise<Resume> {
    const response = await fetch(`${API_BASE}/${id}/duplicate`, {
      method: 'POST',
    });
    return handleResponse<Resume>(response);
  },
};

// AI Analysis operations
export const analysisApi = {
  // Analyze resume with AI
  async analyzeResume(resumeId: string): Promise<ResumeAnalysis> {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId }),
    });
    return handleResponse<ResumeAnalysis>(response);
  },

  // Get optimization suggestions
  async optimizeResume(
    resumeId: string,
    targetJob?: JobPosting
  ): Promise<OptimizationResult> {
    const response = await fetch(`${API_BASE}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId, targetJob }),
    });
    return handleResponse<OptimizationResult>(response);
  },

  // Apply a suggestion to the resume
  async applySuggestion(
    resumeId: string,
    suggestionId: string
  ): Promise<Resume> {
    const response = await fetch(`${API_BASE}/${resumeId}/suggestions/${suggestionId}/apply`, {
      method: 'POST',
    });
    return handleResponse<Resume>(response);
  },
};

// Job matching operations
export const jobMatchApi = {
  // Match resume to job description
  async matchJob(
    resumeId: string,
    jobDescription: string,
    jobUrl?: string
  ): Promise<JobMatchResult> {
    const response = await fetch(`${API_BASE}/match-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId, jobDescription, jobUrl }),
    });
    return handleResponse<JobMatchResult>(response);
  },

  // Scrape job posting from URL (using Firecrawl)
  async scrapeJob(url: string): Promise<JobPosting> {
    const response = await fetch('/api/jobs/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return handleResponse<JobPosting>(response);
  },
};

// Template operations
export const templateApi = {
  // Get all available templates
  async getTemplates(): Promise<TemplateConfig[]> {
    const response = await fetch(`${API_BASE}/templates`);
    return handleResponse<TemplateConfig[]>(response);
  },

  // Get a specific template
  async getTemplate(id: string): Promise<TemplateConfig> {
    const response = await fetch(`${API_BASE}/templates/${id}`);
    return handleResponse<TemplateConfig>(response);
  },
};

// Export operations
export const exportApi = {
  // Export resume to specified format
  async exportResume(
    resumeId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const response = await fetch(`${API_BASE}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId, options }),
    });
    return handleResponse<ExportResult>(response);
  },

  // Download exported resume
  async downloadResume(resumeId: string, format: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/${resumeId}/download?format=${format}`);
    if (!response.ok) {
      throw new Error('Failed to download resume');
    }
    return response.blob();
  },
};
