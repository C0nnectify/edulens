
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Tawsif Elahy",
      field: "PhD in Robotics",
      university: "ETH Zurich",
      country: "Switzerland",
      funding: "DAAD Scholarship",
      quote: "EduLens helped me get DAAD funding and connect with my supervisor. The proposal review service was invaluable in refining my research ideas.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Sarah Chen",
      field: "PhD in Artificial Intelligence",
      university: "University of Cambridge",
      country: "United Kingdom",
      funding: "Gates Cambridge Scholarship",
      quote: "The supervisor matching tool connected me with my perfect research mentor. Now I'm working on cutting-edge AI research with full funding.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b993?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: 3,
      name: "Marcus Johnson",
      field: "PhD in Climate Science",
      university: "University of Toronto",
      country: "Canada",
      funding: "Vanier Scholarship",
      quote: "From finding the right program to securing funding, EduLens guided me through every step. I'm now researching climate solutions in Canada.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: 4,
      name: "Priya Sharma",
      field: "PhD in Biotechnology",
      university: "Max Planck Institute",
      country: "Germany",
      funding: "Max Planck Fellowship",
      quote: "The research proposal help was exceptional. They helped me identify a unique research gap that impressed my future supervisor.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
          <p className="text-lg text-gray-600">Real students who achieved their PhD dreams through EduLens</p>
        </div>
        
        <Card className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <img 
                  src={currentTestimonial.image}
                  alt={currentTestimonial.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
                />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="mb-4">
                  <Quote className="h-8 w-8 text-purple-300 mb-2 mx-auto md:mx-0" />
                  <p className="text-lg text-gray-700 italic leading-relaxed">
                    "{currentTestimonial.quote}"
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{currentTestimonial.name}</h3>
                  <p className="text-purple-600 font-medium mb-2">{currentTestimonial.field}</p>
                  <p className="text-gray-600 mb-2">{currentTestimonial.university}</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge className="bg-purple-100 text-purple-800">
                      {currentTestimonial.country}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      {currentTestimonial.funding}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTestimonial}
                className="border-purple-300 hover:bg-purple-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex space-x-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      idx === currentIndex ? 'bg-purple-600' : 'bg-purple-200'
                    }`}
                  />
                ))}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={nextTestimonial}
                className="border-purple-300 hover:bg-purple-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
