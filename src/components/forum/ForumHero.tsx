
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Search, Plus } from 'lucide-react';

interface ForumHeroProps {
  onAskQuestion: () => void;
}

const ForumHero: React.FC<ForumHeroProps> = ({ onAskQuestion }) => {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="mb-8">
          <MessageSquare className="w-16 h-16 mx-auto mb-6 text-blue-200" />
          <h1 className="text-5xl font-bold mb-6">Join the Conversation</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Ask questions, share answers, and connect with students worldwide on all things study abroad.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 py-3"
          >
            <Search className="w-5 h-5 mr-2" />
            Explore Topics
          </Button>
          <Button 
            size="lg"
            onClick={onAskQuestion}
            className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-3"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ask a Question
          </Button>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-200">25K+</div>
            <div className="text-blue-100">Active Students</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-200">150K+</div>
            <div className="text-blue-100">Questions Answered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-200">50+</div>
            <div className="text-blue-100">Countries Represented</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForumHero;
