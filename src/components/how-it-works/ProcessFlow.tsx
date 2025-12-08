"use client";

import {
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Plane,
  Search,
  Send,
  Target,
  User,
  Zap,
} from "lucide-react";
import React from "react";

const ProcessFlow: React.FC = () => {
  const steps = [
    {
      id: 1,
      title: "Profile Analysis",
      description:
        "Our AI analyzes your academic background, interests, and goals to understand your unique profile.",
      icon: User,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      details: [
        "Academic performance analysis",
        "Interest and career goal assessment",
        "Budget and preference evaluation",
        "Strengths and improvement areas identification",
      ],
    },
    {
      id: 2,
      title: "Smart Research",
      description:
        "AI agents research thousands of programs across 500+ universities to find your perfect matches.",
      icon: Search,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      details: [
        "Real-time university data scraping",
        "Program matching based on your profile",
        "Admission probability scoring",
        "Deadline and requirement tracking",
      ],
    },
    {
      id: 3,
      title: "Document Creation",
      description:
        "AI creates personalized SOPs, resumes, and CVs tailored to each university's requirements.",
      icon: FileText,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      details: [
        "University-specific customization",
        "ATS-optimized formatting",
        "Compelling narrative creation",
        "Multiple format exports",
      ],
    },
    {
      id: 4,
      title: "Application Submission",
      description:
        "Streamlined application process with automated form filling and document submission.",
      icon: Send,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      details: [
        "Automated form completion",
        "Document upload and organization",
        "Application fee management",
        "Submission confirmation tracking",
      ],
    },
    {
      id: 5,
      title: "Progress Tracking",
      description:
        "24/7 monitoring of your applications with instant updates and deadline reminders.",
      icon: Target,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      details: [
        "Real-time status monitoring",
        "WhatsApp and email notifications",
        "Deadline reminders",
        "Interview preparation support",
      ],
    },
    {
      id: 6,
      title: "Success & Beyond",
      description:
        "Pre-departure guidance and ongoing support for your study abroad journey.",
      icon: Plane,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      details: [
        "Visa application assistance",
        "Accommodation guidance",
        "Cultural preparation",
        "Ongoing support network",
      ],
    },
  ];

  return (
    <section id="process-flow" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Your Complete Study Abroad Journey
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From initial profile analysis to successful enrollment - our AI
            guides you through every step of the process.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 transform -translate-y-1/2 z-0"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={step.id}
                  className={`${step.bgColor} ${step.borderColor} border rounded-lg p-8 shadow-sm hover:shadow-md transition-all duration-300`}
                >
                  {/* Step Number */}
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg`}
                    >
                      {step.id}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Step {step.id}</span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-6`}
                  >
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    {step.title}
                  </h3>

                  <p className="text-gray-600 mb-6 text-center leading-relaxed">
                    {step.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-3">
                    {step.details.map((detail, detailIndex) => (
                      <div
                        key={detailIndex}
                        className="flex items-start space-x-3"
                      >
                        <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-600">{detail}</span>
                      </div>
                    ))}
                  </div>

                  {/* Arrow for mobile */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden flex justify-center mt-6">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Summary */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8 border">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Complete Process Timeline
            </h3>
            <p className="text-gray-600">
              What used to take months of research and preparation now happens
              in weeks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Traditional Way</h4>
              <p className="text-sm text-gray-600">
                6-12 months of manual research and preparation
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">With Edulens AI</h4>
              <p className="text-sm text-gray-600">
                2-4 weeks from profile analysis to application submission
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Time Saved</h4>
              <p className="text-sm text-gray-600">
                80-90% reduction in preparation time
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessFlow;
