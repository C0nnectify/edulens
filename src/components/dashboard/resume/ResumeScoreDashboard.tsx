'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Resume } from '@/types/resume';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  Target,
  Award,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ResumeScoreDashboardProps {
  resume: Resume;
  className?: string;
}

interface ScoreMetric {
  name: string;
  score: number;
  weight: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'critical';
  suggestions: string[];
  icon: React.ReactNode;
}

export function ResumeScoreDashboard({ resume, className }: ResumeScoreDashboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate individual scores
  const scores = useMemo((): ScoreMetric[] => {
    const metrics: ScoreMetric[] = [];

    // Completeness Score (25% weight)
    const completenessScore = calculateCompletenessScore(resume);
    metrics.push({
      name: 'Completeness',
      score: completenessScore,
      weight: 25,
      status: getScoreStatus(completenessScore),
      suggestions: getCompletenessSuggestions(resume),
      icon: <FileText className="h-4 w-4" />,
    });

    // ATS Optimization Score (30% weight)
    const atsScore = calculateATSScore(resume);
    metrics.push({
      name: 'ATS Optimization',
      score: atsScore,
      weight: 30,
      status: getScoreStatus(atsScore),
      suggestions: getATSSuggestions(resume),
      icon: <Target className="h-4 w-4" />,
    });

    // Impact Score (25% weight)
    const impactScore = calculateImpactScore(resume);
    metrics.push({
      name: 'Impact',
      score: impactScore,
      weight: 25,
      status: getScoreStatus(impactScore),
      suggestions: getImpactSuggestions(resume),
      icon: <TrendingUp className="h-4 w-4" />,
    });

    // Length Optimization Score (20% weight)
    const lengthScore = calculateLengthScore(resume);
    metrics.push({
      name: 'Length',
      score: lengthScore,
      weight: 20,
      status: getScoreStatus(lengthScore),
      suggestions: getLengthSuggestions(resume),
      icon: <Award className="h-4 w-4" />,
    });

    return metrics;
  }, [resume]);

  // Calculate overall score
  const overallScore = useMemo(() => {
    return Math.round(
      scores.reduce((acc, metric) => acc + (metric.score * metric.weight) / 100, 0)
    );
  }, [scores]);

  const overallStatus = getScoreStatus(overallScore);

  return (
    <Card className={cn('border-2', className)}>
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                'p-2 rounded-full',
                overallStatus === 'excellent' && 'bg-green-100 text-green-600',
                overallStatus === 'good' && 'bg-blue-100 text-blue-600',
                overallStatus === 'needs-improvement' && 'bg-yellow-100 text-yellow-600',
                overallStatus === 'critical' && 'bg-red-100 text-red-600'
              )}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Award className="h-5 w-5" />
            </motion.div>
            <div>
              <CardTitle className="text-lg">Resume Score</CardTitle>
              <CardDescription>Real-time analysis and optimization</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div
                className={cn(
                  'text-3xl font-bold',
                  overallStatus === 'excellent' && 'text-green-600',
                  overallStatus === 'good' && 'text-blue-600',
                  overallStatus === 'needs-improvement' && 'text-yellow-600',
                  overallStatus === 'critical' && 'text-red-600'
                )}
              >
                {overallScore}
              </div>
              <div className="text-xs text-muted-foreground">out of 100</div>
            </div>
            <Button variant="ghost" size="icon">
              {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-6">
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Score</span>
              <Badge
                variant={
                  overallStatus === 'excellent' || overallStatus === 'good'
                    ? 'default'
                    : 'destructive'
                }
              >
                {overallStatus === 'excellent' && 'Excellent'}
                {overallStatus === 'good' && 'Good'}
                {overallStatus === 'needs-improvement' && 'Needs Improvement'}
                {overallStatus === 'critical' && 'Critical'}
              </Badge>
            </div>
            <Progress
              value={overallScore}
              className={cn(
                'h-3',
                overallStatus === 'excellent' && '[&>div]:bg-green-600',
                overallStatus === 'good' && '[&>div]:bg-blue-600',
                overallStatus === 'needs-improvement' && '[&>div]:bg-yellow-600',
                overallStatus === 'critical' && '[&>div]:bg-red-600'
              )}
            />
          </div>

          {/* Individual Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scores.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'p-1.5 rounded',
                        metric.status === 'excellent' && 'bg-green-100 text-green-600',
                        metric.status === 'good' && 'bg-blue-100 text-blue-600',
                        metric.status === 'needs-improvement' && 'bg-yellow-100 text-yellow-600',
                        metric.status === 'critical' && 'bg-red-100 text-red-600'
                      )}
                    >
                      {metric.icon}
                    </div>
                    <span className="text-sm font-medium">{metric.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{metric.score}%</span>
                    {metric.status === 'excellent' && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {metric.status === 'good' && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    )}
                    {metric.status === 'needs-improvement' && (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                    {metric.status === 'critical' && (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
                <Progress
                  value={metric.score}
                  className={cn(
                    'h-2',
                    metric.status === 'excellent' && '[&>div]:bg-green-600',
                    metric.status === 'good' && '[&>div]:bg-blue-600',
                    metric.status === 'needs-improvement' && '[&>div]:bg-yellow-600',
                    metric.status === 'critical' && '[&>div]:bg-red-600'
                  )}
                />
                {metric.suggestions.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                    {metric.suggestions.slice(0, 2).map((suggestion, i) => (
                      <li key={i} className="list-disc">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-medium">
              <TrendingUp className="h-4 w-4" />
              <span>Quick Tips to Improve</span>
            </div>
            <ul className="text-sm text-blue-800 space-y-1 pl-6">
              {getTopSuggestions(scores).map((suggestion, index) => (
                <li key={index} className="list-disc">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Helper functions

function getScoreStatus(score: number): 'excellent' | 'good' | 'needs-improvement' | 'critical' {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'critical';
}

function calculateCompletenessScore(resume: Resume): number {
  let score = 0;
  const maxScore = 100;

  // Personal Info (20 points)
  if (resume.personalInfo?.fullName) score += 5;
  if (resume.personalInfo?.email) score += 5;
  if (resume.personalInfo?.phone) score += 5;
  if (resume.personalInfo?.location) score += 5;

  // Professional Summary (15 points)
  if (resume.summary && resume.summary.length >= 100) score += 15;
  else if (resume.summary) score += 7;

  // Experience (25 points)
  if (resume.experience?.length >= 3) score += 25;
  else if (resume.experience?.length >= 2) score += 18;
  else if (resume.experience?.length >= 1) score += 10;

  // Education (15 points)
  if (resume.education?.length >= 1) score += 15;

  // Skills (15 points)
  if (resume.skills?.length >= 10) score += 15;
  else if (resume.skills?.length >= 5) score += 10;
  else if (resume.skills?.length >= 3) score += 5;

  // Projects/Certifications (10 points)
  if (resume.projects?.length || resume.certifications?.length) score += 10;

  return Math.min(score, maxScore);
}

function calculateATSScore(resume: Resume): number {
  let score = 100;

  // Deduct points for missing key sections
  if (!resume.personalInfo?.email) score -= 20;
  if (!resume.experience || resume.experience.length === 0) score -= 30;
  if (!resume.education || resume.education.length === 0) score -= 20;
  if (!resume.skills || resume.skills.length < 5) score -= 15;

  // Check for proper formatting
  const hasProperDates = resume.experience?.every((exp) => exp.startDate && (exp.endDate || exp.current));
  if (!hasProperDates) score -= 10;

  // Check for keywords in experience
  const hasKeywords = resume.experience?.some((exp) => exp.achievements?.length > 0);
  if (!hasKeywords) score -= 5;

  return Math.max(score, 0);
}

function calculateImpactScore(resume: Resume): number {
  let score = 0;

  // Check for quantifiable achievements
  const achievements = resume.experience?.flatMap((exp) => exp.achievements || []) || [];
  const hasNumbers = achievements.some((achievement) =>
    /\d+%|\d+\+|\$\d+|\d+ (million|thousand|hundred)/.test(achievement)
  );

  if (hasNumbers) score += 40;
  else if (achievements.length > 0) score += 20;

  // Check for action verbs
  const actionVerbs = [
    'led',
    'managed',
    'developed',
    'created',
    'implemented',
    'achieved',
    'increased',
    'decreased',
    'improved',
    'optimized',
  ];
  const hasActionVerbs = achievements.some((achievement) =>
    actionVerbs.some((verb) => achievement.toLowerCase().includes(verb))
  );

  if (hasActionVerbs) score += 30;

  // Check for project impact
  if (resume.projects?.length && resume.projects.length > 0) score += 30;

  return Math.min(score, 100);
}

function calculateLengthScore(resume: Resume): number {
  // Ideal resume length is 1-2 pages (approximately 400-800 words)
  const wordCount = estimateWordCount(resume);

  if (wordCount >= 400 && wordCount <= 800) return 100;
  if (wordCount >= 300 && wordCount <= 1000) return 80;
  if (wordCount >= 200 && wordCount <= 1200) return 60;
  if (wordCount < 200) return 30;
  return 40; // Too long
}

function estimateWordCount(resume: Resume): number {
  let count = 0;

  if (resume.summary) count += resume.summary.split(/\s+/).length;

  resume.experience?.forEach((exp) => {
    count += exp.position.split(/\s+/).length;
    exp.achievements?.forEach((achievement) => {
      count += achievement.split(/\s+/).length;
    });
  });

  resume.education?.forEach((edu) => {
    count += edu.degree.split(/\s+/).length;
    count += edu.field.split(/\s+/).length;
  });

  return count;
}

function getCompletenessSuggestions(resume: Resume): string[] {
  const suggestions: string[] = [];

  if (!resume.personalInfo?.phone) suggestions.push('Add phone number');
  if (!resume.personalInfo?.location) suggestions.push('Add location');
  if (!resume.summary || resume.summary.length < 100)
    suggestions.push('Add a compelling professional summary (150-300 characters)');
  if (!resume.experience || resume.experience.length < 2)
    suggestions.push('Add more work experience entries');
  if (!resume.skills || resume.skills.length < 10) suggestions.push('Add more relevant skills');
  if (!resume.projects?.length && !resume.certifications?.length)
    suggestions.push('Add projects or certifications to stand out');

  return suggestions;
}

function getATSSuggestions(resume: Resume): string[] {
  const suggestions: string[] = [];

  if (!resume.personalInfo?.email) suggestions.push('Add email address (required)');
  if (!resume.experience?.length) suggestions.push('Add work experience (critical for ATS)');
  if (!resume.skills || resume.skills.length < 5)
    suggestions.push('Add at least 5 relevant skills with keywords');

  const hasProperDates = resume.experience?.every((exp) => exp.startDate && (exp.endDate || exp.current));
  if (!hasProperDates) suggestions.push('Ensure all experience entries have proper dates');

  return suggestions;
}

function getImpactSuggestions(resume: Resume): string[] {
  const suggestions: string[] = [];

  const achievements = resume.experience?.flatMap((exp) => exp.achievements || []) || [];
  const hasNumbers = achievements.some((achievement) =>
    /\d+%|\d+\+|\$\d+|\d+ (million|thousand|hundred)/.test(achievement)
  );

  if (!hasNumbers)
    suggestions.push('Add quantifiable achievements with numbers (e.g., "Increased sales by 30%")');
  if (achievements.length < 3) suggestions.push('Add more achievements to each experience entry');
  if (!resume.projects?.length) suggestions.push('Showcase projects to demonstrate impact');

  return suggestions;
}

function getLengthSuggestions(resume: Resume): string[] {
  const suggestions: string[] = [];
  const wordCount = estimateWordCount(resume);

  if (wordCount < 300) suggestions.push('Add more details to reach optimal length (400-800 words)');
  if (wordCount > 1000) suggestions.push('Consider condensing content to 1-2 pages');
  if (resume.experience?.some((exp) => (exp.achievements?.length || 0) > 5))
    suggestions.push('Limit bullet points to 3-5 per position');

  return suggestions;
}

function getTopSuggestions(scores: ScoreMetric[]): string[] {
  // Get the lowest scoring metrics
  const sortedScores = [...scores].sort((a, b) => a.score - b.score);
  const topSuggestions: string[] = [];

  for (const metric of sortedScores.slice(0, 2)) {
    if (metric.suggestions.length > 0) {
      topSuggestions.push(...metric.suggestions.slice(0, 1));
    }
  }

  return topSuggestions.slice(0, 3);
}
