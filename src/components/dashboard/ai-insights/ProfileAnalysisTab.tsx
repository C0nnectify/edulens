'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ComparisonBar } from './ComparisonBar';
import type { ProfileStrength, ProfileWeakness, ProfileComparison } from '@/types/insights';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileAnalysisTabProps {
  strengths: ProfileStrength[];
  weaknesses: ProfileWeakness[];
  comparisons: ProfileComparison[];
}

export function ProfileAnalysisTab({
  strengths,
  weaknesses,
  comparisons,
}: ProfileAnalysisTabProps) {
  // Transform data for radar chart
  const radarData = comparisons.map((comp) => ({
    category: comp.categoryLabel,
    You: comp.userScore,
    Average: comp.averageScore,
    Admitted: comp.admittedAverageScore,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Profile Analysis
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Detailed comparison of your profile against admitted students
        </p>
      </div>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Profile Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280' }} />
                <Radar
                  name="Your Score"
                  dataKey="You"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Average Applicant"
                  dataKey="Average"
                  stroke="#9ca3af"
                  fill="#9ca3af"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Admitted Average"
                  dataKey="Admitted"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {payload[0].payload.category}
                          </p>
                          {payload.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <div
                                className="h-3 w-3 rounded"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-gray-600 dark:text-gray-400">
                                {entry.name}:
                              </span>
                              <span className="font-semibold">{Math.round(entry.value as number)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {comparisons.map((comp) => (
            <ComparisonBar
              key={comp.category}
              category={comp.categoryLabel}
              userValue={comp.userScore}
              averageValue={comp.averageScore}
              admittedAverageValue={comp.admittedAverageScore}
              animated
            />
          ))}
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses Details */}
      <Tabs defaultValue="strengths" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="strengths" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Strengths ({strengths.length})
          </TabsTrigger>
          <TabsTrigger value="weaknesses" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Weaknesses ({weaknesses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strengths" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {strengths.map((strength, index) => (
              <motion.div
                key={strength.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{strength.title}</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {strength.score}/100
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {strength.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Percentile:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {strength.percentile}th
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Impact:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          +{strength.impact}%
                        </span>
                      </div>
                    </div>

                    {strength.evidence.length > 0 && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Evidence:
                        </h5>
                        <ul className="space-y-1">
                          {strength.evidence.map((item, idx) => (
                            <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                              <span className="text-green-600 dark:text-green-400">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weaknesses" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {weaknesses.map((weakness, index) => (
              <motion.div
                key={weakness.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{weakness.title}</span>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {weakness.score}/100
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {weakness.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Percentile:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {weakness.percentile}th
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Gap:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {Math.abs(weakness.gap)} points
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Impact:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          -{weakness.impact}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Addressable:</span>
                        <span
                          className={`font-semibold ${
                            weakness.addressable
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-500 dark:text-gray-500'
                          }`}
                        >
                          {weakness.addressable ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
