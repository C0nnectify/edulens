"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, CheckCircle, Star, Users, Zap } from "lucide-react";
import Link from "next/link";
import React from "react";

const CTASection: React.FC = () => {
  const benefits = [
    {
      icon: Zap,
      title: "10x Faster Process",
      description: "Complete your study abroad journey in weeks, not months",
    },
    {
      icon: Star,
      title: "95% Success Rate",
      description: "Get accepted to at least one of your target universities",
    },
    {
      icon: Users,
      title: "24/7 AI Support",
      description:
        "Continuous monitoring and assistance throughout your journey",
    },
  ];

  return (
    <section className="py-20 bg-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Study Abroad Journey?
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Join thousands of students who have successfully achieved their
            study abroad dreams with our AI-powered platform.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 rounded-lg p-6 border border-white/20"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-blue-100">{benefit.description}</p>
                </div>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              asChild
              className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 py-4 rounded-lg shadow-sm font-semibold"
            >
              <Link href="/signup">
                <Bot className="w-5 h-5 mr-2" />
                Start Your AI-Powered Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 rounded-lg transition-all font-semibold"
            >
              <Link href="/contact">Get Free Consultation</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="bg-white/10 rounded-lg p-8 border border-white/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">500+</div>
                <div className="text-sm text-blue-100">
                  Universities Covered
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">50+</div>
                <div className="text-sm text-blue-100">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  10,000+
                </div>
                <div className="text-sm text-blue-100">Students Helped</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-blue-100">AI Support</div>
              </div>
            </div>
          </div>

          {/* Guarantee */}
          <div className="mt-12 bg-white/10 rounded-lg p-6 border border-white/20 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="text-lg font-semibold text-white">
                100% Satisfaction Guarantee
              </span>
            </div>
            <p className="text-blue-100 text-center">
              If you&apos;re not accepted to any of our recommended universities,
              we&apos;ll provide a full refund. We&apos;re confident in our AI&apos;s ability
              to help you succeed.
            </p>
          </div>

          {/* Final CTA */}
          <div className="mt-12">
            <p className="text-blue-100 mb-6">
              Don&apos;t let another day pass without taking action on your study
              abroad dreams.
            </p>
            <Button
              size="lg"
              asChild
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xl px-12 py-6 rounded-lg shadow-sm font-bold"
            >
              <Link href="/signup">
                <Bot className="w-6 h-6 mr-3" />
                Start Your Success Story Today
                <ArrowRight className="w-6 h-6 ml-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
