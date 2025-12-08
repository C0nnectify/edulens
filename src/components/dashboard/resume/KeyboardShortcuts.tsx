'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  KeyboardShortcut,
  formatShortcut,
  getModifierKey,
} from '@/hooks/useKeyboardShortcuts';
import {
  Command,
  Save,
  FileDown,
  Undo2,
  Redo2,
  Keyboard,
  MessageSquare,
  Sparkles,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyboardShortcutsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
  showFirstTimeHint?: boolean;
}

const categoryIcons = {
  general: Command,
  editing: Undo2,
  navigation: Search,
  ai: Sparkles,
};

const categoryColors = {
  general: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  editing: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  navigation: 'bg-green-500/10 text-green-700 dark:text-green-400',
  ai: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
};

const shortcutIcons: Record<string, any> = {
  's': Save,
  'p': FileDown,
  'z': Undo2,
  'y': Redo2,
  'k': MessageSquare,
  '/': Keyboard,
  '?': Keyboard,
};

export function KeyboardShortcuts({
  open,
  onOpenChange,
  shortcuts,
  showFirstTimeHint = false,
}: KeyboardShortcutsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showHint, setShowHint] = useState(showFirstTimeHint);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  // Filter shortcuts by search query
  const filteredGroups = Object.entries(groupedShortcuts).reduce(
    (acc, [category, categoryShortcuts]) => {
      const filtered = categoryShortcuts.filter((shortcut) => {
        const query = searchQuery.toLowerCase();
        return (
          shortcut.description.toLowerCase().includes(query) ||
          shortcut.key.toLowerCase().includes(query) ||
          category.toLowerCase().includes(query)
        );
      });

      if (filtered.length > 0) {
        acc[category] = filtered;
      }

      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  useEffect(() => {
    if (showFirstTimeHint && open) {
      const timer = setTimeout(() => setShowHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showFirstTimeHint, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Keyboard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Keyboard Shortcuts</DialogTitle>
                <DialogDescription>
                  Press{' '}
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                    {getModifierKey()}+/
                  </kbd>{' '}
                  or{' '}
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                    ?
                  </kbd>{' '}
                  to open this dialog anytime
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* First Time Hint */}
        {showHint && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Pro Tip: Master Keyboard Shortcuts
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Using keyboard shortcuts can save you hours of time. Start with{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 rounded">
                    {getModifierKey()}+S
                  </kbd>{' '}
                  to save and{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 rounded">
                    {getModifierKey()}+Z
                  </kbd>{' '}
                  to undo.
                </p>
              </div>
              <button
                onClick={() => setShowHint(false)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Shortcuts Grid */}
        <ScrollArea className="h-[50vh] pr-4">
          <div className="space-y-6">
            {Object.entries(filteredGroups).map(([category, categoryShortcuts]) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold capitalize text-foreground">
                      {category}
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="grid gap-2">
                    {categoryShortcuts.map((shortcut, index) => {
                      const ShortcutIcon =
                        shortcutIcons[shortcut.key.toLowerCase()];
                      return (
                        <div
                          key={`${category}-${index}`}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {ShortcutIcon && (
                              <div className="p-1.5 rounded-md bg-primary/10">
                                <ShortcutIcon className="h-3.5 w-3.5 text-primary" />
                              </div>
                            )}
                            <span className="text-sm text-foreground">
                              {shortcut.description}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs font-mono',
                                categoryColors[category as keyof typeof categoryColors]
                              )}
                            >
                              {category}
                            </Badge>
                            <KeyboardKey shortcut={shortcut} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {Object.keys(filteredGroups).length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No shortcuts found matching &quot;{searchQuery}&quot;
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold">{shortcuts.length}</span> shortcuts
            available
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> to
            close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Visual keyboard key component
 */
function KeyboardKey({ shortcut }: { shortcut: KeyboardShortcut }) {
  const modKey = getModifierKey();
  const keys: string[] = [];

  if (shortcut.ctrl) keys.push(modKey);
  if (shortcut.shift) keys.push('Shift');
  if (shortcut.alt) keys.push('Alt');

  // Format special keys
  let keyDisplay = shortcut.key;
  if (keyDisplay === ' ') keyDisplay = 'Space';
  if (keyDisplay === 'Escape') keyDisplay = 'Esc';
  if (keyDisplay === 'Enter') keyDisplay = '↵';

  keys.push(keyDisplay.toUpperCase());

  return (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <div key={index} className="flex items-center gap-1">
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 min-w-[2rem] text-center shadow-sm">
            {key}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-xs text-muted-foreground">+</span>
          )}
        </div>
      ))}
    </div>
  );
}
