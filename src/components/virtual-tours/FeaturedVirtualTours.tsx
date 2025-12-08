
import React from 'react';
import FeaturedTourCard from './FeaturedTourCard';

const FeaturedVirtualTours = () => {
  const featuredTours = [
    {
      title: "University of British Columbia – Campus Walkthrough",
      country: "Canada",
      tourTypes: ["Campus", "Dorm", "Library"],
      duration: "5 min (360°)",
      image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=600&q=80",
      ctaText: "View Tour",
      description: "Explore UBC's stunning campus with ocean and mountain views"
    },
    {
      title: "City Life in Melbourne for Students",
      country: "Australia",
      tourTypes: ["Culture", "Transport", "Food"],
      duration: "7 min",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80",
      ctaText: "Explore City",
      description: "Discover Melbourne's vibrant student culture and lifestyle"
    },
    {
      title: "MIT Research Labs & Innovation Hubs",
      country: "USA",
      tourTypes: ["Lab Tour"],
      duration: "6 min",
      image: "https://images.unsplash.com/photo-1431576901776-e539bd916ba2?auto=format&fit=crop&w=600&q=80",
      ctaText: "Take Tour",
      description: "Step inside cutting-edge research facilities and innovation spaces"
    },
    {
      title: "University of Edinburgh Dorm Tour",
      country: "UK",
      tourTypes: ["Housing"],
      duration: "4 min",
      format: "Short video + photos",
      image: "https://images.unsplash.com/photo-1496307653780-42ee777d4833?auto=format&fit=crop&w=600&q=80",
      ctaText: "Watch Tour",
      description: "Experience student accommodation and campus living"
    }
  ];

  return (
    <section id="featured-tours" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Virtual Tours
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start your journey with our most popular and immersive university experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredTours.map((tour, index) => (
            <FeaturedTourCard
              key={index}
              {...tour}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
            View All Tours
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedVirtualTours;
