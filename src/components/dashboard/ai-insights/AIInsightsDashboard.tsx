'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { OverviewTab } from './OverviewTab';
import { ProfileAnalysisTab } from './ProfileAnalysisTab';
import { RecommendationsTab } from './RecommendationsTab';
import { FacultyMatchesTab } from './FacultyMatchesTab';
import { TimelineTab } from './TimelineTab';
import { AdmissionProbabilityChart } from './AdmissionProbabilityChart';
import { PeerComparisonChart } from './PeerComparisonChart';
import { SuccessFactorsChart } from './SuccessFactorsChart';
import { ExportInsights } from './ExportInsights';
import { useAIInsights, useRefreshInsights } from '@/hooks/useAIInsights';
import {
  BarChart3,
  TrendingUp,
  Target,
  Users,
  GraduationCap,
  Calendar,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AIInsightsDashboardProps {
  userId: string;
  applicationId?: string;
  className?: string;
}

export function AIInsightsDashboard({
  userId,
  applicationId,
  className,
}: AIInsightsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const { data: insights, isLoading, isError, error } = useAIInsights(userId);
  const { mutate: refreshInsights, isPending: isRefreshing } = useRefreshInsights();

  const handleRefresh = () => {
    refreshInsights({
      userId,
      applicationIds: applicationId ? [applicationId] : undefined,
      forceRecalculation: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Generating AI insights...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading insights</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load AI insights. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!insights) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No insights available</AlertTitle>
        <AlertDescription>
          Complete your profile to generate AI-powered insights and recommendations.
        </AlertDescription>
      </Alert>
    );
  }

  const tabConfig = [
    {
      value: 'overview',
      label: 'Overview',
      icon: BarChart3,
      badge: null,
    },
    {
      value: 'analysis',
      label: 'Profile Analysis',
      icon: TrendingUp,
      badge: null,
    },
    {
      value: 'recommendations',
      label: 'Recommendations',
      icon: Target,
      badge: insights.recommendations.filter((r) => !r.completed).length,
    },
    {
      value: 'faculty',
      label: 'Faculty Matches',
      icon: GraduationCap,
      badge: insights.facultyMatches.length,
    },
    {
      value: 'timeline',
      label: 'Timeline',
      icon: Calendar,
      badge: insights.timeline.filter((t) => !t.completed).length,
    },
    {
      value: 'charts',
      label: 'Charts',
      icon: Users,
      badge: null,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              AI Insights Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Last updated: {new Date(insights.generatedAt).toLocaleString()}
            </p>
          </div>

          <Button
            onClick={() => setShowExportDialog(true)}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2 relative">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge !== null && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab
              insights={insights.overall}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <ProfileAnalysisTab
              strengths={insights.strengths}
              weaknesses={insights.weaknesses}
              comparisons={insights.comparisons}
            />
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6">
            <RecommendationsTab recommendations={insights.recommendations} userId={userId} />
          </TabsContent>

          <TabsContent value="faculty" className="mt-6">
            <FacultyMatchesTab
              matches={insights.facultyMatches}
              applicationId={applicationId}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <TimelineTab timeline={insights.timeline} />
          </TabsContent>

          <TabsContent value="charts" className="mt-6">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Detailed Charts & Analytics
              </h2>

              {insights.trends && (
                <AdmissionProbabilityChart
                  trends={insights.trends}
                  scenarios={insights.scenarios}
                  currentProbability={insights.overall.admissionProbabilityAverage}
                />
              )}

              <PeerComparisonChart comparisons={insights.comparisons} />

              <SuccessFactorsChart factors={insights.successFactors} />
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportInsights
          insights={insights}
          userId={userId}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </motion.div>
  );
}
