
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Quote, Star } from 'lucide-react';

const StudentStories = () => {
  const stories = [
    {
      name: 'Sarah Chen',
      avatar: '/placeholder.svg',
      program: 'Computer Science',
      university: 'Stanford University',
      country: 'USA',
      scholarship: 'Merit Scholarship - $30,000',
      story: 'EduLens helped me navigate the complex application process. The mentorship program was invaluable, and I received a substantial scholarship that made my dream affordable.',
      outcome: 'Software Engineer at Google',
      rating: 5
    },
    {
      name: 'Ahmed Hassan',
      avatar: '/placeholder.svg',
      program: 'Business Administration',
      university: 'London Business School',
      country: 'UK',
      scholarship: 'Chevening Scholarship',
      story: 'The scholarship finder tool was amazing! I discovered opportunities I never knew existed. Now I\'m studying at one of the world\'s top business schools.',
      outcome: 'Management Consultant',
      rating: 5
    },
    {
      name: 'Maria Rodriguez',
      avatar: '/placeholder.svg',
      program: 'Engineering',
      university: 'ETH Zurich',
      country: 'Switzerland',
      scholarship: 'Excellence Scholarship - €15,000',
      story: 'The comparison tool helped me choose the perfect program. ETH Zurich offered the best combination of academic excellence and research opportunities.',
      outcome: 'Research Scientist',
      rating: 5
    },
    {
      name: 'Raj Patel',
      avatar: '/placeholder.svg',
      program: 'Data Science',
      university: 'University of Toronto',
      country: 'Canada',
      scholarship: 'Vanier Scholarship',
      story: 'From application guidance to visa support, EduLens was with me every step. The AI tools saved me months of research time.',
      outcome: 'Data Scientist at Microsoft',
      rating: 5
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
          <p className="text-lg text-gray-600">Real students who achieved their study abroad dreams</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stories.map((story, index) => (
            <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0 rounded-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={story.avatar} alt={story.name} />
                    <AvatarFallback>{story.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{story.name}</h3>
                    <p className="text-sm text-gray-600">{story.program} at {story.university}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{story.country}</Badge>
                      <div className="flex items-center gap-1">
                        {[...Array(story.rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative mb-4">
                  <Quote className="h-6 w-6 text-emerald-600 mb-2" />
                  <p className="text-gray-700 italic">"{story.story}"</p>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-1">Scholarship Received</h4>
                    <p className="text-sm text-green-700">{story.scholarship}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Current Role</h4>
                    <p className="text-sm text-blue-700">{story.outcome}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Join thousands of successful students worldwide</p>
          <div className="flex justify-center items-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">10,000+</div>
              <div className="text-sm text-gray-600">Students Placed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">$50M+</div>
              <div className="text-sm text-gray-600">Scholarships Secured</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">95%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentStories;
