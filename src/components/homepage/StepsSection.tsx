
import React from 'react';
import { CheckCircle } from 'lucide-react';

const StepsSection = () => {
  const steps = [
    { id: 1, label: 'Profile', icon: '👤', description: 'Build your academic profile' },
    { id: 2, label: 'Match', icon: '🎯', description: 'Find perfect university matches' },
    { id: 3, label: 'Apply', icon: '📝', description: 'Submit strong applications' },
    { id: 4, label: 'Fund', icon: '💰', description: 'Secure scholarships & funding' },
    { id: 5, label: 'Visa', icon: '✈️', description: 'Get your visa approved' },
    { id: 6, label: 'Success', icon: '🎓', description: 'Start your journey abroad' }
  ];

  const stats = [
    { value: '99%', label: 'Success Rate', icon: '✅' },
    { value: '10,000+', label: 'Students', icon: '🎓' },
    { value: '50+', label: 'Countries', icon: '🌍' },
    { value: '24/7', label: 'AI Support', icon: '🧠' }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-emerald-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ⚙️ 6 Simple Steps to Study Abroad
          </h2>
          <p className="text-xl text-gray-600">
            Our proven methodology that has helped thousands of students
          </p>
        </div>

        {/* Progress Steps */}
        <div className="relative mb-16">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 to-purple-200 transform -translate-y-1/2 hidden md:block"></div>
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform -translate-y-1/2 hidden md:block"></div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            {steps.map((step, index) => (
              <div key={step.id} className="relative text-center">
                <div className="bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg border-4 border-blue-500 relative z-10">
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.label}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-all">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
