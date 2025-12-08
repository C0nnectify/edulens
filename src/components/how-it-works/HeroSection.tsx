"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, CheckCircle } from "lucide-react";
import Link from "next/link";
import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section className="pt-20 sm:pt-24 pb-16 sm:pb-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 px-6 py-3 rounded-full shadow-sm mb-6">
            <Bot className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm font-semibold text-blue-700">
              AI-Powered Study Abroad Platform
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            How Our AI Transforms Your{" "}
            <span className="text-blue-600">Study Abroad Journey</span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
            From overwhelming research to confident applications - see how our
            AI agents work together to make your study abroad dreams a reality.
          </p>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-center space-x-3 bg-white rounded-lg p-4 border">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-700">
                10x Faster Research
              </span>
            </div>
            <div className="flex items-center justify-center space-x-3 bg-white rounded-lg p-4 border">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-700">
                95% Success Rate
              </span>
            </div>
            <div className="flex items-center justify-center space-x-3 bg-white rounded-lg p-4 border">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-700">
                24/7 Support
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-lg"
            >
              <Link href="/signup">
                <Bot className="w-5 h-5 mr-2" />
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-lg px-8 py-4 rounded-lg border-2 hover:bg-gray-50"
            >
              <Link href="#process-flow">See the Process</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
