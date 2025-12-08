"use client";

import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Bot,
  Brain,
  Clock,
  FileText,
  Shield,
  Target,
  Zap,
  Download,
  MousePointer,
} from "lucide-react";
import React from "react";

const ProblemSolutionSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center bg-red-50 border border-red-200 px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm mb-4 sm:mb-6 max-w-sm sm:max-w-none mx-auto">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-red-700">
              The Study Abroad Reality Check
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
            Why Traditional Methods Are{" "}
            <span className="text-red-600">Failing Students</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            The study abroad process hasn&apos;t evolved in decades. It&apos;s
            time for a smarter approach.
          </p>
        </div>

        {/* Pain Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20">
          <div className="bg-red-50 border border-red-200 p-6 sm:p-8 rounded-xl text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-red-800 mb-2 sm:mb-3">
              Information Overload
            </h3>
            <p className="text-red-700 mb-3 sm:mb-4 text-sm sm:text-base">
              Students spend 200+ hours researching across scattered websites
              with outdated information.
            </p>
            <div className="text-xs sm:text-sm text-red-600 font-medium">
              85% feel overwhelmed by choices
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-6 sm:p-8 rounded-xl text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-red-800 mb-2 sm:mb-3">
              Generic Documents
            </h3>
            <p className="text-red-700 mb-3 sm:mb-4 text-sm sm:text-base">
              Cookie-cutter templates make applications blend into the rejection
              pile.
            </p>
            <div className="text-xs sm:text-sm text-red-600 font-medium">
              70% use identical formats
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-6 sm:p-8 rounded-xl text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-red-800 mb-2 sm:mb-3">
              Application Chaos
            </h3>
            <p className="text-red-700 mb-3 sm:mb-4 text-sm sm:text-base">
              Missed deadlines and lost opportunities due to poor tracking
              systems.
            </p>
            <div className="text-xs sm:text-sm text-red-600 font-medium">
              30% miss critical updates
            </div>
          </div>
        </div>

        {/* The EduLen Solution */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm mb-4 sm:mb-6 max-w-sm sm:max-w-none mx-auto">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-blue-700">
              The AI-Powered Solution
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
            Meet Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Study Team
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Three specialized AI agents that work together to eliminate stress
            and maximize your success.
          </p>
        </div>

        {/* AI Agents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {/* Document AI Agent */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 sm:p-8 rounded-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
              Document AI
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-center text-sm sm:text-base">
              Creates personalized SOPs, resumes, and CVs that tell your unique
              story and match each university&apos;s requirements.
            </p>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <div className="flex items-center text-xs sm:text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                University-specific customization
              </div>
              <div className="flex items-center text-xs sm:text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                ATS-optimized formatting
              </div>
              <div className="flex items-center text-xs sm:text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                Plagiarism-free content
              </div>
              <div className="flex items-center text-xs sm:text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                Multiple format exports
              </div>
            </div>

            <div className="bg-blue-100 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800 font-medium text-center">
                &apos;From blank page to compelling narrative in 15
                minutes&apos;
              </p>
            </div>
          </div>

          {/* Research AI Agent */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 p-8 rounded-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Research AI
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              Analyzes thousands of programs in real-time using Firecrawl
              technology to find your perfect matches.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                Live university data scraping
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                AI-powered program matching
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                Admission probability scoring
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                Real-time deadline tracking
              </div>
            </div>

            <div className="bg-purple-100 p-4 rounded-lg">
              <p className="text-sm text-purple-800 font-medium text-center">
                &apos;500+ universities analyzed in seconds, not months&apos;
              </p>
            </div>
          </div>

          {/* Tracker AI Agent */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-8 rounded-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Tracker AI
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              Monitors all your applications 24/7 and sends instant
              notifications via WhatsApp, email, and SMS.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                24/7 portal monitoring
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                Instant WhatsApp alerts
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                Predictive timeline analysis
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                Deadline management
              </div>
            </div>

            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-sm text-green-800 font-medium text-center">
                &apos;Never miss an update, never lose momentum&apos;
              </p>
            </div>
          </div>
        </div>

        {/* Auto-Fill Feature Highlight */}
        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-2xl p-8 sm:p-12 mb-12 sm:mb-16 border border-violet-200">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center bg-gradient-to-r from-violet-100 to-fuchsia-100 border border-violet-300 px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm mb-4 sm:mb-6 max-w-sm sm:max-w-none mx-auto">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-violet-700 to-fuchsia-700 bg-clip-text text-transparent">
                INTRODUCING: MagicFill™
              </span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Complete Applications in{" "}
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                One Click
              </span>
            </h3>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto">
              Upload your documents, connect LinkedIn, install our extension—then watch as MagicFill™
              instantly completes every application form with perfectly formatted information.
            </p>
          </div>

          {/* Time Savings Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-12">
            {/* Before vs After */}
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
                <h4 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Traditional Way: 2-3 Hours Per Application
                </h4>
                <div className="space-y-3 text-sm text-red-700">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                    Manually typing personal information repeatedly
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                    Copy-pasting work experience from LinkedIn
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                    Reformatting dates and descriptions
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                    Double-checking for typos and errors
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                    Adapting content for each university&apos;s format
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200 p-6 rounded-xl">
                <h4 className="text-lg font-bold bg-gradient-to-r from-violet-800 to-fuchsia-800 bg-clip-text text-transparent mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-violet-600" />
                  MagicFill™: One Click, Instant Completion
                </h4>
                <div className="space-y-3 text-sm text-violet-700">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-violet-500 rounded-full mr-3 flex-shrink-0"></div>
                    Instant extraction from stored documents
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-violet-500 rounded-full mr-3 flex-shrink-0"></div>
                    Smart formatting for each university
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-violet-500 rounded-full mr-3 flex-shrink-0"></div>
                    AI-powered content optimization
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-violet-500 rounded-full mr-3 flex-shrink-0"></div>
                    One-click fill and review
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-violet-500 rounded-full mr-3 flex-shrink-0"></div>
                    Automatic error checking and validation
                  </div>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Intelligent Automation
                </h4>
                <p className="text-sm text-gray-600">
                  MagicFill™ uses advanced AI to intelligently extract and structure data from any web form or application portal.
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-semibold text-blue-900">Real-time Form Analysis</span>
                  </div>
                  <p className="text-xs text-blue-700 ml-5">Instantly understands any application form structure</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-sm font-semibold text-purple-900">Smart Field Mapping</span>
                  </div>
                  <p className="text-xs text-purple-700 ml-5">Matches your data to the right fields automatically</p>
                </div>
                <div className="bg-gradient-to-r from-fuchsia-50 to-pink-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-fuchsia-500 rounded-full mr-3"></div>
                    <span className="text-sm font-semibold text-fuchsia-900">Adaptive Learning</span>
                  </div>
                  <p className="text-xs text-fuchsia-700 ml-5">Gets smarter with every application you complete</p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
            <h4 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              How MagicFill™ Works
            </h4>
            <p className="text-gray-600 text-center mb-8">Set up once, apply everywhere—instantly</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <div className="mb-2">
                  <span className="inline-block bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1 rounded-full">STEP 1</span>
                </div>
                <h5 className="text-lg font-bold text-gray-900 mb-3">Upload Documents</h5>
                <p className="text-gray-600 text-sm">
                  Upload your resume, transcripts, and other documents to our secure platform once.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div className="mb-2">
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">STEP 2</span>
                </div>
                <h5 className="text-lg font-bold text-gray-900 mb-3">Connect LinkedIn</h5>
                <p className="text-gray-600 text-sm">
                  Link your LinkedIn account to import work experience and education history.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <div className="mb-2">
                  <span className="inline-block bg-fuchsia-100 text-fuchsia-700 text-xs font-bold px-3 py-1 rounded-full">STEP 3</span>
                </div>
                <h5 className="text-lg font-bold text-gray-900 mb-3">Install Extension</h5>
                <p className="text-gray-600 text-sm">
                  Add our browser extension to enable automatic form filling across all university portals.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="mb-2">
                  <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">STEP 4</span>
                </div>
                <h5 className="text-lg font-bold text-gray-900 mb-3">Apply Instantly</h5>
                <p className="text-gray-600 text-sm">
                  Click one button and watch your application forms fill automatically. Review and submit!
                </p>
              </div>
            </div>
          </div>

          {/* Time Savings Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-violet-100 hover:border-violet-300 transition-all">
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">95%</div>
              <div className="text-sm text-gray-600 font-medium">Time Saved</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">20x</div>
              <div className="text-sm text-gray-600 font-medium">Faster Applications</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-fuchsia-100 hover:border-fuchsia-300 transition-all">
              <div className="text-3xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-2">Zero</div>
              <div className="text-sm text-gray-600 font-medium">Manual Typing</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-emerald-100 hover:border-emerald-300 transition-all">
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">100%</div>
              <div className="text-sm text-gray-600 font-medium">Accuracy Rate</div>
            </div>
          </div>
        </div>

        {/* How We Solve Problems */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 sm:p-12 mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              How We Solve Your Study Abroad Challenges
            </h3>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered approach transforms the complex study abroad
              process into a simple, guided journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
                Personalized Document Creation
              </h4>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                Our AI analyzes your profile and creates compelling,
                university-specific documents that stand out from generic
                applications.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
                Smart Program Matching
              </h4>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                We match you with programs that align with your goals, budget,
                and academic profile, saving you months of research.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
                Automated Application Tracking
              </h4>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                Never miss a deadline or update. Our system monitors all your
                applications and keeps you informed in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Study Abroad Journey?
          </h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of students who chose the smarter path to their dream
            university.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => (window.location.href = "/signup")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Bot className="w-5 h-5 mr-2" />
              Start Your AI-Powered Journey
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => (window.location.href = "/how-it-works")}
              className="text-lg px-8 py-4 rounded-xl border-2 hover:bg-gray-50 transition-all transform hover:scale-105"
            >
              See How It Works
            </Button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              ✅ No credit card required • ✅ Free AI consultation • ✅ Cancel
              anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;
