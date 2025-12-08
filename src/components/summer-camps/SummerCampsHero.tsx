
import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Calendar, Users } from 'lucide-react';

const SummerCampsHero = () => {
  const scrollToCampExplorer = () => {
    const element = document.getElementById('camp-explorer');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToEligibility = () => {
    const element = document.getElementById('eligibility-steps');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Discover Global Summer Camps & 
          <span className="block text-yellow-300">Short-Term Study Experiences</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed">
          Join top programs abroad in STEM, arts, business, and language. Make your summer unforgettable.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg"
            onClick={scrollToCampExplorer}
          >
            <Globe className="mr-2 h-5 w-5" />
            Browse Camps
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-white text-white hover:bg-white hover:text-purple-600 font-semibold px-8 py-4 text-lg"
            onClick={scrollToEligibility}
          >
            <Users className="mr-2 h-5 w-5" />
            Check Eligibility
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">30+ Countries</h3>
            <p className="text-sm opacity-90">Explore programs worldwide</p>
          </div>
          <div className="text-center">
            <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">2-8 Week Programs</h3>
            <p className="text-sm opacity-90">Flexible durations available</p>
          </div>
          <div className="text-center">
            <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ages 14-24</h3>
            <p className="text-sm opacity-90">Programs for all levels</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SummerCampsHero;
