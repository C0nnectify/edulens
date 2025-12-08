'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { Application } from '@/types/application';
import { ApplicationService } from '@/lib/api/applications';

interface OverviewTabProps {
  application: Application;
}

export default function OverviewTab({ application }: OverviewTabProps) {
  const [insights, setInsights] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [application.id]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await ApplicationService.getAIInsights(application.id);
      setInsights(data);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    try {
      setAnalyzing(true);
      const result = await ApplicationService.triggerAIAnalysis(application.id);
      setInsights(result.insights);
    } catch (error) {
      console.error('Error triggering analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading insights...</span>
      </div>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Insights Available</h3>
          <p className="text-gray-600 mb-4">
            Generate comprehensive AI-powered insights for this application
          </p>
          <Button onClick={triggerAnalysis} disabled={analyzing} className="bg-blue-600 hover:bg-blue-700">
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate AI Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPredictionColor = (outcome: string) => {
    switch (outcome) {
      case 'likely_accept':
        return 'bg-green-100 text-green-800';
      case 'possible_accept':
        return 'bg-yellow-100 text-yellow-800';
      case 'unlikely_accept':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span>Competitiveness Score</span>
            </CardTitle>
            <CardDescription className="text-xs">
              How competitive your application is
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(insights.competitivenessScore)}`}>
              {insights.competitivenessScore}/100
            </div>
            <Progress value={insights.competitivenessScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Recommendation Score</span>
            </CardTitle>
            <CardDescription className="text-xs">
              How well you match the program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(insights.recommendationScore)}`}>
              {insights.recommendationScore}/100
            </div>
            <Progress value={insights.recommendationScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span>Admission Prediction</span>
            </CardTitle>
            <CardDescription className="text-xs">
              AI-predicted outcome
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className={`${getPredictionColor(insights.predictedOutcome)} text-sm mb-2`}>
              {insights.predictedOutcome?.replace('_', ' ').toUpperCase()}
            </Badge>
            <div className="text-sm text-gray-600">
              Confidence: {Math.round(insights.confidence * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Strengths</span>
            </CardTitle>
            <CardDescription>What makes your application strong</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.strengths?.map((strength: string, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{strength}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Areas for Improvement</span>
            </CardTitle>
            <CardDescription>Areas that could be strengthened</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.weaknesses?.map((weakness: string, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{weakness}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <span>AI Recommendations</span>
          </CardTitle>
          <CardDescription>
            Personalized suggestions to improve your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.suggestions?.map((suggestion: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{suggestion}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          onClick={triggerAnalysis}
          disabled={analyzing}
          variant="outline"
        >
          {analyzing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
