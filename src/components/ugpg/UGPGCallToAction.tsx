
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Search, BookOpen, ArrowRight } from 'lucide-react';

const UGPGCallToAction = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-emerald-600 to-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-emerald-100">Take the next step towards your international education</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Talk to a Mentor</h3>
              <p className="text-emerald-100 mb-4">Get personalized guidance from education experts</p>
              <Button variant="outline" className="bg-white text-emerald-600 hover:bg-emerald-50 border-white">
                Book Free Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Use Research Tools</h3>
              <p className="text-emerald-100 mb-4">Explore programs, compare universities, find scholarships</p>
              <Button variant="outline" className="bg-white text-emerald-600 hover:bg-emerald-50 border-white">
                Start Research
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Save Programs</h3>
              <p className="text-emerald-100 mb-4">Bookmark your favorite programs and track deadlines</p>
              <Button variant="outline" className="bg-white text-emerald-600 hover:bg-emerald-50 border-white">
                Create Wishlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">🎯 Limited Time Offer</h3>
            <p className="text-emerald-100 text-lg mb-6">
              Sign up this month and get a FREE application review worth $200, plus access to our premium scholarship database
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-4">
                Claim Free Review
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-emerald-600 px-8 py-4">
                Learn More
              </Button>
            </div>
            <p className="text-emerald-200 text-sm mt-4">
              * Offer valid until end of month. Terms and conditions apply.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UGPGCallToAction;
