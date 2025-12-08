/**
 * useKeyboardShortcuts Hook
 *
 * Global keyboard event listener for resume builder shortcuts
 * Handles platform detection (Mac/Windows) and prevents conflicts
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: 'general' | 'editing' | 'navigation' | 'ai';
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Detects if the user is on macOS
 */
export const isMac = () => {
  if (typeof window === 'undefined') return false;
  return /Mac|iPhone|iPod|iPad/.test(navigator.platform);
};

/**
 * Gets the modifier key name based on platform
 */
export const getModifierKey = () => {
  return isMac() ? 'Cmd' : 'Ctrl';
};

/**
 * Hook to manage keyboard shortcuts throughout the application
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  preventDefault = true,
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Find matching shortcut
      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;

        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift
          ? event.shiftKey
          : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          // Special handling for certain shortcuts
          // Allow Ctrl+S, Ctrl+P, Ctrl+Z, etc. even in inputs
          const allowInInput =
            shortcut.category === 'general' ||
            (shortcut.ctrl && ['s', 'p', 'z', 'y'].includes(shortcut.key));

          if (isInput && !allowInInput) continue;

          if (preventDefault) {
            event.preventDefault();
          }

          shortcut.action();
          break;
        }
      }
    },
    [enabled, preventDefault]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  return {
    isMac: isMac(),
    modifierKey: getModifierKey(),
  };
}

/**
 * Helper to format shortcut display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const mod = getModifierKey();

  if (shortcut.ctrl) parts.push(mod);
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
}

/**
 * Default resume builder shortcuts
 */
export const defaultResumeShortcuts = (callbacks: {
  onSave: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onShowShortcuts: () => void;
  onClose: () => void;
  onFocusAI?: () => void;
  onSendChat?: () => void;
  onGetSuggestion?: () => void;
}): KeyboardShortcut[] => [
  // General
  {
    key: 's',
    ctrl: true,
    action: callbacks.onSave,
    description: 'Save resume',
    category: 'general',
  },
  {
    key: 'p',
    ctrl: true,
    action: callbacks.onExport,
    description: 'Export resume',
    category: 'general',
  },
  {
    key: '/',
    ctrl: true,
    action: callbacks.onShowShortcuts,
    description: 'Show keyboard shortcuts',
    category: 'general',
  },
  {
    key: '?',
    action: callbacks.onShowShortcuts,
    description: 'Show keyboard shortcuts',
    category: 'general',
  },
  {
    key: 'Escape',
    action: callbacks.onClose,
    description: 'Close dialog/modal',
    category: 'general',
  },

  // Editing
  {
    key: 'z',
    ctrl: true,
    action: callbacks.onUndo,
    description: 'Undo last change',
    category: 'editing',
  },
  {
    key: 'z',
    ctrl: true,
    shift: true,
    action: callbacks.onRedo,
    description: 'Redo last change',
    category: 'editing',
  },
  {
    key: 'y',
    ctrl: true,
    action: callbacks.onRedo,
    description: 'Redo last change',
    category: 'editing',
  },

  // AI (optional callbacks)
  ...(callbacks.onFocusAI
    ? [
        {
          key: 'k',
          ctrl: true,
          action: callbacks.onFocusAI,
          description: 'Focus AI chat',
          category: 'ai' as const,
        },
      ]
    : []),
  ...(callbacks.onGetSuggestion
    ? [
        {
          key: ' ',
          ctrl: true,
          action: callbacks.onGetSuggestion,
          description: 'Get AI suggestion',
          category: 'ai' as const,
        },
      ]
    : []),
  ...(callbacks.onSendChat
    ? [
        {
          key: 'Enter',
          ctrl: true,
          action: callbacks.onSendChat,
          description: 'Send chat message',
          category: 'ai' as const,
        },
      ]
    : []),
];
