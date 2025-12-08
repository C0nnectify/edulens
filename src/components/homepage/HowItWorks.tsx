'use client';

import { UserCircle, Sparkles, FileCheck, Rocket } from 'lucide-react';
import Link from 'next/link';

const HowItWorks = () => {
  const steps = [
    {
      icon: UserCircle,
      number: '01',
      title: 'Share Your Profile',
      description: 'Tell us your background, goals, and preferences in 5 minutes',
    },
    {
      icon: Sparkles,
      number: '02',
      title: 'AI Researches for You',
      description: 'Our agents analyze thousands of programs to find your perfect matches',
    },
    {
      icon: FileCheck,
      number: '03',
      title: 'Documents Generated',
      description: 'Receive personalized SOPs, essays, and recommendation templates',
    },
    {
      icon: Rocket,
      number: '04',
      title: 'Apply with Confidence',
      description: 'Track deadlines, submit applications, and get accepted faster',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-[#F6F9FF] to-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F1724] mb-4">
            From Dream to Admission in 4 Steps
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our proven process transforms complexity into simplicity
          </p>
        </div>

        {/* Steps - Horizontal on Desktop, Vertical on Mobile */}
        <div className="relative">
          {/* Connection Line - Desktop Only */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-[#5C6BFF] via-[#7C4DFF] to-[#5C6BFF] opacity-20"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="relative group"
                >
                  {/* Card */}
                  <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                    {/* Step Number */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-[#5C6BFF] to-[#7C4DFF] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">{step.number}</span>
                    </div>

                    {/* Icon */}
                    <div className="w-14 h-14 bg-gradient-to-br from-[#F6F9FF] to-white rounded-xl flex items-center justify-center mb-4 border-2 border-[#5C6BFF]/20 group-hover:border-[#5C6BFF]/40 transition-colors">
                      <Icon className="w-7 h-7 text-[#5C6BFF]" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-[#0F1724] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow - Desktop Only, except for last item */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-16 -right-3 z-10">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-[#5C6BFF]"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link
            href="/roadmap"
            className="bg-gradient-to-r from-[#5C6BFF] to-[#7C4DFF] text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Get The Roadmap
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
