"use client";

import { AlertCircle, Bot, FileText, Target, Zap } from "lucide-react";
import Link from "next/link";
import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 sm:top-20 left-4 sm:left-20 w-48 sm:w-96 h-48 sm:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-20 sm:top-40 right-4 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-10 sm:bottom-20 left-1/2 w-48 sm:w-96 h-48 sm:h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Problem Statement Badge */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center bg-red-50 border border-red-200 px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm max-w-sm sm:max-w-none">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-red-700">
              90% of students feel overwhelmed by study abroad applications
            </span>
          </div>
        </div>

        {/* Main Problem-Solution Headline */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
            Stop Drowning in <span className="text-red-600">Paperwork</span>{" "}
            <br />
            Start Building Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Future
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
            Your personal study abroad AI team that handles the chaos while you
            focus on your dreams. From applications to acceptance - we&apos;ve
            got you covered.
          </p>

          {/* Value Proposition */}
          <div className="bg-indigo-600 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl inline-block mb-6 sm:mb-8 shadow-lg mx-4">
            <p className="text-sm sm:text-lg font-semibold">
              From months of research to minutes of clarity ✨
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
            <Link
              href="/signup"
              className="bg-gradient-to-r flex items-center text-white from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 w-full sm:w-auto"
            >
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Start Your AI-Powered Journey
            </Link>

            <Link
              href="/how-it-works"
              className="text-base flex items-center text-nowrap sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl border-2 hover:bg-gray-50 transition-all transform hover:scale-105 w-full sm:w-auto"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              See How It Works
            </Link>
          </div>
        </div>

        {/* Problem vs Solution Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16">
          {/* Problems */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
              Traditional Way 😰
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-lg">
                <p className="text-red-800 font-medium text-sm sm:text-base">
                  🕐 Months of manual research across 100+ university websites
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-lg">
                <p className="text-red-800 font-medium text-sm sm:text-base">
                  📝 Generic templates that get lost in admission piles
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-lg">
                <p className="text-red-800 font-medium text-sm sm:text-base">
                  🔍 Constantly checking portals and missing critical updates
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-lg">
                <p className="text-red-800 font-medium text-sm sm:text-base">
                  💰 Expensive consultants with limited availability
                </p>
              </div>
            </div>
          </div>

          {/* Solutions */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
              EduLen AI Way 🚀
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-green-50 border border-green-200 p-3 sm:p-4 rounded-lg">
                <p className="text-green-800 font-medium text-sm sm:text-base">
                  ⚡ AI agents research and match programs in minutes
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 p-3 sm:p-4 rounded-lg">
                <p className="text-green-800 font-medium text-sm sm:text-base">
                  🎯 Personalized documents that highlight your unique story
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 p-3 sm:p-4 rounded-lg">
                <p className="text-green-800 font-medium text-sm sm:text-base">
                  📲 Automated tracking with instant WhatsApp notifications
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 p-3 sm:p-4 rounded-lg">
                <p className="text-green-800 font-medium text-sm sm:text-base">
                  🤖 24/7 AI support at a fraction of consultant costs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Features Preview */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-8 shadow-xl border border-white/20 mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 sm:mb-8">
            Meet Your AI Study Abroad Team
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                Document AI
              </h4>
              <p className="text-xs sm:text-sm text-gray-600">
                Creates compelling SOPs, resumes & CVs tailored to each
                university
              </p>
            </div>
            <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                Tracker AI
              </h4>
              <p className="text-xs sm:text-sm text-gray-600">
                Monitors applications 24/7 and sends instant status updates
              </p>
            </div>
            <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                Research AI
              </h4>
              <p className="text-xs sm:text-sm text-gray-600">
                Finds perfect program matches using real-time university data
              </p>
            </div>
          </div>
        </div>

        {/* Trust Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 max-w-4xl mx-auto">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-6 shadow-lg">
            <div className="text-lg sm:text-2xl font-bold text-blue-600 mb-1">
              95%
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Tracking Accuracy
            </div>
          </div>
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-6 shadow-lg">
            <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">
              10x
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Faster Research
            </div>
          </div>
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-6 shadow-lg">
            <div className="text-lg sm:text-2xl font-bold text-purple-600 mb-1">
              24/7
            </div>
            <div className="text-xs sm:text-sm text-gray-600">AI Support</div>
          </div>
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-6 shadow-lg">
            <div className="text-lg sm:text-2xl font-bold text-orange-600 mb-1">
              50+
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Countries</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
