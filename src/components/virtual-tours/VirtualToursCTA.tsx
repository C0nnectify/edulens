
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, ArrowRight, Globe, Star } from 'lucide-react';

const VirtualToursCTA = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToExplore = () => {
    const element = document.getElementById('explore');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
            <Globe className="w-4 h-4 mr-2" />
            Step Into Your Dream Campus Today
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ready to Explore Your Future?
          </h2>
          
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
            Don't just read about universities — experience them. Start your virtual journey and make confident decisions about your education abroad.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg"
              onClick={scrollToExplore}
            >
              <Play className="mr-2 h-5 w-5" />
              Explore Virtual Tours
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 text-lg"
              onClick={scrollToTop}
            >
              <Star className="mr-2 h-5 w-5" />
              Compare Universities
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl font-bold mb-2">500+</div>
              <div className="text-lg opacity-90">Virtual Tours Available</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-lg opacity-90">Countries & Cities</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl font-bold mb-2">98%</div>
              <div className="text-lg opacity-90">Student Satisfaction</div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg opacity-75">
              🌟 Featured in top study abroad platforms worldwide
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VirtualToursCTA;
