
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Star, Quote } from 'lucide-react';

const TestimonialsCarousel = () => {
  const testimonials = [
    {
      name: "Ayesha Rahman",
      country: "Pakistan",
      university: "University of British Columbia",
      quote: "UBC virtual tour helped me choose Canada. I could see the campus layout, dorms, and even the beautiful mountain views. It made my decision so much easier!",
      rating: 5,
      program: "Computer Science"
    },
    {
      name: "Carlos Rodriguez",
      country: "Mexico",
      university: "Technical University of Berlin",
      quote: "Berlin city tour showed me the startup vibe and student culture. The virtual reality experience felt like I was actually walking through the streets!",
      rating: 5,
      program: "Engineering"
    },
    {
      name: "Priya Sharma",
      country: "India",
      university: "University of Melbourne",
      quote: "The Melbourne virtual tour convinced me it was the right choice. Seeing the labs, library, and city life gave me confidence in my application.",
      rating: 5,
      program: "Data Science"
    },
    {
      name: "Ahmed Hassan",
      country: "Egypt",
      university: "MIT",
      quote: "MIT's lab tours were incredible! I could explore the research facilities in 360° and understand the innovation culture before applying.",
      rating: 5,
      program: "AI Research"
    }
  ];

  return (
    <section className="py-16 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Students Are Saying
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover how virtual tours helped students make confident decisions about their future
          </p>
        </div>

        <Carousel className="max-w-5xl mx-auto">
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2">
                <Card className="h-full bg-white shadow-lg border-0">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <Quote className="w-8 h-8 text-blue-300 mb-4" />
                    
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                          <p className="text-sm text-gray-600">{testimonial.country}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-blue-600">{testimonial.university}</p>
                          <p className="text-sm text-gray-600">{testimonial.program}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
