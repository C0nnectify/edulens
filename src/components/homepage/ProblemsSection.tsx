
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, Users } from 'lucide-react';

const ProblemsSection = () => {
  const problems = [
    {
      icon: AlertTriangle,
      title: 'Information Gap',
      description: 'Students always target high-ranking universities...',
      details: 'Agency bias, limited access, and unaffordable suggestions create barriers to finding the right fit.',
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      icon: Clock,
      title: 'Long-time Research',
      description: 'No verified info, scattered blogs, need 2–3 months to decide',
      details: 'Information overload without proper verification leads to decision paralysis.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Users,
      title: 'Connection Gap',
      description: 'Hard to verify student advice, impossible to talk to real university reps',
      details: 'Lack of authentic connections makes it difficult to get reliable insider information.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🚨 Problems We're Solving
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Traditional study abroad consulting is broken. Here's how we're fixing it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem, index) => {
            const IconComponent = problem.icon;
            return (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 ${problem.bgColor} rounded-full flex items-center justify-center mb-6`}>
                    <IconComponent className={`w-8 h-8 ${problem.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{problem.title}</h3>
                  <p className="text-gray-600 mb-4">{problem.description}</p>
                  <p className="text-sm text-gray-500">{problem.details}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
