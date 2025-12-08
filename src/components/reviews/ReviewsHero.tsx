
import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, Users, MessageSquare } from 'lucide-react';

const ReviewsHero = () => {
  const scrollToWriteReview = () => {
    const element = document.getElementById('write-review');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToReviews = () => {
    const element = document.getElementById('reviews-grid');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20 mt-16">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="mb-8">
          <div className="flex justify-center items-center mb-6">
            <div className="flex -space-x-2">
              <div className="w-12 h-12 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Real Reviews from{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Real Students
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Universities, cities, housing, visas — everything they wish they knew before applying. 
            Get honest insights from students who've been there.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            onClick={scrollToReviews}
          >
            Read Reviews
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
            onClick={scrollToWriteReview}
          >
            Write a Review
          </Button>
        </div>

        <div className="flex justify-center items-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <span>15,000+ Reviews</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>50+ Countries</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            <span>100% Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsHero;
