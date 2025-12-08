'use client';

import { useEffect, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, X } from 'lucide-react';

interface SpellCheckerProps {
  text: string;
  onCorrect?: (corrected: string) => void;
  language?: string;
  children?: React.ReactNode;
}

interface SpellingError {
  word: string;
  position: number;
  suggestions: string[];
}

/**
 * Simple spell checker component
 * In production, this would integrate with a real spell-checking library or API
 */
export function SpellChecker({
  text,
  onCorrect,
  language = 'en-US',
  children,
}: SpellCheckerProps) {
  const [errors, setErrors] = useState<SpellingError[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkSpelling(text);
  }, [text]);

  const checkSpelling = async (content: string) => {
    setIsChecking(true);

    // Simple mock spell checker
    // In production, use a library like typo.js, nspell, or an API
    const words = content.split(/\s+/);
    const mockErrors: SpellingError[] = [];

    // Common misspellings for demonstration
    const commonMisspellings: Record<string, string[]> = {
      'recieve': ['receive'],
      'occured': ['occurred'],
      'seperate': ['separate'],
      'definately': ['definitely'],
      'neccessary': ['necessary'],
      'accomodate': ['accommodate'],
      'acheive': ['achieve'],
      'arguement': ['argument'],
      'collegue': ['colleague'],
      'concious': ['conscious'],
    };

    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:]$/, '');
      if (commonMisspellings[cleanWord]) {
        mockErrors.push({
          word: cleanWord,
          position: index,
          suggestions: commonMisspellings[cleanWord],
        });
      }
    });

    setErrors(mockErrors);
    setIsChecking(false);
  };

  const handleCorrection = (error: SpellingError, suggestion: string) => {
    if (!onCorrect) return;

    const words = text.split(/\s+/);
    words[error.position] = suggestion;
    const corrected = words.join(' ');

    onCorrect(corrected);
  };

  const handleIgnore = (error: SpellingError) => {
    setErrors(errors.filter((e) => e !== error));
  };

  if (errors.length === 0) {
    return children || null;
  }

  return (
    <div className="space-y-2">
      {children}

      {/* Spell Check Results */}
      <div className="space-y-2">
        {errors.map((error, index) => (
          <SpellCheckPopover
            key={`${error.word}-${index}`}
            error={error}
            onCorrect={handleCorrection}
            onIgnore={handleIgnore}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual spell check error popover
 */
function SpellCheckPopover({
  error,
  onCorrect,
  onIgnore,
}: {
  error: SpellingError;
  onCorrect: (error: SpellingError, suggestion: string) => void;
  onIgnore: (error: SpellingError) => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">
          Possible spelling error: <span className="text-red-600">{error.word}</span>
        </p>
        {error.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {error.suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                onClick={() => onCorrect(error, suggestion)}
                size="sm"
                variant="outline"
                className="h-6 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>
      <Button
        onClick={() => onIgnore(error)}
        size="sm"
        variant="ghost"
        className="h-6 text-xs"
      >
        <X className="h-3 w-3 mr-1" />
        Ignore
      </Button>
    </div>
  );
}

/**
 * Hook for spell checking
 */
export function useSpellCheck(text: string, enabled = true) {
  const [errors, setErrors] = useState<SpellingError[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!enabled || !text) {
      setErrors([]);
      return;
    }

    const timer = setTimeout(() => {
      checkText(text);
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [text, enabled]);

  const checkText = async (content: string) => {
    setIsChecking(true);

    // Mock implementation
    const words = content.split(/\s+/);
    const mockErrors: SpellingError[] = [];

    const commonMisspellings: Record<string, string[]> = {
      'recieve': ['receive'],
      'occured': ['occurred'],
      'seperate': ['separate'],
      'definately': ['definitely'],
      'neccessary': ['necessary'],
    };

    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:]$/, '');
      if (commonMisspellings[cleanWord]) {
        mockErrors.push({
          word: cleanWord,
          position: index,
          suggestions: commonMisspellings[cleanWord],
        });
      }
    });

    setErrors(mockErrors);
    setIsChecking(false);
  };

  return {
    errors,
    isChecking,
    hasErrors: errors.length > 0,
  };
}

/**
 * Inline spell check component for text inputs
 */
export function InlineSpellCheck({
  value,
  onChange,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
  onChange: (value: string) => void;
}) {
  const { errors, hasErrors } = useSpellCheck(value);

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        {...props}
      />
      {hasErrors && (
        <div className="absolute top-2 right-2">
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {errors.length} spelling {errors.length === 1 ? 'error' : 'errors'}
          </Badge>
        </div>
      )}
    </div>
  );
}
