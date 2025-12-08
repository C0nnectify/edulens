'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { FacultyMatch } from '@/types/insights';
import { useAddFacultyToApplication, useGroupedFacultyMatches } from '@/hooks/useFacultyMatches';
import { GraduationCap, Mail, ExternalLink, BookOpen, TrendingUp, CheckCircle2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FacultyMatchesTabProps {
  matches: FacultyMatch[];
  applicationId?: string;
}

export function FacultyMatchesTab({ matches, applicationId }: FacultyMatchesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccepting, setFilterAccepting] = useState(false);
  const [filterFunding, setFilterFunding] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all');

  const { mutate: addToApplication } = useAddFacultyToApplication();
  const groupedMatches = useGroupedFacultyMatches(matches);

  // Filter matches
  const filteredMatches = matches.filter((match) => {
    if (searchTerm && !match.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterAccepting && !match.acceptingStudents) return false;
    if (filterFunding && !match.fundingAvailable) return false;
    if (selectedUniversity !== 'all' && match.universityId !== selectedUniversity) return false;
    return true;
  });

  const universities = Array.from(new Set(matches.map((m) => ({ id: m.universityId, name: m.universityName }))));

  const handleAddToApplication = (facultyId: string) => {
    if (applicationId) {
      addToApplication({ applicationId, facultyId });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Faculty Matches
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Top faculty matches based on your research interests and profile
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="space-y-4">
            <Input
              placeholder="Search by faculty name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="accepting"
                  checked={filterAccepting}
                  onChange={(e) => setFilterAccepting(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="accepting" className="text-sm text-gray-700 dark:text-gray-300">
                  Accepting students
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="funding"
                  checked={filterFunding}
                  onChange={(e) => setFilterFunding(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="funding" className="text-sm text-gray-700 dark:text-gray-300">
                  Funding available
                </label>
              </div>

              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">All Universities</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faculty Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredMatches
          .sort((a, b) => b.matchScore - a.matchScore)
          .map((faculty, index) => (
            <motion.div
              key={faculty.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <Card className={cn(faculty.addedToApplication && 'border-green-500 dark:border-green-600')}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-1">
                        <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span>{faculty.name}</span>
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {faculty.title} • {faculty.department}
                      </p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                        {faculty.universityName}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {faculty.matchScore}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">Match</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Match Reasoning */}
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {faculty.matchReasoning}
                      </p>
                    </div>
                  </div>

                  {/* Research Areas */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Research Areas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {faculty.researchAreas.map((area) => (
                        <Badge key={area} variant="secondary">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Recent Publications */}
                  {faculty.recentPublications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Recent Publications
                      </h4>
                      <ul className="space-y-2">
                        {faculty.recentPublications.slice(0, 2).map((pub, idx) => (
                          <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                            <div className="font-medium">{pub.title}</div>
                            <div className="text-gray-500 dark:text-gray-500">
                              {pub.venue} • {pub.year}
                              {pub.citations && ` • ${pub.citations} citations`}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    {faculty.acceptingStudents && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Accepting Students
                      </Badge>
                    )}
                    {faculty.fundingAvailable && (
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        Funding Available
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {faculty.email && (
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={`mailto:${faculty.email}`}>
                          <Mail className="h-4 w-4" />
                          Email
                        </a>
                      </Button>
                    )}
                    {faculty.profileUrl && (
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={faculty.profileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Profile
                        </a>
                      </Button>
                    )}
                    {applicationId && (
                      <Button
                        size="sm"
                        className="ml-auto gap-2"
                        disabled={faculty.addedToApplication}
                        onClick={() => handleAddToApplication(faculty.id)}
                      >
                        {faculty.addedToApplication ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Add to Application
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>

      {filteredMatches.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-500">
              No faculty matches found. Try adjusting your filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
