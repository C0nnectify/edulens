
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    text: "UBC housing review saved me money",
    details: "Found out about cheaper off-campus options through student reviews. Saved $500/month!",
    author: "Jessica Chen",
    university: "University of British Columbia"
  },
  {
    id: 2,
    text: "Visa tips helped me avoid agent scam",
    details: "Reviews warned me about fake agents. Applied directly and got my visa without paying extra fees.",
    author: "Ahmed Hassan",
    university: "University of Toronto"
  },
  {
    id: 3,
    text: "City reviews made me choose Melbourne",
    details: "Reading about student life in different cities helped me pick the perfect place for my personality.",
    author: "Sofia Rodriguez",
    university: "University of Melbourne"
  },
  {
    id: 4,
    text: "Course reviews helped me choose the right major",
    details: "Real student feedback about workload and job prospects helped me switch to a better program.",
    author: "Kai Tanaka",
    university: "National University of Singapore"
  }
];

const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">How Reviews Helped Students</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Real stories from students who made better decisions thanks to our review community.
        </p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <Quote className="w-12 h-12 text-blue-500 mx-auto mb-6" />
            
            <blockquote className="text-2xl font-medium text-gray-900 mb-6">
              "{testimonials[currentIndex].text}"
            </blockquote>
            
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              {testimonials[currentIndex].details}
            </p>
            
            <div>
              <p className="font-semibold text-gray-900">{testimonials[currentIndex].author}</p>
              <p className="text-gray-600">{testimonials[currentIndex].university}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center items-center mt-8 gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={prevTestimonial}
            className="rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={nextTestimonial}
            className="rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
