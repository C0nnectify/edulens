'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdmissionPrediction, ScenarioForecast } from '@/types/insights';

/**
 * Hook to fetch admission predictions for all applications
 */
export function useAdmissionPredictions(userId?: string) {
  return useQuery<AdmissionPrediction[]>({
    queryKey: ['admission-predictions', userId],
    queryFn: async () => {
      const url = userId
        ? `/api/insights/predictions?userId=${userId}`
        : '/api/insights/predictions';
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch predictions');
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch prediction for a specific application
 */
export function useApplicationPrediction(applicationId?: string) {
  return useQuery<AdmissionPrediction>({
    queryKey: ['admission-prediction', applicationId],
    queryFn: async () => {
      const response = await fetch(`/api/insights/predictions/${applicationId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch prediction');
      }

      return response.json();
    },
    enabled: !!applicationId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to generate scenario forecasts
 */
export function useScenarioForecasts(applicationId?: string) {
  return useQuery<ScenarioForecast[]>({
    queryKey: ['scenario-forecasts', applicationId],
    queryFn: async () => {
      const response = await fetch(`/api/insights/scenarios/${applicationId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch scenarios');
      }

      return response.json();
    },
    enabled: !!applicationId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to recalculate prediction with updated profile data
 */
export function useRecalculatePrediction() {
  const queryClient = useQueryClient();

  return useMutation<
    AdmissionPrediction,
    Error,
    { applicationId: string; profileUpdates: Record<string, any> }
  >({
    mutationFn: async ({ applicationId, profileUpdates }) => {
      const response = await fetch(`/api/insights/predictions/${applicationId}/recalculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUpdates }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to recalculate prediction');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admission-prediction', variables.applicationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admission-predictions'],
      });
    },
  });
}

/**
 * Hook to categorize predictions by reach/target/safety
 */
export function useCategorizedPredictions(predictions?: AdmissionPrediction[]) {
  if (!predictions) {
    return {
      reach: [],
      target: [],
      safety: [],
      counts: { reach: 0, target: 0, safety: 0 },
    };
  }

  const reach = predictions.filter((p) => p.category === 'reach');
  const target = predictions.filter((p) => p.category === 'target');
  const safety = predictions.filter((p) => p.category === 'safety');

  return {
    reach,
    target,
    safety,
    counts: {
      reach: reach.length,
      target: target.length,
      safety: safety.length,
    },
  };
}

/**
 * Hook to calculate average admission probability
 */
export function useAverageProbability(predictions?: AdmissionPrediction[]) {
  if (!predictions || predictions.length === 0) {
    return { average: 0, min: 0, max: 0 };
  }

  const probabilities = predictions.map((p) => p.probability);
  const sum = probabilities.reduce((acc, p) => acc + p, 0);
  const average = sum / probabilities.length;
  const min = Math.min(...probabilities);
  const max = Math.max(...probabilities);

  return { average, min, max };
}
