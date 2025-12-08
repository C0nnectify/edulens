'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Source {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  favicon?: string;
}

export interface SourceCardProps {
  source: Source;
  index: number;
  messageId: string;
}

export const SourceCard: React.FC<SourceCardProps> = ({
  source,
  index,
  messageId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <Card
      id={`source-${messageId}-${index + 1}`}
      className={cn(
        "group relative overflow-hidden border-none bg-card shadow-sm hover:shadow-lg",
        "transition-all duration-150 hover:scale-[1.02]",
        "cursor-pointer"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4 space-y-3">
        {/* Header with number badge */}
        <div className="flex items-start gap-3">
          {/* Numbered badge */}
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#F5A576] to-[#F08F5E] text-white flex items-center justify-center text-sm font-semibold shadow-md">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-[#F5A576] transition-colors duration-150">
              {source.title}
            </h4>

            {/* Domain */}
            <div className="flex items-center gap-1 mt-1">
              {source.favicon && (
                <img
                  src={source.favicon}
                  alt=""
                  className="w-3 h-3 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span className="text-xs text-muted-foreground truncate">
                {getDomain(source.url)}
              </span>
            </div>
          </div>

          {/* External link button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-150 hover:shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(source.url, '_blank', 'noopener,noreferrer');
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Expandable snippet */}
        {source.snippet && (
          <div
            className={cn(
              "text-xs text-muted-foreground leading-relaxed transition-all duration-150",
              isExpanded ? "line-clamp-none" : "line-clamp-2"
            )}
          >
            {source.snippet}
          </div>
        )}

        {/* Expand/collapse indicator */}
        {source.snippet && (
          <div className="flex items-center justify-center">
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Gradient overlay for visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5A576]/0 to-[#F5A576]/0 group-hover:from-[#F5A576]/5 group-hover:to-[#F08F5E]/5 transition-all duration-150 pointer-events-none" />
    </Card>
  );
};

export interface SourcesDisplayProps {
  sources: Source[];
  messageId: string;
}

export const SourcesDisplay: React.FC<SourcesDisplayProps> = ({
  sources,
  messageId,
}) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-150">
      <div className="flex items-center gap-2 px-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-muted to-transparent shadow-sm" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Sources
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-muted to-transparent shadow-sm" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sources.map((source, index) => (
          <SourceCard
            key={source.id}
            source={source}
            index={index}
            messageId={messageId}
          />
        ))}
      </div>
    </div>
  );
};
