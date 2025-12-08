'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FacultyMatch } from '@/types/insights';

/**
 * Hook to fetch faculty matches for a user
 */
export function useFacultyMatches(userId?: string, universityId?: string) {
  return useQuery<FacultyMatch[]>({
    queryKey: ['faculty-matches', userId, universityId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (universityId) params.append('universityId', universityId);

      const response = await fetch(`/api/insights/faculty?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch faculty matches');
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 60 * 60 * 1000, // 1 hour - faculty data changes less frequently
  });
}

/**
 * Hook to fetch faculty matches for a specific application
 */
export function useApplicationFacultyMatches(applicationId?: string) {
  return useQuery<FacultyMatch[]>({
    queryKey: ['application-faculty-matches', applicationId],
    queryFn: async () => {
      const response = await fetch(`/api/insights/${applicationId}/faculty`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch faculty matches');
      }

      return response.json();
    },
    enabled: !!applicationId,
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * Hook to add faculty to application
 */
export function useAddFacultyToApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { applicationId: string; facultyId: string }
  >({
    mutationFn: async ({ applicationId, facultyId }) => {
      const response = await fetch(`/api/insights/${applicationId}/faculty/${facultyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add faculty to application');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Update the faculty match to show it's been added
      queryClient.invalidateQueries({
        queryKey: ['application-faculty-matches', variables.applicationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['faculty-matches'],
      });
    },
  });
}

/**
 * Hook to remove faculty from application
 */
export function useRemoveFacultyFromApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { applicationId: string; facultyId: string }
  >({
    mutationFn: async ({ applicationId, facultyId }) => {
      const response = await fetch(`/api/insights/${applicationId}/faculty/${facultyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove faculty from application');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['application-faculty-matches', variables.applicationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['faculty-matches'],
      });
    },
  });
}

/**
 * Hook to filter and sort faculty matches
 */
export function useFilteredFacultyMatches(
  matches?: FacultyMatch[],
  options: {
    minMatchScore?: number;
    acceptingStudents?: boolean;
    fundingAvailable?: boolean;
    sortBy?: 'matchScore' | 'name' | 'university';
  } = {}
) {
  if (!matches) return [];

  const { minMatchScore = 0, acceptingStudents, fundingAvailable, sortBy = 'matchScore' } = options;

  let filtered = matches.filter((m) => m.matchScore >= minMatchScore);

  if (acceptingStudents !== undefined) {
    filtered = filtered.filter((m) => m.acceptingStudents === acceptingStudents);
  }

  if (fundingAvailable !== undefined) {
    filtered = filtered.filter((m) => m.fundingAvailable === fundingAvailable);
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'matchScore':
        return b.matchScore - a.matchScore;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'university':
        return a.universityName.localeCompare(b.universityName);
      default:
        return 0;
    }
  });

  return filtered;
}

/**
 * Hook to group faculty matches by university
 */
export function useGroupedFacultyMatches(matches?: FacultyMatch[]) {
  if (!matches) return {};

  return matches.reduce(
    (acc, match) => {
      if (!acc[match.universityId]) {
        acc[match.universityId] = {
          universityId: match.universityId,
          universityName: match.universityName,
          matches: [],
        };
      }
      acc[match.universityId].matches.push(match);
      return acc;
    },
    {} as Record<string, { universityId: string; universityName: string; matches: FacultyMatch[] }>
  );
}
