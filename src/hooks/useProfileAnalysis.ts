'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ProfileStrength,
  ProfileWeakness,
  ProfileComparison,
  Recommendation,
} from '@/types/insights';

/**
 * Hook to fetch profile analysis (strengths and weaknesses)
 */
export function useProfileAnalysis(userId?: string) {
  return useQuery<{
    strengths: ProfileStrength[];
    weaknesses: ProfileWeakness[];
    comparisons: ProfileComparison[];
  }>({
    queryKey: ['profile-analysis', userId],
    queryFn: async () => {
      const url = userId ? `/api/insights/profile?userId=${userId}` : '/api/insights/profile';
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch profile analysis');
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch recommendations
 */
export function useRecommendations(userId?: string) {
  return useQuery<Recommendation[]>({
    queryKey: ['recommendations', userId],
    queryFn: async () => {
      const url = userId
        ? `/api/insights/recommendations?userId=${userId}`
        : '/api/insights/recommendations';
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch recommendations');
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Hook to mark a recommendation as completed
 */
export function useCompleteRecommendation() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { recommendationId: string; userId: string }
  >({
    mutationFn: async ({ recommendationId, userId }) => {
      const response = await fetch(`/api/insights/recommendations/${recommendationId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete recommendation');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['recommendations', variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['ai-insights', variables.userId],
      });
    },
  });
}

/**
 * Hook to dismiss a recommendation
 */
export function useDismissRecommendation() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, { recommendationId: string; userId: string }>({
    mutationFn: async ({ recommendationId, userId }) => {
      const response = await fetch(`/api/insights/recommendations/${recommendationId}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to dismiss recommendation');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['recommendations', variables.userId],
      });
    },
  });
}

/**
 * Hook to filter recommendations by priority
 */
export function useFilteredRecommendations(
  recommendations?: Recommendation[],
  options: {
    priority?: 'high' | 'medium' | 'low';
    completed?: boolean;
    sortBy?: 'priority' | 'impact' | 'effort';
  } = {}
) {
  if (!recommendations) return [];

  const { priority, completed, sortBy = 'priority' } = options;

  let filtered = [...recommendations];

  if (priority) {
    filtered = filtered.filter((r) => r.priority === priority);
  }

  if (completed !== undefined) {
    filtered = filtered.filter((r) => r.completed === completed);
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'priority': {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      case 'impact':
        return b.potentialImpact - a.potentialImpact;
      case 'effort': {
        const effortOrder = { low: 1, medium: 2, high: 3 };
        return effortOrder[a.effort] - effortOrder[b.effort];
      }
      default:
        return 0;
    }
  });

  return filtered;
}

/**
 * Hook to calculate profile completeness
 */
export function useProfileCompleteness(
  strengths?: ProfileStrength[],
  weaknesses?: ProfileWeakness[]
) {
  if (!strengths || !weaknesses) {
    return { completeness: 0, missingCategories: [] };
  }

  const allCategories = ['gpa', 'test_scores', 'research', 'experience', 'essays', 'lors'];
  const coveredCategories = new Set([
    ...strengths.map((s) => s.category),
    ...weaknesses.map((w) => w.category),
  ]);

  const completeness = (coveredCategories.size / allCategories.length) * 100;
  const missingCategories = allCategories.filter((c) => !coveredCategories.has(c));

  return { completeness, missingCategories };
}

/**
 * Hook to get top strengths and weaknesses
 */
export function useTopProfileItems(
  strengths?: ProfileStrength[],
  weaknesses?: ProfileWeakness[],
  count = 3
) {
  const topStrengths = strengths
    ? [...strengths].sort((a, b) => b.impact - a.impact).slice(0, count)
    : [];

  const topWeaknesses = weaknesses
    ? [...weaknesses].sort((a, b) => b.impact - a.impact).slice(0, count)
    : [];

  return { topStrengths, topWeaknesses };
}

/**
 * Hook to calculate overall profile score
 */
export function useProfileScore(comparisons?: ProfileComparison[]) {
  if (!comparisons || comparisons.length === 0) {
    return { score: 0, grade: 'N/A' };
  }

  const avgScore = comparisons.reduce((acc, c) => acc + c.userScore, 0) / comparisons.length;

  let grade = 'F';
  if (avgScore >= 90) grade = 'A+';
  else if (avgScore >= 85) grade = 'A';
  else if (avgScore >= 80) grade = 'A-';
  else if (avgScore >= 75) grade = 'B+';
  else if (avgScore >= 70) grade = 'B';
  else if (avgScore >= 65) grade = 'B-';
  else if (avgScore >= 60) grade = 'C+';
  else if (avgScore >= 55) grade = 'C';
  else if (avgScore >= 50) grade = 'C-';
  else if (avgScore >= 40) grade = 'D';

  return { score: avgScore, grade };
}
