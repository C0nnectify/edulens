'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AIInsights,
  RefreshInsightsRequest,
  InsightsGenerationResponse,
} from '@/types/insights';

/**
 * Hook to fetch all AI insights for the current user
 */
export function useAIInsights(userId?: string, enabled = true) {
  return useQuery<AIInsights>({
    queryKey: ['ai-insights', userId],
    queryFn: async () => {
      const url = userId ? `/api/insights?userId=${userId}` : '/api/insights';
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch AI insights');
      }

      return response.json();
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

/**
 * Hook to refresh AI insights
 */
export function useRefreshInsights() {
  const queryClient = useQueryClient();

  return useMutation<InsightsGenerationResponse, Error, RefreshInsightsRequest>({
    mutationFn: async (data) => {
      const response = await fetch('/api/insights/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to refresh insights');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate insights cache to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['ai-insights', variables.userId],
      });

      // Invalidate related queries
      if (variables.applicationIds) {
        variables.applicationIds.forEach((appId) => {
          queryClient.invalidateQueries({
            queryKey: ['application-insights', appId],
          });
        });
      }
    },
  });
}

/**
 * Hook to get insights staleness status
 */
export function useInsightsFreshness(insights?: AIInsights) {
  if (!insights) {
    return { isStale: false, isExpired: false, age: 0 };
  }

  const now = new Date();
  const generatedAt = new Date(insights.generatedAt);
  const expiresAt = new Date(insights.expiresAt);
  const age = now.getTime() - generatedAt.getTime();
  const isExpired = now > expiresAt;
  const isStale = age > 24 * 60 * 60 * 1000; // Older than 24 hours

  return {
    isStale,
    isExpired,
    age,
    ageHours: Math.floor(age / (60 * 60 * 1000)),
    ageDays: Math.floor(age / (24 * 60 * 60 * 1000)),
  };
}

/**
 * Hook to automatically refresh stale insights
 */
export function useAutoRefreshInsights(
  userId?: string,
  insights?: AIInsights,
  options: { enabled?: boolean; threshold?: number } = {}
) {
  const { enabled = true, threshold = 24 * 60 * 60 * 1000 } = options; // 24 hours default
  const { mutate: refresh, isPending } = useRefreshInsights();
  const { isStale, isExpired } = useInsightsFreshness(insights);

  const shouldRefresh = enabled && userId && (isStale || isExpired);

  // Trigger refresh if needed
  if (shouldRefresh && !isPending) {
    refresh({ userId, forceRecalculation: isExpired });
  }

  return { shouldRefresh, isRefreshing: isPending };
}
