
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Home, FlaskConical, MapPin, UtensilsCrossed } from 'lucide-react';

const TourCategoryExplorer = () => {
  const [activeCategory, setActiveCategory] = useState('Campus');

  const categories = [
    { name: 'Campus', icon: Building, count: 150, color: 'bg-blue-500' },
    { name: 'Dorms', icon: Home, count: 80, color: 'bg-green-500' },
    { name: 'Labs', icon: FlaskConical, count: 45, color: 'bg-purple-500' },
    { name: 'Cities', icon: MapPin, count: 35, color: 'bg-orange-500' },
    { name: 'Culture & Food', icon: UtensilsCrossed, count: 25, color: 'bg-red-500' }
  ];

  const mockTours = {
    Campus: [
      { name: "Harvard Yard Virtual Walk", university: "Harvard University", duration: "8 min" },
      { name: "Stanford Campus 360°", university: "Stanford University", duration: "12 min" },
      { name: "Oxford Quadrangles Tour", university: "University of Oxford", duration: "10 min" }
    ],
    Dorms: [
      { name: "MIT Student Housing", university: "MIT", duration: "6 min" },
      { name: "Cambridge College Rooms", university: "Cambridge", duration: "5 min" },
      { name: "UBC Residence Tour", university: "UBC", duration: "7 min" }
    ],
    Labs: [
      { name: "AI Research Lab", university: "MIT", duration: "9 min" },
      { name: "Chemistry Labs", university: "Harvard", duration: "11 min" },
      { name: "Engineering Workshop", university: "Stanford", duration: "8 min" }
    ],
    Cities: [
      { name: "Boston Student Life", university: "Various", duration: "15 min" },
      { name: "London University Area", university: "Various", duration: "18 min" },
      { name: "Toronto Campus District", university: "Various", duration: "12 min" }
    ],
    "Culture & Food": [
      { name: "Campus Dining Halls", university: "Various", duration: "6 min" },
      { name: "Student Cultural Centers", university: "Various", duration: "8 min" },
      { name: "Local Food Scene", university: "Various", duration: "10 min" }
    ]
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Explore by Category
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose what matters most to you and discover tailored virtual experiences
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ${
                  activeCategory === category.name
                    ? `${category.color} text-white shadow-lg scale-105`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="font-medium">{category.name}</span>
                <Badge variant="secondary" className="bg-white/20 text-current border-0">
                  {category.count}
                </Badge>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTours[activeCategory as keyof typeof mockTours]?.map((tour, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">{tour.name}</h3>
                <p className="text-gray-600 mb-2">{tour.university}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{tour.duration}</span>
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    {activeCategory}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TourCategoryExplorer;
