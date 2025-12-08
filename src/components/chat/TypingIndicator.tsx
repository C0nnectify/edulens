'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TypingIndicatorProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'dots';
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  className,
  variant = 'default',
}) => {
  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2 px-2", className)}>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-[#F5A576] rounded-full animate-pulse" />
          <div
            className="w-1.5 h-1.5 bg-[#F5A576] rounded-full animate-pulse"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="w-1.5 h-1.5 bg-[#F5A576] rounded-full animate-pulse"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
        <span className="text-xs text-muted-foreground">AI is thinking...</span>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn("flex gap-1.5", className)}>
        <div className="w-2 h-2 bg-[#F5A576] rounded-full animate-bounce" />
        <div
          className="w-2 h-2 bg-[#F5A576] rounded-full animate-bounce"
          style={{ animationDelay: '0.1s' }}
        />
        <div
          className="w-2 h-2 bg-[#F5A576] rounded-full animate-bounce"
          style={{ animationDelay: '0.2s' }}
        />
      </div>
    );
  }

  // Default variant with card and avatar
  return (
    <div
      className={cn(
        "flex items-start gap-3 animate-in fade-in slide-in-from-left-4 duration-150",
        className
      )}
    >
      <Avatar className="w-8 h-8 shadow-sm">
        <AvatarFallback className="bg-gradient-to-br from-[#20808D] to-[#1a6d78] text-white">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <Card className="bg-muted/30 border-none shadow-md">
        <div className="p-4 space-y-3">
          {/* Animated dots */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-[#20808D] rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-[#20808D] rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              />
              <div
                className="w-2 h-2 bg-[#20808D] rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
            <span className="text-sm text-muted-foreground">AI is researching...</span>
          </div>

          {/* Optional: Animated progress bars for "thinking" effect */}
          <div className="space-y-2">
            <div className="h-1 bg-muted rounded-full overflow-hidden shadow-sm">
              <div className="h-full bg-gradient-to-r from-[#20808D] to-[#1a6d78] animate-pulse w-3/4" />
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden shadow-sm">
              <div
                className="h-full bg-gradient-to-r from-[#20808D] to-[#1a6d78] animate-pulse w-1/2"
                style={{ animationDelay: '0.3s' }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Shimmer loading effect for messages being composed
export const MessageShimmer: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-3 animate-in fade-in duration-300", className)}>
      <div className="space-y-2">
        <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-pulse w-5/6" />
        <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-pulse w-4/6" />
      </div>
    </div>
  );
};

// Typing indicator with custom text
export interface CustomTypingIndicatorProps {
  text?: string;
  showAvatar?: boolean;
  className?: string;
}

export const CustomTypingIndicator: React.FC<CustomTypingIndicatorProps> = ({
  text = 'AI is responding...',
  showAvatar = true,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-start gap-3 animate-in fade-in slide-in-from-left-4 duration-150",
        className
      )}
    >
      {showAvatar && (
        <Avatar className="w-8 h-8 shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-[#20808D] to-[#1a6d78] text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <Card className="bg-muted/30 border-none shadow-md">
        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Pulsing dots */}
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#20808D] rounded-full animate-pulse" />
              <div
                className="w-2 h-2 bg-[#20808D] rounded-full animate-pulse"
                style={{ animationDelay: '0.15s' }}
              />
              <div
                className="w-2 h-2 bg-[#20808D] rounded-full animate-pulse"
                style={{ animationDelay: '0.3s' }}
              />
            </div>

            {/* Custom text */}
            <span className="text-sm text-muted-foreground">{text}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Streaming text cursor
export const StreamingCursor: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <span
      className={cn(
        "inline-block w-0.5 h-4 bg-[#F5A576] animate-pulse ml-0.5",
        className
      )}
    />
  );
};
