
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const EightStepJourney = () => {
  const steps = [
    { 
      id: 1, 
      title: 'Profile', 
      icon: '👤', 
      description: 'Build your academic background',
      tooltip: 'Create comprehensive academic profile with transcripts, test scores, and achievements'
    },
    { 
      id: 2, 
      title: 'Explore', 
      icon: '🔍', 
      description: 'Compare universities, countries, cities',
      tooltip: 'Research and compare global education destinations with AI insights'
    },
    { 
      id: 3, 
      title: 'Match', 
      icon: '🎯', 
      description: 'Get AI-powered university matches',
      tooltip: 'Receive personalized university recommendations based on your profile'
    },
    { 
      id: 4, 
      title: 'Prepare Docs', 
      icon: '📝', 
      description: 'SOPs, LORs, Resumes',
      tooltip: 'Create compelling application documents with AI assistance'
    },
    { 
      id: 5, 
      title: 'Apply', 
      icon: '📤', 
      description: 'Submit strong applications',
      tooltip: 'Submit polished applications with deadline tracking and status monitoring'
    },
    { 
      id: 6, 
      title: 'Fund', 
      icon: '💰', 
      description: 'Secure scholarships & assistantships',
      tooltip: 'Find and apply for funding opportunities with AI-powered matching'
    },
    { 
      id: 7, 
      title: 'Visa', 
      icon: '✈️', 
      description: 'AI visa prep & checklist',
      tooltip: 'Navigate visa applications with country-specific guidance and checklists'
    },
    { 
      id: 8, 
      title: 'Thrive', 
      icon: '🎓', 
      description: 'Post-arrival support',
      tooltip: 'Get support for jobs, housing, insurance, and settling in your new country'
    }
  ];

  const metrics = [
    { icon: '✅', value: '99%', label: 'Success Rate', color: 'text-green-600' },
    { icon: '🎓', value: '10K+', label: 'Students', color: 'text-blue-600' },
    { icon: '🌍', value: '50+', label: 'Countries', color: 'text-purple-600' },
    { icon: '🧠', value: '24/7', label: 'AI Support', color: 'text-orange-600' }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            🎯 8 Essential Steps to Study Abroad
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our proven AI framework built from 10,000+ student journeys
          </p>
        </div>

        {/* Steps Progress */}
        <div className="relative mb-20">
          {/* Progress Line - Desktop */}
          <div className="absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200 transform hidden lg:block"></div>
          <div className="absolute top-16 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transform hidden lg:block"></div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {steps.map((step, index) => (
              <div key={step.id} className="relative text-center group">
                <div className="bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg border-4 border-blue-500 relative z-10 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">{step.icon}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900 text-sm">{step.title}</h3>
                  <p className="text-xs text-gray-600 leading-tight">{step.description}</p>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap max-w-xs">
                    {step.tooltip}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">{metric.icon}</div>
                <div className={`text-3xl font-bold ${metric.color} mb-2`}>{metric.value}</div>
                <div className="text-sm text-gray-600">{metric.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EightStepJourney;
