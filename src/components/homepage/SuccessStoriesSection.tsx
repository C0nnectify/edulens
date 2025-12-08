
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SuccessStoriesSection = () => {
  const [currentStory, setCurrentStory] = useState(0);

  const topMetrics = [
    { icon: '🎉', value: '2,000+', label: 'Stories' },
    { icon: '🎯', value: '95%', label: 'Admission Rate' },
    { icon: '💰', value: '$2M+', label: 'Scholarships' },
    { icon: '🌍', value: '50+', label: 'Countries' }
  ];

  const stories = [
    {
      name: 'Sarah Chen',
      program: 'MS Computer Science',
      university: 'Stanford University',
      country: 'USA',
      graduationYear: '2024',
      quote: 'EduLens AI helped me craft the perfect SOP and find a full scholarship to Stanford. The personalized guidance was incredible!',
      achievement: 'Full Scholarship',
      tags: ['Full Funding', 'Top University'],
      image: '👩‍💻',
      rating: 5
    },
    {
      name: 'Raj Patel',
      program: 'MBA',
      university: 'Oxford University',
      country: 'UK',
      graduationYear: '2023',
      quote: 'From profile building to visa approval, EduLens guided me every step. The AI toolkit made everything 10x easier!',
      achievement: 'Dream University',
      tags: ['Merit Scholarship', 'Ivy League'],
      image: '👨‍💼',
      rating: 5
    },
    {
      name: 'Maria Rodriguez',
      program: 'PhD Engineering',
      university: 'University of Toronto',
      country: 'Canada',
      graduationYear: '2024',
      quote: 'The mentorship program connected me with alumni who helped me navigate the research proposal process perfectly.',
      achievement: 'Research Position',
      tags: ['PhD Funding', 'Research Grant'],
      image: '👩‍🔬',
      rating: 5
    },
    {
      name: 'Ahmed Hassan',
      program: 'MS Data Science',
      university: 'University of Melbourne',
      country: 'Australia',
      graduationYear: '2023',
      quote: 'EduLens AI agent helped me find the perfect program match and even secured me a co-op placement before graduation!',
      achievement: 'Co-op Placement',
      tags: ['Industry Partnership', 'Job Guarantee'],
      image: '👨‍💻',
      rating: 5
    },
    {
      name: 'Lisa Wang',
      program: 'MS Business Analytics',
      university: 'INSEAD',
      country: 'France',
      graduationYear: '2024',
      quote: 'The scholarship finder tool discovered opportunities I never knew existed. Saved me $80,000 in tuition!',
      achievement: 'Merit Scholarship',
      tags: ['50% Scholarship', 'Europe'],
      image: '👩‍💼',
      rating: 5
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStory((prev) => (prev + 1) % stories.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [stories.length]);

  const nextStory = () => {
    setCurrentStory((prev) => (prev + 1) % stories.length);
  };

  const prevStory = () => {
    setCurrentStory((prev) => (prev - 1 + stories.length) % stories.length);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            💬 Success Stories
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real students. Real transformations. Powered by EduLens AI.
          </p>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {topMetrics.map((metric, index) => (
            <div key={index} className="text-center bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="text-4xl mb-3">{metric.icon}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-sm text-gray-600">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Stories Carousel */}
        <div className="relative max-w-5xl mx-auto">
          <Card className="bg-white shadow-2xl border-0">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col lg:flex-row items-center">
                <div className="text-8xl mb-6 lg:mb-0 lg:mr-8 flex-shrink-0">
                  {stories[currentStory].image}
                </div>
                <div className="flex-1 text-center lg:text-left">
                  {/* Rating */}
                  <div className="flex justify-center lg:justify-start mb-4">
                    {[...Array(stories[currentStory].rating)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <blockquote className="text-xl md:text-2xl text-gray-700 mb-6 italic leading-relaxed">
                    "{stories[currentStory].quote}"
                  </blockquote>
                  
                  {/* Student Info */}
                  <div className="mb-6">
                    <div className="text-xl font-bold text-gray-900">{stories[currentStory].name}</div>
                    <div className="text-gray-600">{stories[currentStory].program}</div>
                    <div className="text-gray-600">{stories[currentStory].university}</div>
                    <div className="text-sm text-gray-500">Class of {stories[currentStory].graduationYear}</div>
                  </div>
                  
                  {/* Achievement Badge */}
                  <div className="inline-flex items-center bg-gradient-to-r from-emerald-100 to-blue-100 px-4 py-2 rounded-full mb-4">
                    <span className="text-sm font-semibold text-gray-700">
                      🏆 {stories[currentStory].achievement} • {stories[currentStory].country}
                    </span>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                    {stories[currentStory].tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <button
            onClick={prevStory}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <button
            onClick={nextStory}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {stories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStory(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentStory ? 'bg-blue-500 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;
