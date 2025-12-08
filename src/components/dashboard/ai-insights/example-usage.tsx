/**
 * Example Usage of AI Insights Dashboard Components
 *
 * This file demonstrates various ways to use the AI Insights components
 * in different contexts within your application.
 */

'use client';

import React from 'react';
import {
  AIInsightsDashboard,
  ApplicationInsightsCard,
  ProfileStrengthMeter,
  PriorityBadge,
  ImpactEstimator,
  ProgressTracker,
  InsightNotification,
  NotificationCenter,
} from './index';
import type {
  ApplicationInsights,
  InsightNotification as InsightNotificationType,
} from '@/types/insights';

// ============================================================================
// Example 1: Full Dashboard Page
// ============================================================================

export function InsightsDashboardPage() {
  // In a real app, get this from your auth session
  const userId = 'user-123';

  return (
    <div className="container mx-auto p-6">
      <AIInsightsDashboard userId={userId} />
    </div>
  );
}

// ============================================================================
// Example 2: Application-Specific Insights
// ============================================================================

export function ApplicationDetailPage({ applicationId }: { applicationId: string }) {
  const userId = 'user-123';

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Stanford University - CS PhD</h1>
        <p className="text-gray-600 dark:text-gray-400">Application Details & Insights</p>
      </div>

      {/* Application-specific insights */}
      <AIInsightsDashboard
        userId={userId}
        applicationId={applicationId}
      />
    </div>
  );
}

// ============================================================================
// Example 3: Application Cards Grid
// ============================================================================

