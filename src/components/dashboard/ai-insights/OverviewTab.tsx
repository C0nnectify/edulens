'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileStrengthMeter } from './ProfileStrengthMeter';
import { PriorityBadge } from './PriorityBadge';
import type { OverallInsights } from '@/types/insights';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OverviewTabProps {
  insights: OverallInsights;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function OverviewTab({ insights, onRefresh, isRefreshing }: OverviewTabProps) {
  const {
    profileScore,
    admissionProbabilityAverage,
    reachCount,
    targetCount,
    safetyCount,
    topStrengths,
    criticalWeaknesses,
    nextActions,
    dataCompleteness,
  } = insights;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            AI Insights Overview
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive analysis of your application profile
          </p>
        </div>
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh Insights
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Overall Profile Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(profileScore)}
                </span>
                <span className="text-lg text-gray-500 dark:text-gray-500">/100</span>
              </div>
              <ProfileStrengthMeter score={profileScore} className="mt-3" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Admission Probability */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg. Admission Probability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {Math.round(admissionProbabilityAverage)}%
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Target className="h-4 w-4" />
                <span>Across all applications</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Application Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Application Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Reach:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{reachCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Target:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {targetCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Safety:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {safetyCount}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Completeness */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Profile Completeness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(dataCompleteness)}%
                </span>
              </div>
              <ProfileStrengthMeter score={dataCompleteness} className="mt-3" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Top Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topStrengths.map((strength, index) => (
              <motion.div
                key={strength.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {strength.title}
                  </h4>
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {strength.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {strength.percentile}th percentile
                  </span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    +{strength.impact}% impact
                  </span>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Critical Weaknesses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Critical Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalWeaknesses.map((weakness, index) => (
              <motion.div
                key={weakness.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {weakness.title}
                  </h4>
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {weakness.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {weakness.percentile}th percentile
                  </span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {weakness.impact}% impact
                  </span>
                </div>
                {weakness.addressable && (
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    Can be improved before deadline
                  </div>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Quick Action Items
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            High-impact actions to improve your chances
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nextActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex-shrink-0">
                  <PriorityBadge priority={action.priority} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                    {action.description}
                  </p>
                </div>
                <div className="flex-shrink-0 text-sm font-semibold text-purple-600 dark:text-purple-400">
                  +{action.potentialImpact}%
                </div>
                <Button size="sm" variant="ghost" className="flex-shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
