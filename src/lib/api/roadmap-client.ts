/**
 * Roadmap API Client
 * Handles communication with roadmap endpoints
 */

import type {
  StageListResponse,
  StageResponse,
  AnalyticsEvent,
  AnalyticsEventResponse,
} from '@/types/roadmap';

class RoadmapClient {
  private readonly baseUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

  /**
   * Make a request to the roadmap API (directly to backend, no auth required for roadmap)
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1/roadmap${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
          const error = await response.json();
          errorMessage = error.error || error.detail || error.message || `Request failed with status ${response.status}`;
        } catch {
          errorMessage = response.statusText || `Request failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Roadmap API request error:', error);
      throw error;
    }
  }

  /**
   * Fetch all roadmap stages
   */
  async fetchStages(): Promise<StageListResponse> {
    return this.request<StageListResponse>('/stages', { method: 'GET' });
  }

  /**
   * Fetch a specific stage by ID
   */
  async fetchStageById(stageId: string): Promise<StageResponse> {
    return this.request<StageResponse>(`/stages/${stageId}`, { method: 'GET' });
  }

  /**
   * Fetch a specific stage by order number (1-12)
   */
  async fetchStageByOrder(order: number): Promise<StageResponse> {
    return this.request<StageResponse>(`/stages/order/${order}`, { method: 'GET' });
  }

  /**
   * Track an analytics event
   */
  async trackAnalytics(event: AnalyticsEvent): Promise<AnalyticsEventResponse> {
    try {
      return await this.request<AnalyticsEventResponse>('/analytics/track', {
        method: 'POST',
        body: JSON.stringify(event),
      });
    } catch (error) {
      // Don't throw on analytics errors - fail silently
      console.warn('Analytics tracking failed:', error);
      return {
        success: false,
        message: 'Failed to track event',
        event_id: 'error',
      };
    }
  }

  /**
   * Get analytics statistics (admin)
   */
  async getAnalyticsStats(): Promise<{
    success: boolean;
    data: {
      total_events: number;
      unique_sessions: number;
      event_breakdown: Record<string, number>;
    };
  }> {
    return this.request('/analytics/stats', { method: 'GET' });
  }
}

export const roadmapClient = new RoadmapClient();
