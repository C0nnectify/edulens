'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Briefcase,
  MapPin,
  Clock,
  TrendingUp,
  FileText,
  Download,
  ExternalLink,
  Loader2,
  Sparkles,
  Target,
  BookmarkPlus,
} from 'lucide-react';
import { JobPosting, scrapeJobs, matchResumeToJob, generateCoverLetter } from '@/lib/ai/job-scraper';
import { Resume } from '@/types/resume';
import { motion } from 'framer-motion';

interface JobMatchingPanelProps {
  resume: Resume;
}

export function JobMatchingPanel({ resume }: JobMatchingPanelProps) {
  const [searchKeywords, setSearchKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState<(JobPosting & { matchScore?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const keywords = searchKeywords.split(',').map(k => k.trim());
      const scrapedJobs = await scrapeJobs({
        keywords,
        location,
        type: ['internship', 'full-time'],
      });

      // Match each job with the resume
      const jobsWithScores = await Promise.all(
        scrapedJobs.map(async (job) => {
          const matchScore = await matchResumeToJob(resume, job);
          return { ...job, matchScore };
        })
      );

      // Sort by match score
      jobsWithScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setJobs(jobsWithScores);
    } catch (error) {
      console.error('Job search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCoverLetter = async (job: JobPosting) => {
    try {
      const coverLetter = await generateCoverLetter(resume, job);
      setGeneratedCoverLetter(coverLetter);
      setSelectedJob(job);
    } catch (error) {
      console.error('Cover letter generation failed:', error);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Search Panel */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Find Your Dream Job
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Keywords (e.g., Software Engineer, Data Science)"
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              className="md:col-span-2 bg-white"
            />
            <Input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-white"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading || !searchKeywords}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search Jobs
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="jobs">
            Job Matches ({jobs.length})
          </TabsTrigger>
          <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          {jobs.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No jobs yet
                </h3>
                <p className="text-slate-600">
                  Search for jobs to see AI-powered matches based on your resume
                </p>
              </CardContent>
            </Card>
          )}

          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {job.title}
                        </h3>
                        <Badge variant="outline">{job.type}</Badge>
                      </div>
                      <p className="text-slate-700 font-medium mb-1">{job.company}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(job.postedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {job.matchScore !== undefined && (
                      <div className={`px-4 py-2 rounded-lg border ${getMatchScoreColor(job.matchScore)}`}>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{job.matchScore}%</div>
                          <div className="text-xs">Match</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  {job.salary && (
                    <div className="mb-4">
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {job.salary}
                      </Badge>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requirements?.slice(0, 3).map((req, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {req.length > 40 ? req.substring(0, 40) + '...' : req}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(job.url, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Job
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateCoverLetter(job)}
                      className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Sparkles className="h-3 w-3" />
                      Generate Cover Letter
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-2">
                      <BookmarkPlus className="h-3 w-3" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="cover-letter">
          {generatedCoverLetter ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Cover Letter for {selectedJob?.title}
                  </CardTitle>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 bg-slate-50 p-6 rounded-lg border">
                  {generatedCoverLetter}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No cover letter generated yet
                </h3>
                <p className="text-slate-600">
                  Click "Generate Cover Letter" on any job to create a personalized cover letter
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
