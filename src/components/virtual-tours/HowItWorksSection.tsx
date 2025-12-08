
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Play, Bookmark, CheckCircle } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      step: 1,
      icon: Search,
      title: "Choose a Tour",
      description: "Browse our extensive collection of virtual tours by country, university, or tour type",
      color: "bg-blue-500"
    },
    {
      step: 2,
      icon: Play,
      title: "Watch 360° or Video",
      description: "Experience immersive virtual reality tours or high-quality video walkthroughs",
      color: "bg-green-500"
    },
    {
      step: 3,
      icon: Bookmark,
      title: "Bookmark or Connect",
      description: "Save your favorite tours and connect with admission counselors for more information",
      color: "bg-purple-500"
    },
    {
      step: 4,
      icon: CheckCircle,
      title: "Use for Shortlisting",
      description: "Make informed decisions and create your final university shortlist with confidence",
      color: "bg-orange-500"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your journey to finding the perfect university starts with just four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="relative">
                <Card className="h-full border-2 border-gray-100 hover:border-gray-200 transition-colors">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 h-0.5 bg-gray-300"></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Start Your Virtual Journey Today
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of students who have already explored their dream universities through our immersive virtual tours
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Begin Exploring Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
