"use client";

import {
  Brain,
  CheckCircle,
  FileText,
  MessageSquare,
  Shield,
  Target,
  Users,
} from "lucide-react";
import React from "react";

const AIAgentsExplanation: React.FC = () => {
  const agents = [
    {
      id: 1,
      name: "Document AI",
      description:
        "Creates compelling, personalized documents that tell your unique story",
      icon: FileText,
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      features: [
        "University-specific customization",
        "ATS-optimized formatting",
        "Compelling narrative creation",
        "Multiple format exports",
      ],
      process: [
        "Analyzes your academic background and achievements",
        "Researches university-specific requirements and preferences",
        "Creates personalized content that highlights your strengths",
        "Formats documents for maximum impact and readability",
      ],
      result: "Professional documents that stand out from generic applications",
    },
    {
      id: 2,
      name: "Research AI",
      description:
        "Finds your perfect program matches using real-time university data",
      icon: Brain,
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      features: [
        "Real-time university data scraping",
        "AI-powered program matching",
        "Admission probability scoring",
        "Deadline and requirement tracking",
      ],
      process: [
        "Scrapes data from 500+ universities in real-time",
        "Analyzes programs based on your profile and preferences",
        "Calculates admission probability for each program",
        "Tracks deadlines and application requirements",
      ],
      result: "Curated list of programs with high admission probability",
    },
    {
      id: 3,
      name: "Tracker AI",
      description:
        "Monitors all your applications 24/7 with instant notifications",
      icon: Shield,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      features: [
        "24/7 portal monitoring",
        "Instant WhatsApp alerts",
        "Predictive timeline analysis",
        "Deadline management",
      ],
      process: [
        "Continuously monitors university application portals",
        "Detects status changes and updates immediately",
        "Sends notifications via WhatsApp, email, and SMS",
        "Provides predictive timelines for decision dates",
      ],
      result: "Never miss an update or deadline again",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Meet Your AI Study Abroad Team
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Three specialized AI agents work together to eliminate stress and
            maximize your success throughout your study abroad journey.
          </p>
        </div>

        <div className="space-y-16">
          {agents.map((agent, index) => {
            const IconComponent = agent.icon;
            return (
              <div
                key={agent.id}
                className={`${agent.bgColor} ${agent.borderColor} border rounded-lg p-8 sm:p-12`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Left Side - Agent Info */}
                  <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="flex items-center mb-6">
                      <div
                        className={`w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mr-4`}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                          {agent.name}
                        </h3>
                        <p className="text-gray-600">{agent.description}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Key Features:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {agent.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-center space-x-3"
                          >
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Result */}
                    <div className="bg-white rounded-lg p-6 border">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Result:
                      </h4>
                      <p className="text-gray-600 font-medium">
                        {agent.result}
                      </p>
                    </div>
                  </div>

                  {/* Right Side - Process Flow */}
                  <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                    <h4 className="text-lg font-semibold text-gray-900 mb-6">
                      How It Works:
                    </h4>
                    <div className="space-y-4">
                      {agent.process.map((step, stepIndex) => (
                        <div
                          key={stepIndex}
                          className="flex items-start space-x-4"
                        >
                          <div
                            className={`w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                          >
                            {stepIndex + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-700 leading-relaxed">
                              {step}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collaboration Section */}
        <div className="mt-16 bg-white rounded-lg p-8 sm:p-12 border shadow-sm">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              How Our AI Agents Work Together
            </h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Our three AI agents don&apos;t work in isolation - they collaborate
              seamlessly to provide you with a comprehensive study abroad
              solution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Collaborative Intelligence
              </h4>
              <p className="text-sm text-gray-600">
                All agents share insights and data to provide you with the best
                possible recommendations
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Continuous Learning
              </h4>
              <p className="text-sm text-gray-600">
                Each agent learns from successful applications to improve
                recommendations over time
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Real-time Updates
              </h4>
              <p className="text-sm text-gray-600">
                All agents communicate in real-time to keep you informed of any
                changes or opportunities
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAgentsExplanation;
