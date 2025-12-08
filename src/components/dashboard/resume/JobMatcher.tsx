'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Resume, JobMatchResult } from '@/types/resume';
import { jobMatchApi } from '@/lib/api/resume-api';
import { Target, Loader2, CheckCircle2, XCircle, TrendingUp, Link } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Label } from '@/components/ui/label';

interface JobMatcherProps {
  resume: Resume;
}

export function JobMatcher({ resume }: JobMatcherProps) {
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);

  const handleMatchJob = async () => {
    if (!resume.id) {
      toast.error('Resume must be saved before matching');
      return;
    }

    if (!jobUrl && !jobDescription) {
      toast.error('Please provide a job URL or description');
      return;
    }

    setLoading(true);
    try {
      const result = await jobMatchApi.matchJob(resume.id, jobDescription, jobUrl);
      setMatchResult(result);
      toast.success('Job match analysis complete!');
    } catch (error) {
      toast.error('Failed to match job');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Job Matching
          </CardTitle>
          <CardDescription>
            Analyze how well your resume matches a specific job posting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="url">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">Job URL</TabsTrigger>
              <TabsTrigger value="description">Job Description</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobUrl">Job Posting URL</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="jobUrl"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      placeholder="https://company.com/jobs/123"
                      className="pl-9"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll scrape and analyze the job posting automatically
                </p>
              </div>
            </TabsContent>

            <TabsContent value="description" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Paste Job Description</Label>
                <Textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={8}
                />
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={handleMatchJob} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Match...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Analyze Match
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {matchResult && (
        <>
          {/* Match Score */}
          <Card>
            <CardHeader>
              <CardTitle>Match Score</CardTitle>
              <CardDescription>How well your resume matches this job</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="w-24 h-24">
                    <circle
                      className="text-muted"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="48"
                      cy="48"
                    />
                    <circle
                      className={getMatchColor(matchResult.matchScore)}
                      strokeWidth="8"
                      strokeDasharray={`${matchResult.matchScore * 2.51} 251`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="48"
                      cy="48"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${getMatchColor(matchResult.matchScore)}`}>
                      {Math.round(matchResult.matchScore)}%
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Skills Match</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(matchResult.sectionScores.skills)}/100
                      </span>
                    </div>
                    <Progress value={matchResult.sectionScores.skills} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Experience Match</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(matchResult.sectionScores.experience)}/100
                      </span>
                    </div>
                    <Progress value={matchResult.sectionScores.experience} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Education Match</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(matchResult.sectionScores.education)}/100
                      </span>
                    </div>
                    <Progress value={matchResult.sectionScores.education} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Matched Skills ({matchResult.matchedSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="flex flex-wrap gap-2">
                    {matchResult.matchedSkills.map((skill, idx) => (
                      <Badge key={idx} variant="default" className="bg-green-600">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Missing Skills ({matchResult.missingSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="flex flex-wrap gap-2">
                    {matchResult.missingSkills.map((skill, idx) => (
                      <Badge key={idx} variant="destructive">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recommendations to Improve Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {matchResult.recommendations.map((rec, idx) => (
                    <div key={idx} className="border-l-4 border-primary pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-sm">{rec.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.suggestion}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
