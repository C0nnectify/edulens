'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ComparisonBarProps {
  category: string;
  userValue: number;
  averageValue: number;
  admittedAverageValue?: number;
  maxValue?: number;
  showLegend?: boolean;
  animated?: boolean;
  className?: string;
}

export function ComparisonBar({
  category,
  userValue,
  averageValue,
  admittedAverageValue,
  maxValue = 100,
  showLegend = true,
  animated = true,
  className,
}: ComparisonBarProps) {
  const userPercent = (userValue / maxValue) * 100;
  const averagePercent = (averageValue / maxValue) * 100;
  const admittedPercent = admittedAverageValue ? (admittedAverageValue / maxValue) * 100 : null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category}</span>
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {Math.round(userValue)}
        </span>
      </div>

      <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        {/* Average applicants bar */}
        <div
          className="absolute inset-y-0 left-0 bg-gray-300 dark:bg-gray-600"
          style={{ width: `${averagePercent}%` }}
        />

        {/* Admitted average bar */}
        {admittedPercent !== null && (
          <div
            className="absolute inset-y-0 left-0 bg-yellow-400 dark:bg-yellow-500 opacity-50"
            style={{ width: `${admittedPercent}%` }}
          />
        )}

        {/* User bar */}
        {animated ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${userPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-blue-500 dark:bg-blue-600"
          />
        ) : (
          <div
            className="absolute inset-y-0 left-0 bg-blue-500 dark:bg-blue-600"
            style={{ width: `${userPercent}%` }}
          />
        )}

        {/* Value labels */}
        <div className="relative h-full flex items-center px-3">
          <span className="text-xs font-medium text-white mix-blend-difference">
            You: {Math.round(userValue)}
          </span>
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-blue-500 dark:bg-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Your Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-gray-300 dark:bg-gray-600" />
            <span className="text-gray-600 dark:text-gray-400">
              Avg: {Math.round(averageValue)}
            </span>
          </div>
          {admittedAverageValue !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-yellow-400 dark:bg-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Admitted Avg: {Math.round(admittedAverageValue)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