export function ApplicationsGridView() {
  // Mock data - in real app, fetch from API
  const applications: ApplicationInsights[] = [
    {
      applicationId: 'app-1',
      universityName: 'Stanford University',
      programName: 'Computer Science PhD',
      prediction: {
        universityId: 'stanford',
        universityName: 'Stanford University',
        programName: 'Computer Science PhD',
        probability: 45,
        confidenceInterval: [38, 52],
        category: 'reach',
        keyFactors: [
          {
            category: 'research',
            name: 'Strong research experience',
            impact: 15,
            description: 'Published papers in top venues',
          },
          {
            category: 'test_scores',
            name: 'GRE scores below average',
            impact: -8,
            description: 'Quant: 165, Verbal: 160',
          },
        ],
        lastUpdated: new Date(),
      },
      topStrength: {
        id: 'strength-1',
        category: 'research',
        title: 'Strong Research Experience',
        description: '3 publications in top-tier conferences',
        percentile: 85,
        score: 90,
        evidence: ['CVPR 2024', 'NeurIPS 2023', 'ICML 2023'],
        impact: 20,
      },
      topWeakness: {
        id: 'weakness-1',
        category: 'test_scores',
        title: 'GRE Scores',
        description: 'Below admitted average for top programs',
        percentile: 62,
        score: 75,
        gap: -15,
        impact: 10,
        addressable: true,
      },
      relevantRecommendations: [],
      facultyMatches: [],
      successFactors: [],
    },
    // Add more applications...
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Applications</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.map((app) => (
          <ApplicationInsightsCard
            key={app.applicationId}
            insights={app}
            onViewDetails={() => {
              // Navigate to application detail page
              console.log('View details for', app.applicationId);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Example 4: Dashboard Overview with Metrics
// ============================================================================

export function DashboardOverview() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Profile Score */}
        <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
            Profile Score
          </h3>
          <ProfileStrengthMeter
            score={82}
            label="Overall"
            showPercentile
            percentile={78}
            comparison="above"
            size="lg"
          />
        </div>

        {/* Admission Probability */}
        <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
            Avg. Admission Probability
          </h3>
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            58%
          </div>
          <ProfileStrengthMeter score={58} size="lg" />
        </div>

        {/* Application Progress */}
        <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
            Application Progress
          </h3>
          <ProgressTracker
            steps={[
              { id: '1', label: 'GRE', completed: true },
              { id: '2', label: 'SOP', completed: true },
              { id: '3', label: 'LORs', completed: false, current: true },
              { id: '4', label: 'Apps', completed: false },
            ]}
            orientation="horizontal"
          />
        </div>
      </div>

      {/* Full insights dashboard */}
      <AIInsightsDashboard userId="user-123" />
    </div>
  );
}

// ============================================================================
// Example 5: Recommendations Widget
// ============================================================================

export function RecommendationsWidget() {
  return (
    <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Top Recommendations</h3>
        <PriorityBadge priority="high" size="sm" />
      </div>

      <div className="space-y-4">
        {/* Recommendation 1 */}
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <h4 className="font-medium mb-2">Retake GRE Quantitative</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Your quant score is below the average for top programs. Aim for 168+.
          </p>
          <ImpactEstimator impact={25} label="Expected Impact" animated />
        </div>

        {/* Recommendation 2 */}
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <h4 className="font-medium mb-2">Publish Research Paper</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Submit your current research to a conference by December.
          </p>
          <ImpactEstimator impact={35} label="Expected Impact" animated />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Notifications System
// ============================================================================

export function NotificationsExample() {
  const [notifications, setNotifications] = React.useState<InsightNotificationType[]>([
    {
      id: 'notif-1',
      type: 'probability_change',
      severity: 'success',
      title: 'Admission Probability Increased!',
      message: 'Your Stanford admission probability increased from 42% to 48% after adding your publication.',
      actionLabel: 'View Details',
      actionUrl: '/insights',
      read: false,
      createdAt: new Date(),
    },
    {
      id: 'notif-2',
      type: 'deadline_alert',
      severity: 'warning',
      title: 'Deadline Approaching',
      message: 'MIT application deadline in 7 days',
      actionLabel: 'Go to Application',
      actionUrl: '/applications/mit',
      read: false,
      createdAt: new Date(),
    },
  ]);

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleAction = (notification: InsightNotificationType) => {
    console.log('Action clicked for', notification.id);
    // Navigate to actionUrl
  };

  return (
    <NotificationCenter
      notifications={notifications}
      onDismiss={handleDismiss}
      onAction={handleAction}
      maxVisible={3}
    />
  );
}

// ============================================================================
// Example 7: Standalone Components in Custom Layout
// ============================================================================

export function CustomInsightsLayout() {
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Metrics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Profile Strength</h3>
            <ProfileStrengthMeter
              score={85}
              label="GPA"
              showPercentile
              percentile={82}
              comparison="above"
            />
            <div className="my-4" />
            <ProfileStrengthMeter
              score={72}
              label="Test Scores"
              showPercentile
              percentile={65}
              comparison="neutral"
            />
            <div className="my-4" />
            <ProfileStrengthMeter
              score={90}
              label="Research"
              showPercentile
              percentile={88}
              comparison="above"
            />
          </div>

          <RecommendationsWidget />
        </div>

        {/* Right Column - Full Dashboard */}
        <div className="lg:col-span-2">
          <AIInsightsDashboard userId="user-123" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 8: Mobile-Optimized View
// ============================================================================

export function MobileInsightsView() {
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Insights</h1>

      {/* Compact metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Profile</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">82</div>
        </div>
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Probability</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">58%</div>
        </div>
      </div>

      {/* Full dashboard */}
      <AIInsightsDashboard userId="user-123" />
    </div>
  );
}

// ============================================================================
// Example 9: Using Hooks Directly
// ============================================================================

export function CustomHooksExample() {
  const userId = 'user-123';

  // Fetch insights
  const { data: insights, isLoading, refetch } = useAIInsights(userId);
  const { mutate: refresh, isPending } = useRefreshInsights();

  if (isLoading) {
    return <div>Loading insights...</div>;
  }

  if (!insights) {
    return <div>No insights available</div>;
  }

  const handleRefresh = () => {
    refresh({ userId, forceRecalculation: true });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Custom Insights View</h1>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          {isPending ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Custom layout using insights data */}
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-6 rounded-lg border">
            <div className="text-sm text-gray-600 mb-2">Profile Score</div>
            <div className="text-3xl font-bold">{Math.round(insights.overall.profileScore)}</div>
          </div>
          <div className="p-6 rounded-lg border">
            <div className="text-sm text-gray-600 mb-2">Applications</div>
            <div className="text-3xl font-bold">{insights.predictions.length}</div>
          </div>
          <div className="p-6 rounded-lg border">
            <div className="text-sm text-gray-600 mb-2">Faculty Matches</div>
            <div className="text-3xl font-bold">{insights.facultyMatches.length}</div>
          </div>
        </div>

        {/* Use insights data however you want */}
        <pre className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-auto">
          {JSON.stringify(insights.overall, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// Import hook for the custom example
import { useAIInsights, useRefreshInsights } from '@/hooks/useAIInsights';

// ============================================================================
// Example 10: Error Handling
// ============================================================================

export function InsightsWithErrorHandling() {
  const userId = 'user-123';
  const { data, isLoading, isError, error } = useAIInsights(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Error Loading Insights
        </h3>
        <p className="text-red-700 dark:text-red-300">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 rounded-lg border border-gray-200">
        <p className="text-gray-600">No insights available yet. Complete your profile to get started.</p>
      </div>
    );
  }

  return <AIInsightsDashboard userId={userId} />;
}
