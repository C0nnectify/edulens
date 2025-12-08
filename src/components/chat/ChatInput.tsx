'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Send,
  Sparkles,
  Paperclip,
  Mic,
  StopCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxLength?: number;
  showAttachment?: boolean;
  showVoice?: boolean;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  onStop,
  placeholder = 'Ask about universities, programs, scholarships, costs, or anything else...',
  disabled = false,
  isLoading = false,
  maxLength = 4000,
  showAttachment = false,
  showVoice = false,
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Set new height based on content (min 48px, max 200px)
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 200);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isLoading) {
        onSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !disabled && !isLoading) {
      onSubmit();
    }
  };

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-150 border-none shadow-md",
        isFocused && "shadow-xl ring-1 ring-[#F5A576]/30",
        className
      )}
    >
      <div className="relative">
        {/* Gradient border effect when focused */}
        {isFocused && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#F5A576]/10 via-[#F08F5E]/10 to-[#F5A576]/10 animate-pulse pointer-events-none" />
        )}

        <div className="relative bg-background">
          <div className="flex items-end gap-2 p-3">
            {/* Left side actions */}
            <div className="flex items-center gap-1 pb-2">
              {showAttachment && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  disabled={disabled}
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>

            {/* Textarea */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                className={cn(
                  "min-h-[48px] max-h-[200px] resize-none",
                  "text-[15px] leading-relaxed",
                  "border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-muted-foreground/60",
                  "bg-transparent pr-10"
                )}
                rows={1}
              />

              {/* AI indicator */}
              <div className="absolute right-2 top-3">
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full",
                  "bg-gradient-to-r from-[#F5A576]/10 to-[#F08F5E]/10",
                  "transition-opacity",
                  value.length > 0 ? "opacity-100" : "opacity-0"
                )}>
                  <Sparkles className="h-3 w-3 text-[#F5A576]" />
                  <span className="text-xs font-medium text-[#F5A576]">AI</span>
                </div>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-1 pb-2">
              {showVoice && !value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  disabled={disabled}
                >
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}

              {/* Submit or Stop button */}
              {isLoading ? (
                <Button
                  type="button"
                  onClick={onStop}
                  size="sm"
                  className="h-10 w-10 p-0 bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-150"
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!value.trim() || disabled || isOverLimit}
                  size="sm"
                  className={cn(
                    "h-10 w-10 p-0 shadow-md transition-all duration-150",
                    value.trim() && !isOverLimit
                      ? "bg-gradient-to-br from-[#F5A576] to-[#F08F5E] hover:shadow-lg hover:scale-105"
                      : ""
                  )}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Footer with character count and hints */}
          <div className="px-4 pb-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift + Enter</kbd> for new line
              </span>
            </div>

            {/* Character count */}
            {(isNearLimit || isOverLimit) && (
              <span
                className={cn(
                  "font-medium transition-colors",
                  isOverLimit ? "text-red-500" : "text-yellow-600"
                )}
              >
                {characterCount} / {maxLength}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Simplified version for mobile or compact layouts
export const CompactChatInput: React.FC<ChatInputProps> = (props) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-background border-t">
      <input
        type="text"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !props.disabled && !props.isLoading) {
            props.onSubmit();
          }
        }}
        placeholder={props.placeholder}
        disabled={props.disabled}
        className="flex-1 h-10 px-4 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A576]/50"
      />
      <Button
        onClick={props.onSubmit}
        disabled={!props.value.trim() || props.disabled || props.isLoading}
        size="sm"
        className="h-10 w-10 p-0 rounded-full bg-gradient-to-br from-[#F5A576] to-[#F08F5E]"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};
