'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ProfileComparison } from '@/types/insights';
import { Users } from 'lucide-react';

interface PeerComparisonChartProps {
  comparisons: ProfileComparison[];
  className?: string;
}

export function PeerComparisonChart({ comparisons, className }: PeerComparisonChartProps) {
  // Transform data for Recharts
  const chartData = comparisons.map((comp) => ({
    category: comp.categoryLabel,
    'Your Score': comp.userScore,
    'Average Applicant': comp.averageScore,
    'Admitted Average': comp.admittedAverageScore,
    percentile: comp.percentile,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Profile Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="category"
                angle={-45}
                textAnchor="end"
                height={80}
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis
                domain={[0, 100]}
                label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {label}
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded bg-blue-500" />
                            <span className="text-gray-600 dark:text-gray-400">Your Score:</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {Math.round(data['Your Score'])}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded bg-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Avg Applicant:</span>
                            <span className="font-semibold text-gray-600 dark:text-gray-400">
                              {Math.round(data['Average Applicant'])}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded bg-green-500" />
                            <span className="text-gray-600 dark:text-gray-400">Admitted Avg:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {Math.round(data['Admitted Average'])}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Percentile:</span>
                            <span className="ml-2 font-semibold text-purple-600 dark:text-purple-400">
                              {Math.round(data.percentile)}th
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="square"
              />
              <Bar dataKey="Your Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Average Applicant" fill="#9ca3af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Admitted Average" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparisons.slice(0, 3).map((comp) => (
            <div
              key={comp.category}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {comp.categoryLabel}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {Math.round(comp.userScore)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {Math.round(comp.percentile)}th percentile
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
