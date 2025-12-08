'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { SuccessFactor } from '@/types/insights';
import { Target } from 'lucide-react';

interface SuccessFactorsChartProps {
  factors: SuccessFactor[];
  className?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function SuccessFactorsChart({ factors, className }: SuccessFactorsChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Transform data for PieChart
  const chartData = factors.map((factor) => ({
    name: factor.categoryLabel,
    value: factor.importance,
    userScore: factor.userScore,
    description: factor.description,
  }));

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Success Factors Breakdown
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          What matters most for admission to your target programs
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${Math.round(value)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      opacity={activeIndex !== null && activeIndex !== index ? 0.6 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {data.name}
                          </p>
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Importance:</span>
                              <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">
                                {Math.round(data.value)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Your Score:</span>
                              <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                                {Math.round(data.userScore)}/100
                              </span>
                            </div>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                              {data.description}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Factor Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Factor Details
            </h4>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {factors
                .sort((a, b) => b.importance - a.importance)
                .map((factor, index) => (
                  <div
                    key={factor.category}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="h-4 w-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">
                        {factor.categoryLabel}
                      </span>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {Math.round(factor.importance)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Your Score:</span>
                      <span
                        className={`font-semibold ${
                          factor.userScore >= 70
                            ? 'text-green-600 dark:text-green-400'
                            : factor.userScore >= 50
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {Math.round(factor.userScore)}/100
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      {factor.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
