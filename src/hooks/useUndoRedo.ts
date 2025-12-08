/**
 * useUndoRedo Hook
 *
 * Provides undo/redo functionality for resume state management
 * Maintains a history of up to 50 changes with keyboard shortcuts support
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Resume } from '@/types/resume';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoResult<T> {
  state: T;
  setState: (newState: T | ((prevState: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (newState: T) => void;
  history: {
    pastLength: number;
    futureLength: number;
  };
}

const MAX_HISTORY_LENGTH = 50;

export function useUndoRedo<T>(initialState: T): UseUndoRedoResult<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Debounce timer to avoid creating history entries for rapid changes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStateRef = useRef<T | null>(null);

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    const resolvedState = typeof newState === 'function'
      ? (newState as (prevState: T) => T)(history.present)
      : newState;

    // Store pending state
    pendingStateRef.current = resolvedState;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      if (pendingStateRef.current === null) return;

      setHistory((prev) => {
        const newPast = [...prev.past, prev.present];

        // Limit history length
        if (newPast.length > MAX_HISTORY_LENGTH) {
          newPast.shift();
        }

        return {
          past: newPast,
          present: pendingStateRef.current!,
          future: [], // Clear future when new state is set
        };
      });

      pendingStateRef.current = null;
    }, 300); // 300ms debounce

    // Immediately update present state for UI responsiveness
    setHistory((prev) => ({
      ...prev,
      present: resolvedState,
    }));
  }, [history.present]);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const newPresent = newPast.pop()!;

      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const newPresent = newFuture.shift()!;

      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: [],
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canUndo) undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    history: {
      pastLength: history.past.length,
      futureLength: history.future.length,
    },
  };
}
