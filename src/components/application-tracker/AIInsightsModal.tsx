'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  RefreshCw,
  Star,
  BarChart3,
  Users,
  Clock
} from 'lucide-react';
import { Application, AIInsights } from '@/types/application';
import { ApplicationService } from '@/lib/api/applications';

interface AIInsightsModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AIInsightsModal({
  application,
  isOpen,
  onClose,
}: AIInsightsModalProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (application && isOpen) {
      loadInsights();
    }
  }, [application, isOpen]);

  const loadInsights = async () => {
    if (!application) return;

    setIsLoading(true);
    try {
      const data = await ApplicationService.getAIInsights(application.id);
      setInsights(data);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    if (!application) return;

    setIsAnalyzing(true);
    try {
      const result = await ApplicationService.triggerAIAnalysis(application.id);
      setInsights(result.insights);
    } catch (error) {
      console.error('Error triggering analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPredictionColor = (outcome: string) => {
    switch (outcome) {
      case 'likely_accept':
        return 'text-green-600 bg-green-100';
      case 'possible_accept':
        return 'text-yellow-600 bg-yellow-100';
      case 'unlikely_accept':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPredictionText = (outcome: string) => {
    switch (outcome) {
      case 'likely_accept':
        return 'Likely to be accepted';
      case 'possible_accept':
        return 'Possible acceptance';
      case 'unlikely_accept':
        return 'Unlikely to be accepted';
      default:
        return 'Unknown';
    }
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>AI Insights</span>
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis for {application.universityName} - {application.programName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading insights...</span>
          </div>
        ) : insights ? (
          <div className="space-y-6">
            {/* Overview Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span>Competitiveness</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    How competitive your application is
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {insights.competitivenessScore}/100
                  </div>
                  <Progress
                    value={insights.competitivenessScore}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Recommendation</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    How well you match the program
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {insights.recommendationScore}/100
                  </div>
                  <Progress
                    value={insights.recommendationScore}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    <span>Prediction</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Confidence: {insights.confidence ? Math.round(insights.confidence * 100) : 0}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge className={`${getPredictionColor(insights.predictedOutcome)} text-sm`}>
                    {getPredictionText(insights.predictedOutcome)}
                  </Badge>
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
                  <CardDescription>
                    What makes your application strong
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {insights.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
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
                  <CardDescription>
                    Areas that could be strengthened
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {insights.weaknesses.map((weakness, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Suggestions */}
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
                  {insights.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Similar Applications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Similar Applications</span>
                </CardTitle>
                <CardDescription>
                  Applications with similar profiles and outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  <p>Based on your profile, we found {insights.similarApplications.length} similar applications in our database.</p>
                  <p className="mt-2">These applications had an average success rate of 75% for similar programs.</p>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Last analyzed: {new Date(insights.lastAnalyzed).toLocaleDateString()}
                </span>
              </div>
              <Button 
                onClick={triggerAnalysis} 
                disabled={isAnalyzing}
                variant="outline"
                size="sm"
              >
                {isAnalyzing ? (
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
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Insights Available</h3>
            <p className="text-gray-600 mb-4">
              AI analysis hasn't been performed for this application yet.
            </p>
            <Button onClick={triggerAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? (
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
