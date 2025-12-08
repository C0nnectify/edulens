
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, MessageCircle, ArrowRight } from 'lucide-react';

const PhDCallToAction = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Need Help With Your PhD Plan?</h2>
          <p className="text-xl text-purple-100">Get expert feedback or find the right supervisor for your project</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/15 transition-all">
            <CardContent className="p-8 text-center">
              <div className="bg-white/20 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">1:1 Mentor Session</h3>
              <p className="text-purple-100 mb-6">
                Get personalized guidance from PhD holders and admission experts. Discuss your research ideas, application strategy, and career goals.
              </p>
              <Button 
                className="bg-white text-purple-600 hover:bg-gray-100 w-full"
                onClick={() => window.location.href = '/mentorship'}
              >
                Book Mentor Session
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/15 transition-all">
            <CardContent className="p-8 text-center">
              <div className="bg-white/20 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Proposal Review Service</h3>
              <p className="text-purple-100 mb-6">
                Get professional feedback on your research proposal from experienced academics. Improve your chances of acceptance and funding.
              </p>
              <Button 
                className="bg-white text-purple-600 hover:bg-gray-100 w-full"
                onClick={() => window.location.href = '/proposal-review'}
              >
                Submit Proposal for Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-12 text-center">
          <Card className="bg-white/5 backdrop-blur-lg border border-white/10 inline-block">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <MessageCircle className="h-6 w-6 text-white" />
                <div className="text-left">
                  <p className="text-white font-medium">Questions? Need immediate help?</p>
                  <p className="text-purple-100 text-sm">Join our community of PhD aspirants and get instant support</p>
                </div>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Join Community
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PhDCallToAction;
