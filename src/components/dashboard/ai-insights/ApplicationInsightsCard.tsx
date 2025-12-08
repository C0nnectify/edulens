'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileStrengthMeter } from './ProfileStrengthMeter';
import type { ApplicationInsights } from '@/types/insights';
import { TrendingUp, TrendingDown, Target, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ApplicationInsightsCardProps {
  insights: ApplicationInsights;
  onViewDetails?: () => void;
  className?: string;
}

export function ApplicationInsightsCard({
  insights,
  onViewDetails,
  className,
}: ApplicationInsightsCardProps) {
  const { prediction, topStrength, topWeakness, universityName, programName } = insights;

  const categoryColors = {
    reach: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    target: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    safety: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-1 truncate">{universityName}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {programName}
              </p>
            </div>

            <Badge className={cn('ml-2 flex-shrink-0', categoryColors[prediction.category])}>
              {prediction.category.charAt(0).toUpperCase() + prediction.category.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Admission Probability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Admission Probability
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {Math.round(prediction.probability)}%
              </span>
            </div>
            <ProfileStrengthMeter score={prediction.probability} />
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-500">
              <span>
                Range: {Math.round(prediction.confidenceInterval[0])}% -{' '}
                {Math.round(prediction.confidenceInterval[1])}%
              </span>
            </div>
          </div>

          {/* Top Strength */}
          <div className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-start gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Top Strength
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {topStrength.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                    +{topStrength.impact}% impact
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {topStrength.percentile}th percentile
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Weakness */}
          <div className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-start gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Top Weakness
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {topWeakness.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                    -{topWeakness.impact}% impact
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {topWeakness.percentile}th percentile
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Factors */}
          {prediction.keyFactors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Key Factors
              </h4>
              <div className="space-y-1">
                {prediction.keyFactors.slice(0, 3).map((factor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                      {factor.name}
                    </span>
                    <span
                      className={cn(
                        'font-semibold ml-2',
                        factor.impact > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {factor.impact > 0 ? '+' : ''}
                      {Math.round(factor.impact)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View Details Button */}
          {onViewDetails && (
            <Button
              onClick={onViewDetails}
              variant="outline"
              className="w-full gap-2"
              size="sm"
            >
              <Sparkles className="h-4 w-4" />
              View Full Analysis
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
