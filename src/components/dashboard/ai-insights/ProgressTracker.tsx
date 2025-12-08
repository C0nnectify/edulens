'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStep {
  id: string;
  label: string;
  completed: boolean;
  current?: boolean;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  className?: string;
}

export function ProgressTracker({
  steps,
  orientation = 'horizontal',
  showLabels = true,
  className,
}: ProgressTrackerProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  if (orientation === 'horizontal') {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress: {completedCount}/{steps.length}
          </span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="relative">
          {/* Progress bar */}
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            />
          </div>

          {/* Step markers */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500 dark:text-green-400" />
                  ) : step.current ? (
                    <Clock className="h-6 w-6 text-blue-500 dark:text-blue-400 animate-pulse" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                  )}
                </motion.div>
                {showLabels && (
                  <span
                    className={cn(
                      'mt-2 text-xs text-center',
                      step.completed
                        ? 'text-green-600 dark:text-green-400 font-medium'
                        : step.current
                          ? 'text-blue-600 dark:text-blue-400 font-medium'
                          : 'text-gray-500 dark:text-gray-500'
                    )}
                  >
                    {step.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className={cn('relative', className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-3 pb-8 last:pb-0">
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          )}

          {/* Step indicator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative z-10"
          >
            {step.completed ? (
              <CheckCircle2 className="h-6 w-6 text-green-500 dark:text-green-400" />
            ) : step.current ? (
              <Clock className="h-6 w-6 text-blue-500 dark:text-blue-400 animate-pulse" />
            ) : (
              <Circle className="h-6 w-6 text-gray-400 dark:text-gray-600" />
            )}
          </motion.div>

          {/* Step label */}
          {showLabels && (
            <div className="flex-1 pt-0.5">
              <span
                className={cn(
                  'text-sm',
                  step.completed
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : step.current
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-500 dark:text-gray-500'
                )}
              >
                {step.label}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
