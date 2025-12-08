
"use client";

import { useState } from 'react';
import { UnifiedCard, TrustBadge, AIFeedbackBar } from './ui/design-system';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Target, Clock, Star, TrendingUp, Calendar, FileText, Users } from 'lucide-react';

const PersonalizedDashboard = ({ userProfile }: { userProfile: Record<string, unknown> }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const getRecommendedActions = () => {
    const actions = {
      explore: [
        { title: "Take Eligibility Test", description: "See which universities match your profile", urgency: "high" },
        { title: "Browse University Rankings", description: "Explore top universities by country", urgency: "medium" },
        { title: "Calculate Study Costs", description: "Estimate your total expenses", urgency: "medium" }
      ],
      confused: [
        { title: "Book a Mentor Session", description: "Get personalized guidance", urgency: "high" },
        { title: "Watch Getting Started Guide", description: "5-minute overview video", urgency: "high" },
        { title: "Join Q&A Webinar", description: "This Friday at 3 PM", urgency: "medium" }
      ],
      applying: [
        { title: "Complete SOP Draft", description: "Use our AI-powered builder", urgency: "high" },
        { title: "Submit Letter Requests", description: "2 pending recommendations", urgency: "high" },
        { title: "Schedule Interview Prep", description: "Practice with AI coach", urgency: "medium" }
      ],
      admitted: [
        { title: "Apply for Visa", description: "Start your visa process", urgency: "high" },
        { title: "Find Accommodation", description: "Book housing near campus", urgency: "high" },
        { title: "Connect with Peers", description: "Join your university group", urgency: "low" }
      ]
    };
    return actions[userProfile.goal as keyof typeof actions] || actions.explore;
  };

  const savedUniversities = [
    { name: "MIT", match: 92, status: "researching", deadline: "Dec 15, 2024" },
    { name: "Stanford", match: 89, status: "application_started", deadline: "Jan 3, 2025" },
    { name: "Harvard", match: 87, status: "interested", deadline: "Jan 1, 2025" }
  ];

  const recentDocuments = [
    { name: "Personal Statement v3", type: "SOP", score: 78, lastUpdated: "2 days ago" },
    { name: "Resume", type: "Resume", score: 85, lastUpdated: "1 week ago" },
    { name: "Research Proposal", type: "Essay", score: 72, lastUpdated: "3 days ago" }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Welcome Header */}
      <UnifiedCard variant="primary">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-gray-600">
              {userProfile.goal === 'explore' && "Ready to explore your study abroad options?"}
              {userProfile.goal === 'confused' && "Let's get you on the right track with personalized guidance."}
              {userProfile.goal === 'applying' && "Keep up the momentum with your applications!"}
              {userProfile.goal === 'admitted' && "Congratulations! Time to prepare for your journey."}
            </p>
          </div>
          <TrustBadge type="ai" text="AI-Powered Guidance" />
        </div>
      </UnifiedCard>

      {/* Quick Actions */}
      <UnifiedCard>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Target className="mr-2 h-5 w-5 text-emerald-600" />
          Recommended Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getRecommendedActions().map((action, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{action.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  action.urgency === 'high' ? 'bg-red-100 text-red-700' :
                  action.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {action.urgency}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{action.description}</p>
              <Button size="sm" className="w-full">Start Now</Button>
            </div>
          ))}
        </div>
      </UnifiedCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Universities */}
        <UnifiedCard>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
            My Universities
          </h2>
          <div className="space-y-3">
            {savedUniversities.map((uni, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{uni.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{uni.match}% match</span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {uni.deadline}
                    </span>
                  </div>
                </div>
                <TrustBadge 
                  type={uni.status === 'application_started' ? 'time' : 'ai'} 
                  text={uni.status.replace('_', ' ')} 
                />
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">View All Universities</Button>
        </UnifiedCard>

        {/* Recent Documents */}
        <UnifiedCard>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-600" />
            My Documents
          </h2>
          <div className="space-y-4">
            {recentDocuments.map((doc, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm">{doc.name}</h3>
                  <TrustBadge type="ai" text={doc.type} />
                </div>
                <AIFeedbackBar 
                  score={doc.score} 
                  label="AI Score"
                  explanation={`Last updated ${doc.lastUpdated}`}
                />
                <Button size="sm" variant="outline" className="w-full mt-2">
                  Continue Editing
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">View All Documents</Button>
        </UnifiedCard>
      </div>

      {/* Progress Overview */}
      <UnifiedCard>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
          Your Progress
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">3/5</div>
            <div className="text-sm text-gray-600">Universities Shortlisted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">2/3</div>
            <div className="text-sm text-gray-600">Documents Ready</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">78%</div>
            <div className="text-sm text-gray-600">Profile Strength</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">45</div>
            <div className="text-sm text-gray-600">Days Until Deadline</div>
          </div>
        </div>
      </UnifiedCard>
    </div>
  );
};

export default PersonalizedDashboard;
