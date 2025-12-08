
import React from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, Search, FileText } from 'lucide-react';

const PhDHero = () => {
  const scrollToFinder = () => {
    const element = document.getElementById('finder');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 pt-20 pb-16">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%235b21b6%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-4 rounded-full mr-4">
                <GraduationCap className="h-12 w-12 text-purple-600" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Explore Fully-Funded
                  <span className="text-purple-600"> PhD & Doctoral Programs</span>
                </h1>
              </div>
            </div>
            
            <p className="text-xl text-gray-600 mb-8">
              Match with supervisors, build your proposal, and apply to top research universities worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4"
                onClick={scrollToFinder}
              >
                <Search className="mr-2 h-5 w-5" />
                Find PhD Programs
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4"
                onClick={() => window.location.href = '/proposal-review'}
              >
                <FileText className="mr-2 h-5 w-5" />
                Submit Research Proposal
              </Button>
            </div>
          </div>
          
          <div className="hidden lg:block">
            <img 
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop" 
              alt="PhD Student Research" 
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhDHero;
