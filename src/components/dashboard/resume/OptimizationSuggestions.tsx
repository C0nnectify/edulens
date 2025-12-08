'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Suggestion, SuggestionSeverity, Resume } from '@/types/resume';
import { analysisApi } from '@/lib/api/resume-api';
import { Sparkles, Check, AlertCircle, Info, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Separator } from '@/components/ui/separator';

interface OptimizationSuggestionsProps {
  resume: Resume;
  suggestions: Suggestion[];
  onApplySuggestion?: (suggestionId: string) => void;
}

const SEVERITY_CONFIG: Record<SuggestionSeverity, { icon: React.ReactNode; color: string; bgColor: string }> = {
  critical: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
  },
  high: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  medium: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
  },
  low: {
    icon: <Info className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
};

export function OptimizationSuggestions({ resume, suggestions, onApplySuggestion }: OptimizationSuggestionsProps) {
  const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(
    new Set(suggestions.filter(s => s.applied).map(s => s.id))
  );

  const handleApplySuggestion = async (suggestionId: string) => {
    if (!resume.id) {
      toast.error('Resume must be saved first');
      return;
    }

    setApplyingIds(prev => new Set(prev).add(suggestionId));
    try {
      await analysisApi.applySuggestion(resume.id, suggestionId);
      setAppliedIds(prev => new Set(prev).add(suggestionId));
      onApplySuggestion?.(suggestionId);
      toast.success('Suggestion applied successfully');
    } catch (error) {
      toast.error('Failed to apply suggestion');
      console.error(error);
    } finally {
      setApplyingIds(prev => {
        const next = new Set(prev);
        next.delete(suggestionId);
        return next;
      });
    }
  };

  // Group suggestions by section
  const suggestionsBySection = suggestions.reduce((acc, suggestion) => {
    const section = suggestion.section || 'general';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(suggestion);
    return acc;
  }, {} as Record<string, Suggestion[]>);

  // Sort sections by severity
  const sortedSections = Object.entries(suggestionsBySection).sort((a, b) => {
    const severityOrder: Record<SuggestionSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const aMaxSeverity = Math.min(...a[1].map(s => severityOrder[s.severity]));
    const bMaxSeverity = Math.min(...b[1].map(s => severityOrder[s.severity]));
    return aMaxSeverity - bMaxSeverity;
  });

  const totalSuggestions = suggestions.length;
  const appliedCount = appliedIds.size;
  const progress = totalSuggestions > 0 ? Math.round((appliedCount / totalSuggestions) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Optimization Suggestions
            </CardTitle>
            <CardDescription>
              {totalSuggestions} suggestions • {appliedCount} applied ({progress}%)
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {totalSuggestions - appliedCount} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-6 pr-4">
            {sortedSections.map(([section, sectionSuggestions]) => (
              <div key={section}>
                <h3 className="font-semibold text-lg mb-3 capitalize">
                  {section.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <div className="space-y-3">
                  {sectionSuggestions.map((suggestion) => {
                    const config = SEVERITY_CONFIG[suggestion.severity];
                    const isApplying = applyingIds.has(suggestion.id);
                    const isApplied = appliedIds.has(suggestion.id);

                    return (
                      <div
                        key={suggestion.id}
                        className={`border rounded-lg p-4 ${
                          isApplied ? 'bg-muted/50' : config.bgColor
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${isApplied ? 'text-muted-foreground' : config.color}`}>
                            {config.icon}
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant={isApplied ? 'secondary' : 'default'}
                                  className={isApplied ? '' : config.color}
                                >
                                  {suggestion.severity.toUpperCase()}
                                </Badge>
                                <Badge variant="outline">{suggestion.type}</Badge>
                                {isApplied && (
                                  <Badge variant="default" className="bg-green-600">
                                    <Check className="h-3 w-3 mr-1" />
                                    Applied
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <p className="text-sm font-medium">{suggestion.message}</p>

                            {suggestion.example && (
                              <div className="text-xs bg-background/50 p-2 rounded border">
                                <span className="text-muted-foreground">Example: </span>
                                {suggestion.example}
                              </div>
                            )}

                            {suggestion.beforeText && suggestion.afterText && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-red-50 p-2 rounded border border-red-200">
                                  <div className="font-medium text-red-600 mb-1">Before:</div>
                                  <div className="text-muted-foreground">{suggestion.beforeText}</div>
                                </div>
                                <div className="bg-green-50 p-2 rounded border border-green-200">
                                  <div className="font-medium text-green-600 mb-1">After:</div>
                                  <div className="text-muted-foreground">{suggestion.afterText}</div>
                                </div>
                              </div>
                            )}

                            {!isApplied && (
                              <Button
                                size="sm"
                                onClick={() => handleApplySuggestion(suggestion.id)}
                                disabled={isApplying}
                              >
                                {isApplying ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Applying...
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    Apply Suggestion
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
