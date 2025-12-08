'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImpactEstimatorProps {
  impact: number; // 0-100
  label?: string;
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

export function ImpactEstimator({
  impact,
  label = 'Potential Impact',
  showIcon = true,
  animated = true,
  className,
}: ImpactEstimatorProps) {
  const getImpactLevel = (value: number) => {
    if (value >= 70) return { label: 'Very High', color: 'text-green-600 dark:text-green-400' };
    if (value >= 50) return { label: 'High', color: 'text-blue-600 dark:text-blue-400' };
    if (value >= 30) return { label: 'Moderate', color: 'text-yellow-600 dark:text-yellow-400' };
    if (value >= 15) return { label: 'Low', color: 'text-orange-600 dark:text-orange-400' };
    return { label: 'Very Low', color: 'text-gray-600 dark:text-gray-400' };
  };

  const { label: impactLabel, color } = getImpactLevel(impact);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showIcon && (
        <div className={cn('rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-2', animated && 'animate-pulse')}>
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}

      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className={cn('text-sm font-semibold', color)}>
            {impactLabel} (+{Math.round(impact)}%)
          </span>
        </div>

        <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {animated ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${impact}%`, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full"
            />
          ) : (
            <div
              style={{ width: `${impact}%` }}
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full"
            />
          )}
        </div>
      </div>

      <TrendingUp className={cn('h-5 w-5', color)} />
    </div>
  );
}
