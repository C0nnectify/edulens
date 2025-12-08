
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Star } from "lucide-react";

const SellOnMarketplaceCTA = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: "Earn Money",
      description: "Set your own prices and earn from your expertise"
    },
    {
      icon: TrendingUp,
      title: "Build Brand",
      description: "Establish yourself as a trusted expert in your field"
    },
    {
      icon: Users,
      title: "Help Students",
      description: "Make a real impact on future students' journeys"
    },
    {
      icon: Star,
      title: "Grow Reputation",
      description: "Build credibility through student reviews and ratings"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-emerald-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-2 border-emerald-200 shadow-xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Offer a Service or Tool?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join our marketplace and start helping students while building your business
            </p>
            
            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
            
            {/* CTA */}
            <Button 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-4"
            >
              Apply to Sell
            </Button>
            
            {/* Trust indicators */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-500 text-sm mb-4">Trusted by service providers worldwide</p>
              <div className="flex items-center justify-center space-x-8 text-gray-400">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">500+</div>
                  <div className="text-sm">Active Sellers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">$2M+</div>
                  <div className="text-sm">Earned by Sellers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">4.8</div>
                  <div className="text-sm">Average Rating</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SellOnMarketplaceCTA;
