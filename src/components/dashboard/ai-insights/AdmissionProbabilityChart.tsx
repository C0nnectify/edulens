'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { TrendDataPoint, ScenarioForecast } from '@/types/insights';
import { TrendingUp, Info } from 'lucide-react';
import { format } from 'date-fns';

interface AdmissionProbabilityChartProps {
  trends: TrendDataPoint[];
  scenarios?: ScenarioForecast[];
  currentProbability: number;
  className?: string;
}

export function AdmissionProbabilityChart({
  trends,
  scenarios,
  currentProbability,
  className,
}: AdmissionProbabilityChartProps) {
  // Transform trends data for Recharts
  const chartData = trends.map((point) => ({
    date: format(new Date(point.date), 'MMM dd'),
    probability: point.probability,
    event: point.event,
    eventType: point.eventType,
  }));

  // Add scenario forecasts
  const scenarioData = scenarios?.map((scenario) => ({
    name: scenario.name,
    probability: scenario.predictedProbability,
    color: scenario.probabilityDelta > 0 ? '#10b981' : '#ef4444',
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Admission Probability Trend
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Current:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {Math.round(currentProbability)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis
                domain={[0, 100]}
                label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }}
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {data.date}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Probability: {Math.round(data.probability)}%
                        </p>
                        {data.event && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-start gap-1">
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{data.event}</span>
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <ReferenceLine
                y={currentProbability}
                stroke="#3b82f6"
                strokeDasharray="3 3"
                label="Current"
              />
              <Line
                type="monotone"
                dataKey="probability"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.event) {
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={
                          payload.eventType === 'positive'
                            ? '#10b981'
                            : payload.eventType === 'negative'
                              ? '#ef4444'
                              : '#3b82f6'
                        }
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle cx={cx} cy={cy} r={3} fill="#3b82f6" />;
                }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {scenarios && scenarios.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Scenario Forecasts
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {scenario.name}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        scenario.probabilityDelta > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {scenario.probabilityDelta > 0 ? '+' : ''}
                      {Math.round(scenario.probabilityDelta)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {scenario.description}
                  </p>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    Timeline: {scenario.timeline}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
