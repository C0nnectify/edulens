/**
 * Resume Store - Zustand State Management
 *
 * Centralized state management for resume builder
 * Handles resume data, history, suggestions, and UI state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Resume, Suggestion, SuggestionType, SuggestionSeverity } from '@/types/resume';

interface ResumeVersion {
  id: string;
  resume: Resume;
  timestamp: Date;
  label?: string;
  tag?: string;
}

interface ResumeStoreState {
  // Current resume
  currentResume: Resume | null;

  // Version history (max 20 versions)
  versions: ResumeVersion[];

  // AI Suggestions
  suggestions: Suggestion[];
  dismissedSuggestions: Set<string>;

  // UI State
  showKeyboardShortcuts: boolean;
  showSmartSuggestions: boolean;
  showCoverLetter: boolean;
  isAIProcessing: boolean;

  // Actions - Resume Management
  setResume: (resume: Resume) => void;
  updateResume: (updates: Partial<Resume>) => void;

  // Actions - Version History
  saveVersion: (label?: string, tag?: string) => void;
  restoreVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;
  clearOldVersions: () => void;

  // Actions - Suggestions
  setSuggestions: (suggestions: Suggestion[]) => void;
  addSuggestion: (suggestion: Suggestion) => void;
  dismissSuggestion: (suggestionId: string) => void;
  applySuggestion: (suggestionId: string) => void;
  clearDismissedSuggestions: () => void;

  // Actions - UI State
  toggleKeyboardShortcuts: () => void;
  toggleSmartSuggestions: () => void;
  toggleCoverLetter: () => void;
  setAIProcessing: (processing: boolean) => void;

  // Utility
  reset: () => void;
}

const MAX_VERSIONS = 20;

const initialState = {
  currentResume: null,
  versions: [],
  suggestions: [],
  dismissedSuggestions: new Set<string>(),
  showKeyboardShortcuts: false,
  showSmartSuggestions: false,
  showCoverLetter: false,
  isAIProcessing: false,
};

export const useResumeStore = create<ResumeStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Resume Management
        setResume: (resume) => {
          set({ currentResume: resume });
        },

        updateResume: (updates) => {
          const current = get().currentResume;
          if (!current) return;

          set({
            currentResume: {
              ...current,
              ...updates,
              updatedAt: new Date(),
            },
          });
        },

        // Version History
        saveVersion: (label, tag) => {
          const current = get().currentResume;
          if (!current) return;

          const newVersion: ResumeVersion = {
            id: `v-${Date.now()}`,
            resume: { ...current },
            timestamp: new Date(),
            label,
            tag,
          };

          set((state) => {
            const versions = [newVersion, ...state.versions];

            // Keep only MAX_VERSIONS
            if (versions.length > MAX_VERSIONS) {
              versions.splice(MAX_VERSIONS);
            }

            return { versions };
          });
        },

        restoreVersion: (versionId) => {
          const version = get().versions.find((v) => v.id === versionId);
          if (!version) return;

          // Save current state before restoring
          get().saveVersion('Before restore');

          set({
            currentResume: { ...version.resume, updatedAt: new Date() },
          });
        },

        deleteVersion: (versionId) => {
          set((state) => ({
            versions: state.versions.filter((v) => v.id !== versionId),
          }));
        },

        clearOldVersions: () => {
          set((state) => ({
            versions: state.versions.slice(0, 10), // Keep only 10 most recent
          }));
        },

        // Suggestions Management
        setSuggestions: (suggestions) => {
          set({ suggestions });
        },

        addSuggestion: (suggestion) => {
          set((state) => ({
            suggestions: [...state.suggestions, suggestion],
          }));
        },

        dismissSuggestion: (suggestionId) => {
          set((state) => ({
            dismissedSuggestions: new Set([
              ...state.dismissedSuggestions,
              suggestionId,
            ]),
            suggestions: state.suggestions.filter((s) => s.id !== suggestionId),
          }));
        },

        applySuggestion: (suggestionId) => {
          const suggestion = get().suggestions.find((s) => s.id === suggestionId);
          if (!suggestion || !suggestion.afterText) return;

          // Mark suggestion as applied
          set((state) => ({
            suggestions: state.suggestions.map((s) =>
              s.id === suggestionId ? { ...s, applied: true } : s
            ),
          }));

          // Apply the suggestion based on type and section
          // This is a simplified version - actual implementation would be more complex
          const current = get().currentResume;
          if (!current) return;

          // Example: updating summary
          if (suggestion.section === 'summary' && suggestion.field === 'content') {
            get().updateResume({ summary: suggestion.afterText });
          }
        },

        clearDismissedSuggestions: () => {
          set({ dismissedSuggestions: new Set() });
        },

        // UI State
        toggleKeyboardShortcuts: () => {
          set((state) => ({
            showKeyboardShortcuts: !state.showKeyboardShortcuts,
          }));
        },

        toggleSmartSuggestions: () => {
          set((state) => ({
            showSmartSuggestions: !state.showSmartSuggestions,
          }));
        },

        toggleCoverLetter: () => {
          set((state) => ({
            showCoverLetter: !state.showCoverLetter,
          }));
        },

        setAIProcessing: (processing) => {
          set({ isAIProcessing: processing });
        },

        // Reset
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'resume-store',
        partialize: (state) => ({
          // Only persist these fields
          versions: state.versions,
          dismissedSuggestions: Array.from(state.dismissedSuggestions),
        }),
        // Custom serializer for Set
        serialize: (state) => {
          return JSON.stringify({
            ...state,
            state: {
              ...state.state,
              dismissedSuggestions: Array.from(
                state.state.dismissedSuggestions || []
              ),
            },
          });
        },
        deserialize: (str) => {
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              dismissedSuggestions: new Set(
                parsed.state.dismissedSuggestions || []
              ),
            },
          };
        },
      }
    )
  )
);

// Selectors for common use cases
export const selectActiveSuggestions = (state: ResumeStoreState) =>
  state.suggestions.filter(
    (s) => !state.dismissedSuggestions.has(s.id) && !s.applied
  );

export const selectHighPrioritySuggestions = (state: ResumeStoreState) =>
  selectActiveSuggestions(state).filter(
    (s) => s.severity === 'high' || s.severity === 'critical'
  );

export const selectSuggestionsBySection = (
  state: ResumeStoreState,
  section: string
) => selectActiveSuggestions(state).filter((s) => s.section === section);

export const selectRecentVersions = (state: ResumeStoreState, count = 5) =>
  state.versions.slice(0, count);
