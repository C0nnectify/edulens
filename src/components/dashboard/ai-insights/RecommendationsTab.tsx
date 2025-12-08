'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PriorityBadge } from './PriorityBadge';
import { ImpactEstimator } from './ImpactEstimator';
import type { Recommendation, EffortLevel } from '@/types/insights';
import { useCompleteRecommendation } from '@/hooks/useProfileAnalysis';
import { Target, Clock, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RecommendationsTabProps {
  recommendations: Recommendation[];
  userId: string;
}

export function RecommendationsTab({ recommendations, userId }: RecommendationsTabProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [sortBy, setSortBy] = useState<'priority' | 'impact' | 'effort'>('priority');
  const { mutate: completeRecommendation } = useCompleteRecommendation();

  const filteredRecommendations = recommendations.filter((rec) => {
    if (filter === 'active') return !rec.completed;
    if (filter === 'completed') return rec.completed;
    return true;
  });

  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (sortBy === 'impact') return b.potentialImpact - a.potentialImpact;
    if (sortBy === 'effort') {
      const effortOrder = { low: 1, medium: 2, high: 3 };
      return effortOrder[a.effort] - effortOrder[b.effort];
    }
    return 0;
  });

  const effortIcons: Record<EffortLevel, string> = {
    low: '⚡',
    medium: '⚡⚡',
    high: '⚡⚡⚡',
  };

  const effortLabels: Record<EffortLevel, string> = {
    low: 'Low Effort',
    medium: 'Medium Effort',
    high: 'High Effort',
  };

  const handleToggleComplete = (recommendationId: string, completed: boolean) => {
    if (!completed) {
      completeRecommendation({ recommendationId, userId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Recommendations
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Actionable steps to improve your admission chances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({recommendations.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active ({recommendations.filter((r) => !r.completed).length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed ({recommendations.filter((r) => r.completed).length})
          </Button>
        </div>
      </div>

      {/* Sort Options */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </span>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'priority' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('priority')}
              >
                Priority
              </Button>
              <Button
                variant={sortBy === 'impact' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('impact')}
              >
                Impact
              </Button>
              <Button
                variant={sortBy === 'effort' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('effort')}
              >
                Effort
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {sortedRecommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.05 * index }}
            >
              <Card
                className={cn(
                  'transition-all',
                  recommendation.completed && 'opacity-60 bg-gray-50 dark:bg-gray-900/50'
                )}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={recommendation.completed}
                      onCheckedChange={() =>
                        handleToggleComplete(recommendation.id, recommendation.completed)
                      }
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <CardTitle
                          className={cn(
                            'text-lg',
                            recommendation.completed && 'line-through text-gray-500'
                          )}
                        >
                          {recommendation.title}
                        </CardTitle>
                        {recommendation.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <PriorityBadge priority={recommendation.priority} size="sm" />
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                          <Zap className="h-3 w-3" />
                          {effortLabels[recommendation.effort]}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                          <Clock className="h-3 w-3" />
                          {recommendation.timeline}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {recommendation.description}
                  </p>

                  <ImpactEstimator
                    impact={recommendation.potentialImpact}
                    animated={!recommendation.completed}
                  />

                  {recommendation.actionItems.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Action Steps
                      </h4>
                      <ul className="space-y-2">
                        {recommendation.actionItems.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                          >
                            <span className="text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                              {idx + 1}.
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recommendation.completed && recommendation.completedDate && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4 inline mr-2" />
                      Completed on{' '}
                      {new Date(recommendation.completedDate).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedRecommendations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-500">
                {filter === 'completed'
                  ? 'No completed recommendations yet'
                  : 'No recommendations available'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
