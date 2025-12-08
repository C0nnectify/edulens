'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from './PriorityBadge';
import type { TimelineSuggestion, MilestoneType } from '@/types/insights';
import { Calendar, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isBefore, isAfter, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimelineTabProps {
  timeline: TimelineSuggestion[];
}

const milestoneIcons: Record<MilestoneType, React.ElementType> = {
  gre_prep: Clock,
  sop_writing: Calendar,
  lor_requests: Calendar,
  applications: Calendar,
  interviews: Calendar,
  other: Circle,
};

const milestoneColors: Record<MilestoneType, string> = {
  gre_prep: 'bg-blue-500',
  sop_writing: 'bg-purple-500',
  lor_requests: 'bg-green-500',
  applications: 'bg-orange-500',
  interviews: 'bg-red-500',
  other: 'bg-gray-500',
};

export function TimelineTab({ timeline }: TimelineTabProps) {
  const [view, setView] = useState<'list' | 'gantt'>('list');
  const now = new Date();

  // Sort timeline by start date
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Calculate timeline span for Gantt view
  const earliestDate = sortedTimeline[0]
    ? new Date(sortedTimeline[0].startDate)
    : new Date();
  const latestDate = sortedTimeline[sortedTimeline.length - 1]
    ? new Date(sortedTimeline[sortedTimeline.length - 1].endDate)
    : new Date();
  const totalDays = differenceInDays(latestDate, earliestDate);

  const getStatusInfo = (milestone: TimelineSuggestion) => {
    const start = new Date(milestone.startDate);
    const end = new Date(milestone.endDate);
    const deadline = milestone.deadline ? new Date(milestone.deadline) : null;

    if (milestone.completed) {
      return { status: 'completed', label: 'Completed', color: 'text-green-600 dark:text-green-400' };
    }

    if (isAfter(now, end)) {
      return { status: 'overdue', label: 'Overdue', color: 'text-red-600 dark:text-red-400' };
    }

    if (isBefore(now, start)) {
      return { status: 'upcoming', label: 'Upcoming', color: 'text-gray-600 dark:text-gray-400' };
    }

    if (deadline && differenceInDays(deadline, now) <= 7) {
      return { status: 'urgent', label: 'Urgent', color: 'text-orange-600 dark:text-orange-400' };
    }

    return { status: 'active', label: 'In Progress', color: 'text-blue-600 dark:text-blue-400' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Application Timeline
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Optimized timeline based on successful applicants
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            List View
          </Button>
          <Button
            variant={view === 'gantt' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('gantt')}
          >
            Gantt View
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {timeline.filter((t) => t.completed).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {timeline.filter((t) => !t.completed && isAfter(now, new Date(t.startDate)) && isBefore(now, new Date(t.endDate))).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {timeline.filter((t) => !t.completed && isBefore(now, new Date(t.startDate))).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {timeline.filter((t) => !t.completed && isAfter(now, new Date(t.endDate))).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {view === 'list' ? (
        /* List View */
        <div className="space-y-4">
          {sortedTimeline.map((milestone, index) => {
            const Icon = milestoneIcons[milestone.type];
            const statusInfo = getStatusInfo(milestone);

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card className={cn(milestone.completed && 'opacity-60')}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'p-3 rounded-lg',
                          milestoneColors[milestone.type],
                          milestone.completed && 'opacity-50'
                        )}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <CardTitle className={cn(milestone.completed && 'line-through text-gray-500')}>
                            {milestone.title}
                          </CardTitle>
                          {milestone.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {milestone.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {format(new Date(milestone.startDate), 'MMM dd')} -{' '}
                              {format(new Date(milestone.endDate), 'MMM dd, yyyy')}
                            </span>
                          </div>

                          {milestone.deadline && (
                            <div className="flex items-center gap-1.5">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600 dark:text-red-400">
                                Deadline: {format(new Date(milestone.deadline), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}

                          {milestone.estimatedHours && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                ~{milestone.estimatedHours}h
                              </span>
                            </div>
                          )}

                          <PriorityBadge priority={milestone.priority} size="sm" showIcon={false} />

                          <span className={cn('font-medium', statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {milestone.completedDate && (
                    <CardContent className="pt-0">
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Completed on {format(new Date(milestone.completedDate), 'MMM dd, yyyy')}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Gantt View */
        <Card>
          <CardHeader>
            <CardTitle>Timeline Gantt Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedTimeline.map((milestone, index) => {
                const start = new Date(milestone.startDate);
                const end = new Date(milestone.endDate);
                const daysFromStart = differenceInDays(start, earliestDate);
                const duration = differenceInDays(end, start);
                const leftPercent = (daysFromStart / totalDays) * 100;
                const widthPercent = (duration / totalDays) * 100;

                return (
                  <div key={milestone.id} className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-48 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {milestone.title}
                      </div>
                      <div className="flex-1 relative h-8 bg-gray-100 dark:bg-gray-800 rounded">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercent}%`, left: `${leftPercent}%` }}
                          transition={{ delay: 0.1 * index, duration: 0.5 }}
                          className={cn(
                            'absolute h-full rounded',
                            milestoneColors[milestone.type],
                            milestone.completed && 'opacity-50'
                          )}
                          style={{ left: `${leftPercent}%` }}
                        >
                          <div className="flex items-center justify-center h-full px-2 text-xs text-white font-medium">
                            {duration}d
                          </div>
                        </motion.div>
                      </div>
                      {milestone.completed && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline axis */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                <span>{format(earliestDate, 'MMM dd, yyyy')}</span>
                <span>Today: {format(now, 'MMM dd, yyyy')}</span>
                <span>{format(latestDate, 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
