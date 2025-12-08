
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SummerCampsCTA = () => {
  const navigate = useNavigate();

  const scrollToCampExplorer = () => {
    const element = document.getElementById('camp-explorer');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const goToMentorship = () => {
    navigate('/mentorship');
  };

  return (
    <section className="py-16 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Make Your Summer Count?
        </h2>
        <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
          Apply for a life-changing camp abroad today and join thousands of students who've transformed their summers into unforgettable adventures.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg"
            onClick={scrollToCampExplorer}
          >
            <Search className="mr-2 h-5 w-5" />
            Browse All Camps
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-white text-white hover:bg-white hover:text-purple-600 font-semibold px-8 py-4 text-lg"
            onClick={goToMentorship}
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Talk to a Camp Advisor
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-3xl font-bold mb-2">500+</div>
            <div className="text-lg opacity-90">Students placed annually</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-3xl font-bold mb-2">50+</div>
            <div className="text-lg opacity-90">Partner institutions</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-3xl font-bold mb-2">$2M+</div>
            <div className="text-lg opacity-90">Scholarships awarded</div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg opacity-75">
            🌟 Early bird applications open now for Summer 2025 programs
          </p>
        </div>
      </div>
    </section>
  );
};

export default SummerCampsCTA;
