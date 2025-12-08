
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Shield, Clock } from "lucide-react";

interface MarketplaceHeaderProps {
  onCategorySelect: (category: string) => void;
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({ onCategorySelect }) => {
  const benefits = [
    { icon: CheckCircle, text: "20+ Verified Tools", color: "text-green-600" },
    { icon: Clock, text: "Instant Checkout", color: "text-blue-600" },
    { icon: Star, text: "Reviewed by Real Students", color: "text-yellow-600" },
    { icon: Shield, text: "No Agents or Middlemen", color: "text-purple-600" }
  ];

  return (
    <section className="pt-20 pb-16 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Get Everything You Need to
            <span className="text-emerald-600"> Study Abroad</span>
            <br />— In One Place
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Affordable, trusted, and student-tested tools to make your journey smoother.
          </p>
          
          {/* Benefits Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
                  <IconComponent className={`h-8 w-8 ${benefit.color} mx-auto mb-3`} />
                  <p className="font-semibold text-gray-900">{benefit.text}</p>
                </div>
              );
            })}
          </div>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-4"
              onClick={() => onCategorySelect("")}
            >
              Browse by Category
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4 border-2 hover:bg-gray-50"
              onClick={() => onCategorySelect("trending")}
            >
              Explore Trending
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceHeader;
