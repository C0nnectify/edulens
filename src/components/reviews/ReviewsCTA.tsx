
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Users, MessageSquare, ArrowRight } from 'lucide-react';

const ReviewsCTA = () => {
  const scrollToWriteReview = () => {
    const element = document.getElementById('write-review');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const ctaCards = [
    {
      icon: Edit,
      title: 'Write Your First Review',
      description: 'Share your experience and help future students make informed decisions.',
      buttonText: 'Start Writing',
      action: scrollToWriteReview,
      color: 'bg-blue-500'
    },
    {
      icon: Users,
      title: 'Connect with Review Authors',
      description: 'Get in touch with students who have been where you want to go.',
      buttonText: 'Find Connections',
      action: () => window.location.href = '/mentorship',
      color: 'bg-purple-500'
    },
    {
      icon: MessageSquare,
      title: 'Join as a Mentor',
      description: 'Help other students with your knowledge and experience.',
      buttonText: 'Become a Mentor',
      action: () => window.location.href = '/mentorship',
      color: 'bg-green-500'
    }
  ];

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Join our community of students helping students. Your experience matters and can make a real difference.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {ctaCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-8 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${card.color} text-white mb-6 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-bold mb-4">{card.title}</h3>
                <p className="text-gray-600 mb-6">{card.description}</p>
                
                <Button 
                  onClick={card.action}
                  className={`${card.color} hover:opacity-90 text-white group-hover:shadow-lg transition-all`}
                >
                  {card.buttonText}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-8 rounded-2xl">
          <h3 className="text-2xl font-bold mb-4">Join 15,000+ Students Worldwide</h3>
          <p className="mb-6 opacity-90">
            Be part of the largest community of international students sharing real experiences.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-gray-100"
            onClick={scrollToWriteReview}
          >
            Write Your First Review
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ReviewsCTA;
