'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

const SocialProof = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: 'Rahima Akter',
      university: 'MIT, USA',
      image: 'Student 1',
      quote: 'EduLens helped me craft a perfect SOP. Got accepted to my dream school!',
      rating: 5,
      imagePrompt: 'Professional headshot of a confident young Bangladeshi female student wearing glasses and a blue blazer, warm smile, soft studio lighting, high quality portrait',
    },
    {
      name: 'Karim Rahman',
      university: 'Oxford, UK',
      image: 'Student 2',
      quote: 'The AI research agent saved me months of work. Found perfect programs instantly.',
      rating: 5,
      imagePrompt: 'Professional headshot of a friendly young Bangladeshi male student in smart casual attire, genuine smile, natural lighting, high quality portrait',
    },
    {
      name: 'Nadia Islam',
      university: 'Toronto, Canada',
      image: 'Student 3',
      quote: 'Deadline tracking kept me organized. Never missed a single submission date.',
      rating: 5,
      imagePrompt: 'Professional headshot of a cheerful young Bangladeshi female student with long dark hair, wearing a white shirt, confident expression, soft lighting',
    },
  ];

  const universities = [
    { name: 'MIT', color: 'from-red-500 to-red-600' },
    { name: 'Oxford', color: 'from-blue-600 to-blue-700' },
    { name: 'Stanford', color: 'from-red-600 to-red-700' },
    { name: 'Cambridge', color: 'from-blue-500 to-blue-600' },
    { name: 'Harvard', color: 'from-red-700 to-red-800' },
    { name: 'Toronto', color: 'from-blue-700 to-blue-800' },
    { name: 'Yale', color: 'from-blue-800 to-blue-900' },
    { name: 'Columbia', color: 'from-blue-400 to-blue-500' },
    { name: 'Princeton', color: 'from-orange-500 to-orange-600' },
    { name: 'Cornell', color: 'from-red-500 to-red-600' },
  ];

  const stats = [
    { number: '10,000+', label: 'Students Helped' },
    { number: '50+', label: 'Countries' },
    { number: '95%', label: 'Success Rate' },
    { number: '24/7', label: 'AI Support' },
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-[#F6F9FF] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#5C6BFF] to-[#7C4DFF] bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F1724] mb-4">
            Trusted by Students Worldwide
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands who transformed their study abroad dreams into reality
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-xl">
            {/* Quote Icon */}
            <Quote className="w-12 h-12 text-[#5C6BFF] opacity-20 mb-6" />

            {/* Testimonial Content */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Student Image */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-[#5C6BFF]/20 to-[#7C4DFF]/20 rounded-full flex items-center justify-center">
                  <div className="text-center text-xs text-gray-500 p-2">
                    👤 {testimonials[currentTestimonial].image}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                {/* Rating */}
                <div className="flex justify-center md:justify-start mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                  &ldquo;{testimonials[currentTestimonial].quote}&rdquo;
                </p>

                {/* Student Info */}
                <div>
                  <p className="font-bold text-[#0F1724] text-lg">
                    {testimonials[currentTestimonial].name}
                  </p>
                  <p className="text-[#5C6BFF]">{testimonials[currentTestimonial].university}</p>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="w-10 h-10 bg-[#F6F9FF] hover:bg-gradient-to-r hover:from-[#5C6BFF] hover:to-[#7C4DFF] rounded-full flex items-center justify-center transition-all hover:text-white group"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5 text-[#5C6BFF] group-hover:text-white" />
              </button>
              <button
                onClick={nextTestimonial}
                className="w-10 h-10 bg-[#F6F9FF] hover:bg-gradient-to-r hover:from-[#5C6BFF] hover:to-[#7C4DFF] rounded-full flex items-center justify-center transition-all hover:text-white group"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5 text-[#5C6BFF] group-hover:text-white" />
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentTestimonial
                      ? 'bg-[#5C6BFF] w-8'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Partner Universities - Auto-scrolling */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#F6F9FF] via-white to-[#F6F9FF] py-12 rounded-2xl">
          <h3 className="text-2xl lg:text-3xl font-bold text-[#0F1724] mb-10 text-center">
            Trusted by students at
          </h3>
          
          {/* Scrolling container */}
          <div className="relative flex overflow-hidden">
            {/* Gradient overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
            
            {/* Scrolling track */}
            <div className="flex animate-scroll-left gap-16">
              {/* First set of universities */}
              {universities.map((uni, index) => (
                <div
                  key={`first-${index}`}
                  className="flex-shrink-0"
                >
                  <div className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r ${uni.color} bg-clip-text text-transparent hover:scale-110 transition-transform duration-300 cursor-pointer whitespace-nowrap`}>
                    {uni.name}
                  </div>
                </div>
              ))}
              
              {/* Spacing between sets */}
              <div className="w-16"></div>
              
              {/* Duplicate set for seamless loop */}
              {universities.map((uni, index) => (
                <div
                  key={`second-${index}`}
                  className="flex-shrink-0"
                >
                  <div className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r ${uni.color} bg-clip-text text-transparent hover:scale-110 transition-transform duration-300 cursor-pointer whitespace-nowrap`}>
                    {uni.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-scroll-left {
          animation: scroll-left 40s linear infinite;
        }
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default SocialProof;
