'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ResumeAnalysis, Resume } from '@/types/resume';
import { analysisApi } from '@/lib/api/resume-api';
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface AIAnalysisDashboardProps {
  resume: Resume;
  analysis?: ResumeAnalysis;
  onAnalysisComplete?: (analysis: ResumeAnalysis) => void;
}

export function AIAnalysisDashboard({ resume, analysis: initialAnalysis, onAnalysisComplete }: AIAnalysisDashboardProps) {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | undefined>(initialAnalysis);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!resume.id) {
      toast.error('Resume must be saved before analysis');
      return;
    }

    setLoading(true);
    try {
      const result = await analysisApi.analyzeResume(resume.id);
      setAnalysis(result);
      onAnalysisComplete?.(result);
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze resume');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Resume Analysis
          </CardTitle>
          <CardDescription>
            Get intelligent feedback on your resume with actionable suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready to analyze your resume?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Our AI will review your resume and provide detailed feedback on content, formatting, ATS compatibility, and more.
            </p>
            <Button onClick={handleAnalyze} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Resume
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Overall Resume Score</CardTitle>
              <CardDescription>Based on multiple factors including ATS compatibility</CardDescription>
            </div>
            <Button onClick={handleAnalyze} disabled={loading} variant="outline">
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Re-analyze
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg className="w-32 h-32">
                <circle
                  className="text-muted"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="52"
                  cx="64"
                  cy="64"
                />
                <circle
                  className={getScoreColor(analysis.overallScore)}
                  strokeWidth="8"
                  strokeDasharray={`${analysis.overallScore * 3.27} 327`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="52"
                  cx="64"
                  cy="64"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {Math.round(analysis.overallScore)}
                </span>
                <span className="text-xs text-muted-foreground">{getScoreLabel(analysis.overallScore)}</span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Content Quality</span>
                  <span className="text-sm text-muted-foreground">{Math.round(analysis.scores.content.score)}/100</span>
                </div>
                <Progress value={analysis.scores.content.score} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Formatting</span>
                  <span className="text-sm text-muted-foreground">{Math.round(analysis.scores.formatting.score)}/100</span>
                </div>
                <Progress value={analysis.scores.formatting.score} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Keywords</span>
                  <span className="text-sm text-muted-foreground">{Math.round(analysis.scores.keywords.score)}/100</span>
                </div>
                <Progress value={analysis.scores.keywords.score} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">ATS Compatibility</span>
                  <span className="text-sm text-muted-foreground">{Math.round(analysis.scores.ats.score)}/100</span>
                </div>
                <Progress value={analysis.scores.ats.score} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Impact</span>
                  <span className="text-sm text-muted-foreground">{Math.round(analysis.scores.impact.score)}/100</span>
                </div>
                <Progress value={analysis.scores.impact.score} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <ul className="space-y-2">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <ul className="space-y-2">
                {analysis.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* ATS Compatibility */}
      {analysis.estimatedAtsPassRate !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ATS Pass Rate Estimate
            </CardTitle>
            <CardDescription>
              Likelihood of passing Applicant Tracking Systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={analysis.estimatedAtsPassRate} className="h-4" />
              </div>
              <span className={`text-2xl font-bold ${getScoreColor(analysis.estimatedAtsPassRate)}`}>
                {Math.round(analysis.estimatedAtsPassRate)}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
