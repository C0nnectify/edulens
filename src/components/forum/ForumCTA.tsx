
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Users } from 'lucide-react';

interface ForumCTAProps {
  onAskQuestion: () => void;
}

const ForumCTA: React.FC<ForumCTAProps> = ({ onAskQuestion }) => {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Join the Conversation?</h2>
        <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
          Connect with thousands of students, get expert advice, and share your knowledge 
          with the study abroad community.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg"
            onClick={onAskQuestion}
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ask a Question
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-blue-700 font-semibold px-8"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            View My Threads
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-blue-700 font-semibold px-8"
          >
            <Users className="w-5 h-5 mr-2" />
            Invite Friends
          </Button>
        </div>
        
        {/* Sticky CTA Bar - Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 border-t border-blue-500 p-4 z-30 md:hidden">
          <div className="flex gap-2">
            <Button 
              onClick={onAskQuestion}
              className="flex-1 bg-white text-blue-700 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ask Question
            </Button>
            <Button 
              variant="outline"
              className="flex-1 border-white text-white hover:bg-white hover:text-blue-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              My Threads
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-200 mb-2">24/7</div>
            <div className="text-blue-100">Community Support</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-200 mb-2">Expert</div>
            <div className="text-blue-100">Verified Mentors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-200 mb-2">Free</div>
            <div className="text-blue-100">Forever Access</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForumCTA;
