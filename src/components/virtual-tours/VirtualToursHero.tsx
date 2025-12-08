
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Globe, ArrowRight } from 'lucide-react';

const VirtualToursHero = () => {
  const scrollToExplore = () => {
    const element = document.getElementById('explore');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToComparison = () => {
    const element = document.getElementById('comparison');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Background Image/Video Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=80"
          alt="University Campus Virtual Tour"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <Globe className="w-4 h-4 mr-2" />
            360° Virtual Reality Tours
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Explore Universities & Cities
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Through Virtual Tours
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Get a 360° view of campuses, dorms, labs, and student life — all from your screen. 
            Experience university life before you apply.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold"
              onClick={scrollToExplore}
            >
              <Play className="mr-2 h-5 w-5" />
              Start Exploring
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold"
              onClick={scrollToComparison}
            >
              Compare Cities
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-100">
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Virtual Tours Available</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-100">
              <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600">Countries & Cities</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-indigo-100">
              <div className="text-3xl font-bold text-indigo-600 mb-2">1M+</div>
              <div className="text-gray-600">Students Explored</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VirtualToursHero;
