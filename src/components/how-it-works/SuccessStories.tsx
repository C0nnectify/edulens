"use client";

import {
  CheckCircle,
  Clock,
  GraduationCap,
  MapPin,
  Quote,
  Star,
} from "lucide-react";
import React from "react";

const SuccessStories: React.FC = () => {
  const stories = [
    {
      id: 1,
      name: "Sarah Chen",
      university: "Stanford University",
      program: "Computer Science",
      country: "USA",
      image: "👩‍💻",
      rating: 5,
      quote:
        "Edulens AI found me the perfect program I never knew existed. The personalized documents helped me stand out from thousands of applicants.",
      timeline: "3 weeks from profile analysis to acceptance",
      keyBenefit: "Found hidden gem program with 95% admission probability",
      stats: {
        applications: 8,
        acceptances: 6,
        timeSaved: "4 months",
      },
    },
    {
      id: 2,
      name: "Ahmed Hassan",
      university: "University of Toronto",
      program: "Business Administration",
      country: "Canada",
      image: "👨‍💼",
      rating: 5,
      quote:
        "The AI tracker kept me updated on every application status. I never missed a deadline or opportunity.",
      timeline: "2 weeks from application to interview invitation",
      keyBenefit: "Automated tracking saved 20+ hours of manual checking",
      stats: {
        applications: 12,
        acceptances: 9,
        timeSaved: "6 months",
      },
    },
    {
      id: 3,
      name: "Priya Sharma",
      university: "University of Melbourne",
      program: "Data Science",
      country: "Australia",
      image: "👩‍🔬",
      rating: 5,
      quote:
        "The document AI created SOPs that perfectly matched each university's requirements. My applications felt personal and authentic.",
      timeline: "4 weeks from start to scholarship offer",
      keyBenefit: "Received full scholarship worth $50,000",
      stats: {
        applications: 6,
        acceptances: 5,
        timeSaved: "3 months",
      },
    },
  ];

  const overallStats = [
    {
      number: "95%",
      label: "Success Rate",
      description: "Students get accepted to at least one university",
    },
    {
      number: "10x",
      label: "Faster Process",
      description: "Compared to traditional research methods",
    },
    {
      number: "500+",
      label: "Universities",
      description: "Covered across 50+ countries",
    },
    {
      number: "24/7",
      label: "AI Support",
      description: "Continuous monitoring and assistance",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Success Stories from Real Students
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how our AI platform has helped students achieve their study
            abroad dreams with remarkable results.
          </p>
        </div>

        {/* Success Stories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {stories.map((story) => (
            <div
              key={story.id}
              className="bg-blue-50 rounded-lg p-8 border shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">{story.image}</div>
                  <div>
                    <h3 className="font-bold text-gray-900">{story.name}</h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{story.country}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(story.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
              </div>

              {/* University Info */}
              <div className="bg-white rounded-lg p-4 mb-6 border">
                <div className="flex items-center space-x-2 mb-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">
                    {story.university}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{story.program}</p>
              </div>

              {/* Quote */}
              <div className="mb-6">
                <Quote className="w-6 h-6 text-blue-600 mb-3" />
                <p className="text-gray-700 italic leading-relaxed">
                  &quot;{story.quote}&quot;
                </p>
              </div>

              {/* Key Benefit */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">
                    Key Achievement
                  </span>
                </div>
                <p className="text-sm text-green-700">{story.keyBenefit}</p>
              </div>

              {/* Timeline */}
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{story.timeline}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {story.stats.applications}
                  </div>
                  <div className="text-xs text-gray-600">Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {story.stats.acceptances}
                  </div>
                  <div className="text-xs text-gray-600">Acceptances</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {story.stats.timeSaved}
                  </div>
                  <div className="text-xs text-gray-600">Time Saved</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Statistics */}
        <div className="bg-blue-600 rounded-lg p-8 sm:p-12 text-white">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Our Platform&apos;s Success Metrics
            </h3>
            <p className="text-blue-100 max-w-2xl mx-auto">
              These numbers represent real results from students who trusted our
              AI platform with their study abroad journey.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {overallStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-lg font-semibold mb-1">{stat.label}</div>
                <div className="text-sm text-blue-100">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Join Our Success Stories?
          </h3>
          <p className="text-gray-600 mb-6">
            Let our AI platform help you achieve your study abroad dreams with
            the same level of success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-sm">
              Start Your Success Story
            </button>
            <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-all">
              View More Stories
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
