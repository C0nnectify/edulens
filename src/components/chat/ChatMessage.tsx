'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Bot,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownContent } from '@/components/chat/MarkdownContent';

export interface Source {
  id: string;
  title: string;
  url: string;
  snippet?: string;
}

export interface ChatMessageProps {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sources?: Source[];
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onFeedback?: (feedback: 'positive' | 'negative') => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  type,
  content,
  timestamp,
  sources = [],
  isStreaming = false,
  onRegenerate,
  onFeedback,
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    onFeedback?.(type);
  };

  if (type === 'user') {
    return (
      <div className="flex justify-end items-start gap-3 animate-in fade-in slide-in-from-right-4 duration-150">
        <div className="max-w-[700px]">
          <Card className="bg-gradient-to-br from-[#F5A576] to-[#F08F5E] text-white border-none shadow-md hover:shadow-lg transition-shadow duration-150">
            <div className="p-4 space-y-2">
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            </div>
          </Card>
          <div className="flex items-center justify-end gap-2 mt-1 px-2">
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
        <Avatar className="w-8 h-8 shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-[#F5A576] to-[#F08F5E] text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  // AI message
  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-4 duration-150">
      <Avatar className="w-8 h-8 shadow-sm">
        <AvatarFallback className="bg-gradient-to-br from-[#20808D] to-[#1a6d78] text-white">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 max-w-[700px] space-y-3">
        <Card className="bg-muted/30 border-none shadow-md hover:shadow-lg transition-all duration-150">
          <div className="p-4 space-y-3">
            {/* Message content with markdown support */}
            <MarkdownContent
              content={content}
              citationContext={{ messageId: id, sourceCount: sources.length }}
            />

            {/* Action buttons */}
            <div className="flex items-center gap-1 pt-3 mt-3 shadow-[0_-1px_0_0_rgba(0,0,0,0.05)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-xs hover:bg-background/80 hover:shadow-sm transition-all duration-150"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>

              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="h-7 px-2 text-xs hover:bg-background/80 hover:shadow-sm transition-all duration-150"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
              )}

              <div className="flex-1" />

              {onFeedback && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback('positive')}
                    className={cn(
                      "h-7 w-7 p-0 hover:bg-background/80 hover:shadow-sm transition-all duration-150",
                      feedback === 'positive' && "text-green-600 bg-green-100 dark:bg-green-900/30 shadow-sm"
                    )}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback('negative')}
                    className={cn(
                      "h-7 w-7 p-0 hover:bg-background/80 hover:shadow-sm transition-all duration-150",
                      feedback === 'negative' && "text-red-600 bg-red-100 dark:bg-red-900/30 shadow-sm"
                    )}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <span className="text-xs text-muted-foreground ml-2">
                {timestamp.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </Card>

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-[#20808D] rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-[#20808D] rounded-full animate-pulse delay-75" />
              <div className="w-1.5 h-1.5 bg-[#20808D] rounded-full animate-pulse delay-150" />
            </div>
            <span className="text-xs text-muted-foreground">AI is responding...</span>
          </div>
        )}
      </div>
    </div>
  );
};
