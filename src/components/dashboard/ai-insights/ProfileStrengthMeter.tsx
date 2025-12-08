'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileStrengthMeterProps {
  score: number; // 0-100
  label?: string;
  showPercentile?: boolean;
  percentile?: number;
  comparison?: 'above' | 'below' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProfileStrengthMeter({
  score,
  label,
  showPercentile = false,
  percentile,
  comparison,
  size = 'md',
  className,
}: ProfileStrengthMeterProps) {
  // Determine color based on score
  const getColor = (value: number) => {
    if (value >= 80) return 'bg-green-500 dark:bg-green-600';
    if (value >= 60) return 'bg-blue-500 dark:bg-blue-600';
    if (value >= 40) return 'bg-yellow-500 dark:bg-yellow-600';
    if (value >= 20) return 'bg-orange-500 dark:bg-orange-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  const getTextColor = (value: number) => {
    if (value >= 80) return 'text-green-600 dark:text-green-400';
    if (value >= 60) return 'text-blue-600 dark:text-blue-400';
    if (value >= 40) return 'text-yellow-600 dark:text-yellow-400';
    if (value >= 20) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const ComparisonIcon = comparison === 'above' ? TrendingUp : comparison === 'below' ? TrendingDown : Minus;
  const comparisonColor =
    comparison === 'above'
      ? 'text-green-600 dark:text-green-400'
      : comparison === 'below'
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-600 dark:text-gray-400';

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <div className="flex items-center gap-2">
            {comparison && (
              <ComparisonIcon className={cn('h-4 w-4', comparisonColor)} />
            )}
            <span className={cn('text-sm font-semibold', getTextColor(score))}>
              {Math.round(score)}%
            </span>
            {showPercentile && percentile !== undefined && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({percentile}th percentile)
              </span>
            )}
          </div>
        </div>
      )}

      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn(
            'rounded-full transition-colors',
            sizeClasses[size],
            getColor(score)
          )}
        />
      </div>
    </div>
  );
}
