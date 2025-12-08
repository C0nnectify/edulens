
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, DollarSign, RefreshCw, Play } from 'lucide-react';

interface ValuePropositionBannerProps {
  onStartJourney: () => void;
}

const ValuePropositionBanner: React.FC<ValuePropositionBannerProps> = ({ onStartJourney }) => {
  const features = [
    { icon: Check, text: 'Free Trial', color: 'text-green-400' },
    { icon: DollarSign, text: 'No Hidden Fees', color: 'text-blue-400' },
    { icon: RefreshCw, text: 'Money Back (30-day guarantee)', color: 'text-purple-400' }
  ];

  const miniStats = [
    { value: '10,000+', label: 'Helped' },
    { value: '4.9/5', label: 'Rating' },
    { value: '95%', label: 'Success' }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
            🎯 Ready to Start Your Journey?
          </h2>

          {/* Features */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="flex items-center text-white">
                  <IconComponent className={`w-6 h-6 ${feature.color} mr-3`} />
                  <span className="text-lg font-medium">{feature.text}</span>
                </div>
              );
            })}
          </div>

          {/* Mini Stats */}
          <div className="flex justify-center items-center gap-8 mb-8">
            {miniStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={onStartJourney}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              🚀 Start Journey
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-4 rounded-xl transition-all"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValuePropositionBanner;
