'use client';

import { Target, Zap, Shield } from 'lucide-react';
import Image from 'next/image';

const FeaturesGrid = () => {
  const features = [
    {
      icon: Target,
      title: 'Personalized Documents',
      description: 'AI analyzes your unique story and creates compelling SOPs and essays that stand out',
      image: '/images/home_img_2.png',
      imagePrompt: 'Clean UI mockup showing a document editor with AI suggestions, highlighting key phrases in a SOP. Modern interface with purple gradient accents, split-screen showing before/after document quality. Professional, detailed, high-fidelity design.',
    },
    {
      icon: Zap,
      title: 'Smart Program Matching',
      description: 'Discover programs that perfectly align with your profile, preferences, and career goals',
      image: '/images/home_img_3.png',
      imagePrompt: 'Dashboard UI showing university cards with match percentage scores (85%, 92%, 78%) displayed prominently. Map visualization with pins, filtering options, and clean typography. Modern design with blue-purple gradients.',
    },
    {
      icon: Shield,
      title: 'Application Automation',
      description: 'Automated deadline tracking, document management, and submission reminders in one place',
      image: '/images/home_img_4.png',
      imagePrompt: 'Calendar-style interface showing application deadlines with color-coded status indicators (pending, completed, upcoming). Kanban board view with application cards. Clean, organized, professional UI design with subtle animations.',
    },
  ];

  return (
    <section className="py-20 bg-white" id="agents">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F1724] mb-4">
            Powerful Features, Simple Experience
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to go from application to acceptance
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-24">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isEven = index % 2 === 0;

            return (
              <div
                key={index}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  !isEven ? 'lg:grid-flow-dense' : ''
                }`}
              >
                {/* Content */}
                <div className={`${!isEven ? 'lg:col-start-2' : ''}`}>
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-[#5C6BFF] to-[#7C4DFF] rounded-xl flex items-center justify-center mb-6 shadow-lg">
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-3xl font-bold text-[#0F1724] mb-4">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-lg text-gray-600 leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {/* Learn More Link */}
                  <button
                    onClick={() => {
                      document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[#5C6BFF] font-semibold hover:text-[#7C4DFF] transition-colors flex items-center space-x-2 group"
                  >
                    <span>Get Early Access</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>

                {/* Image/Screenshot */}
                <div className={`${!isEven ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                  <div className="relative group">
                    {/* 3D Card Effect */}
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={400}
                      height={300}
                      className="rounded-2xl shadow-xl"
                    ></Image>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
