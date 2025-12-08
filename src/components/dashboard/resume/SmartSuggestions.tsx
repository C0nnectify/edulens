'use client';

import { useState, useMemo } from 'react';
import { Resume, Suggestion, SuggestionSeverity, SuggestionType } from '@/types/resume';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResumeStore, selectActiveSuggestions } from '@/store/resumeStore';

interface SmartSuggestionsProps {
  resume: Resume;
  onApply?: (suggestion: Suggestion) => void;
  onNavigate?: (section: string, field?: string) => void;
  className?: string;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
  high: {
    icon: TrendingUp,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  medium: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  low: {
    icon: Lightbulb,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
    borderColor: 'border-gray-200 dark:border-gray-800',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  },
};

const typeIcons = {
  content: Sparkles,
  formatting: Target,
  keyword: Zap,
  ats: CheckCircle2,
  grammar: Info,
  impact: TrendingUp,
  structure: Target,
};

export function SmartSuggestions({
  resume,
  onApply,
  onNavigate,
  className,
}: SmartSuggestionsProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['critical', 'high'])
  );

  // Get suggestions from store
  const suggestions = useResumeStore(selectActiveSuggestions);
  const dismissSuggestion = useResumeStore((state) => state.dismissSuggestion);
  const applySuggestion = useResumeStore((state) => state.applySuggestion);

  // Group suggestions by severity
  const groupedSuggestions = useMemo(() => {
    const groups: Record<SuggestionSeverity, Suggestion[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    suggestions.forEach((suggestion) => {
      groups[suggestion.severity].push(suggestion);
    });

    return groups;
  }, [suggestions]);

  // Calculate total suggestions
  const totalSuggestions = suggestions.length;
  const criticalCount = groupedSuggestions.critical.length;
  const highCount = groupedSuggestions.high.length;

  const handleScan = async () => {
    setIsScanning(true);
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate mock suggestions (in production, this would call an AI service)
    const mockSuggestions = generateMockSuggestions(resume);
    useResumeStore.getState().setSuggestions(mockSuggestions);

    setIsScanning(false);
  };

  const handleApply = (suggestion: Suggestion) => {
    applySuggestion(suggestion.id);
    if (onApply) {
      onApply(suggestion);
    }
  };

  const handleDismiss = (suggestionId: string) => {
    dismissSuggestion(suggestionId);
  };

  const handleNavigate = (suggestion: Suggestion) => {
    if (onNavigate) {
      onNavigate(suggestion.section, suggestion.field);
    }
  };

  const toggleSection = (severity: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) {
        next.delete(severity);
      } else {
        next.add(severity);
      }
      return next;
    });
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Smart Suggestions
            </CardTitle>
            <CardDescription>
              AI-powered recommendations to improve your resume
            </CardDescription>
          </div>
          <Button
            onClick={handleScan}
            disabled={isScanning}
            size="sm"
            variant="outline"
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-scan
              </>
            )}
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-2 pt-2">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {criticalCount} Critical
            </Badge>
          )}
          {highCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              {highCount} High
            </Badge>
          )}
          {totalSuggestions === 0 && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              All Clear
            </Badge>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          {totalSuggestions === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-4 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Looking Great!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your resume is well-optimized. Click &quot;Re-scan&quot; to analyze
                again or make changes to get new suggestions.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {(Object.entries(groupedSuggestions) as [SuggestionSeverity, Suggestion[]][]).map(
                ([severity, severitySuggestions]) => {
                  if (severitySuggestions.length === 0) return null;

                  const config = severityConfig[severity];
                  const Icon = config.icon;
                  const isExpanded = expandedSections.has(severity);

                  return (
                    <Collapsible
                      key={severity}
                      open={isExpanded}
                      onOpenChange={() => toggleSection(severity)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors',
                            config.borderColor,
                            config.bgColor
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={cn('h-4 w-4', config.color)} />
                            <span className="font-semibold capitalize">
                              {severity} Priority
                            </span>
                            <Badge variant="secondary" className={config.badge}>
                              {severitySuggestions.length}
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="pt-2 space-y-2">
                        {severitySuggestions.map((suggestion) => (
                          <SuggestionCard
                            key={suggestion.id}
                            suggestion={suggestion}
                            onApply={() => handleApply(suggestion)}
                            onDismiss={() => handleDismiss(suggestion.id)}
                            onNavigate={() => handleNavigate(suggestion)}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * Individual suggestion card component
 */
function SuggestionCard({
  suggestion,
  onApply,
  onDismiss,
  onNavigate,
}: {
  suggestion: Suggestion;
  onApply: () => void;
  onDismiss: () => void;
  onNavigate: () => void;
}) {
  const TypeIcon = typeIcons[suggestion.type];

  return (
    <div className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <TypeIcon className="h-4 w-4 text-primary" />
          <Badge variant="outline" className="text-xs">
            {suggestion.section}
          </Badge>
          <Badge variant="secondary" className="text-xs capitalize">
            {suggestion.type}
          </Badge>
        </div>
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm text-foreground mb-3">{suggestion.message}</p>

      {suggestion.example && (
        <div className="mb-3 p-2 rounded bg-muted/50 text-xs">
          <p className="font-semibold mb-1">Example:</p>
          <p className="text-muted-foreground">{suggestion.example}</p>
        </div>
      )}

      {suggestion.beforeText && suggestion.afterText && (
        <div className="mb-3 space-y-2">
          <div className="p-2 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
              Before:
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              {suggestion.beforeText}
            </p>
          </div>
          <div className="p-2 rounded bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
              After:
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {suggestion.afterText}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {suggestion.afterText && (
          <Button onClick={onApply} size="sm" className="flex-1">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Apply
          </Button>
        )}
        <Button onClick={onNavigate} size="sm" variant="outline" className="flex-1">
          <Target className="h-3 w-3 mr-1" />
          Go to Section
        </Button>
      </div>
    </div>
  );
}

/**
 * Generate mock suggestions for demonstration
 * In production, this would be replaced with actual AI analysis
 */
function generateMockSuggestions(resume: Resume): Suggestion[] {
  const suggestions: Suggestion[] = [];
  let id = 1;

  // Check for missing sections
  if (!resume.summary || resume.summary.length < 50) {
    suggestions.push({
      id: `sugg-${id++}`,
      type: 'content',
      severity: 'high',
      section: 'summary',
      field: 'content',
      message: 'Add a professional summary to introduce yourself effectively',
      example: 'Results-driven software engineer with 5+ years of experience...',
    });
  }

  // Check experience achievements
  resume.experience.forEach((exp, index) => {
    if (!exp.achievements || exp.achievements.length === 0) {
      suggestions.push({
        id: `sugg-${id++}`,
        type: 'impact',
        severity: 'high',
        section: 'experience',
        field: `experience.${index}.achievements`,
        message: `Add quantifiable achievements to your ${exp.position} role`,
        example:
          'Increased user engagement by 45% through implementation of new features',
      });
    }

    // Check for weak action verbs
    exp.achievements?.forEach((achievement) => {
      if (
        achievement.toLowerCase().includes('did') ||
        achievement.toLowerCase().includes('worked on')
      ) {
        suggestions.push({
          id: `sugg-${id++}`,
          type: 'content',
          severity: 'medium',
          section: 'experience',
          message: 'Replace weak verbs with strong action verbs',
          beforeText: achievement,
          afterText: achievement.replace(
            /did|worked on/gi,
            'accomplished'
          ),
        });
      }
    });
  });

  // Check skills
  if (!resume.skills || resume.skills.length < 5) {
    suggestions.push({
      id: `sugg-${id++}`,
      type: 'keyword',
      severity: 'medium',
      section: 'skills',
      message: 'Add more relevant skills to improve ATS keyword matching',
      example: 'Add both technical and soft skills relevant to your target role',
    });
  }

  // Check for ATS compatibility
  if (resume.template === 'creative') {
    suggestions.push({
      id: `sugg-${id++}`,
      type: 'ats',
      severity: 'low',
      section: 'template',
      message:
        'Consider using an ATS-friendly template for better parsing by applicant tracking systems',
    });
  }

  return suggestions;
}
