import { 
  Application, 
  ApplicationFilters, 
  CreateApplicationDto, 
  UpdateApplicationDto, 
  DuplicateApplicationDto,
  ApplicationAnalytics,
  AIInsights
} from '@/types/application';

const API_BASE_URL = '/api/applications';

export class ApplicationService {
  // Get all applications with optional filters
  static async getApplications(filters?: ApplicationFilters): Promise<{
    applications: Application[];
    total: number;
    filters: ApplicationFilters;
  }> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.statusText}`);
    }

    const result = await response.json();
    // Handle wrapped response from successResponse helper
    return result.data || result;
  }

  // Get a specific application by ID
  static async getApplication(id: string): Promise<Application> {
    const response = await fetch(`${API_BASE_URL}/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch application: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  // Create a new application
  static async createApplication(data: CreateApplicationDto): Promise<Application> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = `Failed to create application: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    // Handle both direct response and wrapped response
    return result.data || result;
  }

  // Update an existing application
  static async updateApplication(id: string, data: UpdateApplicationDto): Promise<Application> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update application: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  // Delete an application
  static async deleteApplication(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete application: ${response.statusText}`);
    }
  }

  // Duplicate an application
  static async duplicateApplication(id: string, modifications?: DuplicateApplicationDto): Promise<Application> {
    const response = await fetch(`${API_BASE_URL}/${id}/duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modifications),
    });

    if (!response.ok) {
      throw new Error(`Failed to duplicate application: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  // Get AI insights for an application
  static async getAIInsights(id: string): Promise<AIInsights> {
    const response = await fetch(`${API_BASE_URL}/${id}/insights`);

    if (!response.ok) {
      throw new Error(`Failed to fetch AI insights: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  // Trigger AI analysis for an application
  static async triggerAIAnalysis(id: string): Promise<{
    message: string;
    insights: AIInsights;
    processingTime: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/${id}/insights`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger AI analysis: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  // Get application analytics
  static async getAnalytics(): Promise<ApplicationAnalytics> {
    const response = await fetch(`${API_BASE_URL}/analytics`);

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  // Export applications data
  static async exportApplications(format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export?format=${format}`);
    
    if (!response.ok) {
      throw new Error(`Failed to export applications: ${response.statusText}`);
    }

    return response.blob();
  }
}

// Utility functions for application management
export const ApplicationUtils = {
  // Get status badge configuration
  getStatusConfig: (status: string) => {
    const configs = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: 'Edit' },
      submitted: { color: 'bg-blue-100 text-blue-800', icon: 'Clock' },
      under_review: { color: 'bg-yellow-100 text-yellow-800', icon: 'AlertCircle' },
      interview_scheduled: { color: 'bg-purple-100 text-purple-800', icon: 'Calendar' },
      accepted: { color: 'bg-green-100 text-green-800', icon: 'CheckCircle' },
      rejected: { color: 'bg-red-100 text-red-800', icon: 'XCircle' },
      waitlisted: { color: 'bg-orange-100 text-orange-800', icon: 'Clock' },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  },

  // Get priority badge configuration
  getPriorityConfig: (priority: string) => {
    const configs = {
      high: { color: 'bg-red-100 text-red-800' },
      medium: { color: 'bg-yellow-100 text-yellow-800' },
      low: { color: 'bg-green-100 text-green-800' },
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  },

  // Check if deadline is near (within 7 days)
  isDeadlineNear: (deadline: string): boolean => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
  },

  // Format date for display
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Calculate days until deadline
  getDaysUntilDeadline: (deadline: string): number => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  },

  // Get document completion percentage
  getDocumentCompletion: (documents: any[]): number => {
    if (documents.length === 0) return 0;
    const uploadedCount = documents.filter(doc => doc.status === 'uploaded').length;
    return Math.round((uploadedCount / documents.length) * 100);
  },

  // Get status progression
  getStatusProgression: (status: string): number => {
    const progression = {
      draft: 0,
      submitted: 20,
      under_review: 40,
      interview_scheduled: 60,
      accepted: 100,
      rejected: 100,
      waitlisted: 80,
    };
    return progression[status as keyof typeof progression] || 0;
  },

  // Generate application summary
  generateSummary: (application: Application): string => {
    const status = application.status.replace('_', ' ');
    const daysUntilDeadline = ApplicationUtils.getDaysUntilDeadline(application.deadline);
    
    if (daysUntilDeadline < 0) {
      return `Deadline passed - ${status}`;
    } else if (daysUntilDeadline === 0) {
      return `Deadline today - ${status}`;
    } else if (daysUntilDeadline <= 7) {
      return `${daysUntilDeadline} days until deadline - ${status}`;
    } else {
      return `${status} - ${daysUntilDeadline} days until deadline`;
    }
  }
};
