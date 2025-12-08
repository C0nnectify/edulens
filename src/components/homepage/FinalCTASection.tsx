
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Check, RefreshCw, DollarSign, Users, Star } from 'lucide-react';

interface FinalCTASectionProps {
  onStartJourney: () => void;
}

const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onStartJourney }) => {
  const badges = [
    { icon: Check, text: 'Free Trial', color: 'text-green-400' },
    { icon: RefreshCw, text: 'Money Back', color: 'text-blue-400' },
    { icon: DollarSign, text: 'No Hidden Fees', color: 'text-purple-400' },
    { icon: Users, text: '10K+ Students', color: 'text-orange-400' },
    { icon: Star, text: '4.9/5 Rating', color: 'text-yellow-400' }
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-40 h-40 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          🚀 Ready to Start Your Journey?
        </h2>
        
        <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-12 leading-relaxed">
          Join thousands of students who've achieved their study abroad dreams with EduLens.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <Button 
            size="lg"
            onClick={onStartJourney}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-xl px-10 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            🚀 Start Your Journey
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-gray-900 text-xl px-10 py-6 rounded-2xl transition-all transform hover:scale-105"
          >
            <Play className="w-6 h-6 mr-3" />
            Watch Demo
          </Button>
        </div>

        {/* Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 max-w-4xl mx-auto">
          {badges.map((badge, index) => {
            const IconComponent = badge.icon;
            return (
              <div key={index} className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-xl p-6 transition-all hover:bg-white/20">
                <IconComponent className={`w-8 h-8 ${badge.color} mb-3`} />
                <span className="text-white font-medium text-center">{badge.text}</span>
              </div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 pt-8 border-t border-white/20">
          <p className="text-gray-300 text-sm">
            Trusted by students worldwide • AI-powered guidance
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
