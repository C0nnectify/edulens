/**
 * Auto-save hook for resume data
 * Debounces save operations to prevent excessive API calls
 */

import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 3000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);
  const lastSavedDataRef = useRef<string>();

  const save = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    const currentDataStr = JSON.stringify(data);

    // Don't save if data hasn't changed
    if (currentDataStr === lastSavedDataRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      await onSave(data);
      lastSavedDataRef.current = currentDataStr;
      toast.success('Resume auto-saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Failed to auto-save resume');
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  return { save };
}
