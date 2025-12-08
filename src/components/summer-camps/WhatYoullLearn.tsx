
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Users, Calendar, Search } from 'lucide-react';

const WhatYoullLearn = () => {
  const learningAreas = [
    {
      icon: Search,
      title: "Academic Tracks",
      description: "STEM, Languages, Business, Art",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Globe,
      title: "Cultural Immersion",
      description: "Local tours, cooking, workshops",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Users,
      title: "Global Friendships",
      description: "Diverse student groups",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: Calendar,
      title: "Recognition",
      description: "Certificates for college applications",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: Search,
      title: "Independence",
      description: "First-time travel, personal growth",
      color: "bg-pink-100 text-pink-600"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What You'll Learn & Experience</h2>
          <p className="text-lg text-gray-600">Transform your summer into a life-changing adventure</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {learningAreas.map((area, index) => (
            <Card key={index} className="bg-white hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 ${area.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <area.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{area.title}</h3>
                <p className="text-gray-600">{area.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">More Than Just Learning</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Live and study with students from 50+ countries</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Hands-on projects and real-world applications</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Weekend excursions to iconic landmarks</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Certificate of completion for university applications</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl p-6 text-white">
              <h4 className="text-xl font-bold mb-3">Program Highlights</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">15</div>
                  <div className="text-sm opacity-90">Hours/week classes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">6</div>
                  <div className="text-sm opacity-90">Cultural activities</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">20</div>
                  <div className="text-sm opacity-90">Students per class</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm opacity-90">Support available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatYoullLearn;
