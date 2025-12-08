'use client';

import { FileText, Search, CheckSquare } from 'lucide-react';

const KeyBenefits = () => {
  const benefits = [
    {
      icon: FileText,
      title: 'Document AI',
      description: 'Generate flawless SOPs, LORs, and essays tailored to your profile in minutes',
      gradient: 'from-[#5C6BFF] to-[#7C4DFF]',
    },
    {
      icon: Search,
      title: 'Research AI',
      description: 'Discover perfect-fit programs across 50+ countries with intelligent matching',
      gradient: 'from-[#7C4DFF] to-[#5C6BFF]',
    },
    {
      icon: CheckSquare,
      title: 'Tracker AI',
      description: 'Never miss a deadline with automated tracking and smart reminders',
      gradient: 'from-[#5C6BFF] to-[#2B2F8A]',
    },
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden" id="product">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #5C6BFF 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F1724] mb-4">
            Your AI-Powered Study Abroad Team
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Three specialized AI agents working together to simplify your journey
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                
                {/* Icon */}
                <div className={`relative w-16 h-16 bg-gradient-to-br ${benefit.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="text-2xl font-bold text-[#0F1724] mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                {/* Decorative Corner */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${benefit.gradient} opacity-10 rounded-bl-full transition-opacity group-hover:opacity-20`}></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default KeyBenefits;
