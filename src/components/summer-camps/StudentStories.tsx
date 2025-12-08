
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Star, Quote } from 'lucide-react';

const StudentStories = () => {
  const testimonials = [
    {
      id: 1,
      name: "Reem A.",
      country: "Egypt",
      camp: "Oxford STEM",
      image: "/placeholder.svg",
      quote: "I built my first robot, made international friends, and explored London. The camp changed my life.",
      rating: 5,
      program: "Robotics & AI Track"
    },
    {
      id: 2,
      name: "Daniel R.",
      country: "Brazil",
      camp: "Harvard Leadership",
      image: "/placeholder.svg",
      quote: "Learning to pitch a startup idea at Harvard was inspiring. I gained skills and confidence.",
      rating: 5,
      program: "Entrepreneurship Track"
    },
    {
      id: 3,
      name: "Yuki T.",
      country: "South Korea",
      camp: "Sorbonne Arts",
      image: "/placeholder.svg",
      quote: "Living in Paris and studying French art was a dream come true. I discovered my artistic passion.",
      rating: 5,
      program: "Art & Culture Track"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Student Success Stories</h2>
          <p className="text-lg text-gray-600">Hear from students who transformed their summers abroad</p>
        </div>
        
        <Carousel className="max-w-5xl mx-auto">
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/2">
                <Card className="bg-white shadow-lg border-0 h-full">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover mr-4"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                        <p className="text-gray-600 text-sm">{testimonial.country}</p>
                        <p className="text-blue-600 text-sm font-medium">{testimonial.camp}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <Quote className="h-8 w-8 text-purple-400 mb-2" />
                      <p className="text-gray-700 italic text-lg leading-relaxed">
                        "{testimonial.quote}"
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">{testimonial.program}</p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-gray-600">Would recommend to friends</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">88%</div>
              <div className="text-gray-600">Return for advanced programs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">4.8/5</div>
              <div className="text-gray-600">Average satisfaction rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentStories;
