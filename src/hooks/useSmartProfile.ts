/**
 * useSmartProfile - React Hook for SmartProfile Management
 * 
 * Provides comprehensive state management for the SmartProfile,
 * including CRUD operations, section updates, and sync functionality.
 */

import { useState, useCallback, useEffect } from 'react';
import type { SmartProfile, SmartProfileSection, ProfileUpdateResult } from '@/types/smart-profile';

interface UseSmartProfileOptions {
  autoFetch?: boolean;
  onError?: (error: Error) => void;
}

interface SmartProfileState {
  profile: SmartProfile | null;
  computed: {
    completeness: {
      overall: number;
      sections: Record<string, boolean>;
      completedCount: number;
      totalCount: number;
    };
    nextActions: {
      section: string;
      action: string;
      priority: 'high' | 'medium' | 'low';
    }[];
    pendingSyncCount: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
  lastUpdated: Date | null;
}

interface ProfileUpdateOptions {
  syncToRoadmap?: boolean;
  source?: 'user' | 'chat' | 'import';
}

export function useSmartProfile(options: UseSmartProfileOptions = {}) {
  const { autoFetch = true, onError } = options;

  const [state, setState] = useState<SmartProfileState>({
    profile: null,
    computed: null,
    isLoading: false,
    error: null,
    isSyncing: false,
    lastUpdated: null,
  });

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/smart-profile');
      
      if (!response.ok) {
        if (response.status === 404) {
          // Profile doesn't exist yet
          setState(prev => ({
            ...prev,
            isLoading: false,
            profile: null,
            computed: null,
          }));
          return null;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        profile: data.profile,
        computed: data.computed,
        lastUpdated: new Date(),
      }));

      return data.profile;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      onError?.(err);
      return null;
    }
  }, [onError]);

  // Create profile
  const createProfile = useCallback(async (initialData?: Partial<SmartProfile>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/smart-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialData }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create profile');
      }

      const profile = await response.json();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        profile,
        lastUpdated: new Date(),
      }));

      return profile;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      onError?.(err);
      return null;
    }
  }, [onError]);

  // Update a section
  const updateSection = useCallback(async (
    section: SmartProfileSection,
    data: Record<string, unknown>,
    options: ProfileUpdateOptions = {}
  ): Promise<ProfileUpdateResult | null> => {
    const { syncToRoadmap = true, source = 'user' } = options;

    try {
      const response = await fetch('/api/smart-profile/section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          data,
          source,
          syncToRoadmap,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update section');
      }

      const result: ProfileUpdateResult = await response.json();

      // Optimistically update local state
      if (result.success && state.profile) {
        setState(prev => ({
          ...prev,
          profile: prev.profile ? {
            ...prev.profile,
            [section]: { ...prev.profile[section], ...data },
            version: {
              ...prev.profile.version,
              version: result.newVersion,
              lastModified: new Date(),
            },
          } : null,
          lastUpdated: new Date(),
        }));
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      return null;
    }
  }, [state.profile, onError]);

  // Bulk update multiple sections
  const bulkUpdate = useCallback(async (
    updates: { section: SmartProfileSection; data: Record<string, unknown> }[],
    options: ProfileUpdateOptions = {}
  ): Promise<ProfileUpdateResult[]> => {
    const { syncToRoadmap = true, source = 'user' } = options;

    try {
      const response = await fetch('/api/smart-profile/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: updates.map(u => ({
            section: u.section,
            data: u.data,
            source,
            syncToRoadmap,
          })),
          source,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update');
      }

      const results: ProfileUpdateResult[] = await response.json();

      // Refresh profile after bulk update
      await fetchProfile();

      return results;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      return [];
    }
  }, [fetchProfile, onError]);

  // Sync to roadmap
  const syncToRoadmap = useCallback(async (sections?: SmartProfileSection[], force = false) => {
    setState(prev => ({ ...prev, isSyncing: true }));

    try {
      const response = await fetch('/api/smart-profile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, force }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync to roadmap');
      }

      const result = await response.json();

      // Refresh profile to get updated sync status
      await fetchProfile();

      setState(prev => ({ ...prev, isSyncing: false }));
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({ ...prev, isSyncing: false }));
      onError?.(err);
      return null;
    }
  }, [fetchProfile, onError]);

  // Get sync log
  const getSyncLog = useCallback(async (limit = 50, section?: SmartProfileSection) => {
    try {
      let url = `/api/smart-profile/sync?limit=${limit}`;
      if (section) {
        url += `&section=${section}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to get sync log');
      }

      return await response.json();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      return null;
    }
  }, [onError]);

  // Extract profile data from chat message
  const extractFromChat = useCallback(async (message: string, context?: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/smart-profile/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract profile data');
      }

      return await response.json();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      return null;
    }
  }, [onError]);

  // Apply confirmed chat extractions
  const applyExtractions = useCallback(async (updates: unknown[]) => {
    try {
      const response = await fetch('/api/smart-profile/extract', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply extractions');
      }

      const result = await response.json();

      // Refresh profile
      await fetchProfile();

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      return null;
    }
  }, [fetchProfile, onError]);

  // Delete profile
  const deleteProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/smart-profile', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile');
      }

      setState(prev => ({
        ...prev,
        profile: null,
        computed: null,
      }));

      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      return false;
    }
  }, [onError]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchProfile();
    }
  }, [autoFetch, fetchProfile]);

  return {
    // State
    profile: state.profile,
    computed: state.computed,
    isLoading: state.isLoading,
    error: state.error,
    isSyncing: state.isSyncing,
    lastUpdated: state.lastUpdated,
    
    // Actions
    fetchProfile,
    createProfile,
    updateSection,
    bulkUpdate,
    syncToRoadmap,
    getSyncLog,
    extractFromChat,
    applyExtractions,
    deleteProfile,
    
    // Helpers
    hasProfile: !!state.profile,
    profileCompleteness: state.computed?.completeness.overall ?? 0,
    pendingSyncs: state.computed?.pendingSyncCount ?? 0,
    nextActions: state.computed?.nextActions ?? [],
  };
}

export default useSmartProfile;
