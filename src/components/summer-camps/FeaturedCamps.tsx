
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, DollarSign, Star } from 'lucide-react';

const FeaturedCamps = () => {
  const featuredCamps = [
    {
      id: 1,
      name: "Oxford STEM Summer School",
      host: "University of Oxford",
      country: "UK",
      dates: "July 1–28, 2025",
      duration: "4 weeks",
      focus: "Robotics, AI, Biomedical Engineering",
      cost: "£3,500",
      scholarship: "scholarships available",
      image: "/placeholder.svg",
      rating: 4.9,
      featured: true
    },
    {
      id: 2,
      name: "Harvard Leadership Camp",
      host: "Harvard Summer School",
      country: "USA",
      dates: "June 10–July 5, 2025",
      duration: "4 weeks",
      focus: "Entrepreneurship, Debate, Innovation",
      cost: "$4,200",
      scholarship: null,
      image: "/placeholder.svg",
      rating: 4.8,
      featured: true
    },
    {
      id: 3,
      name: "French Language & Culture Immersion",
      host: "Sorbonne University",
      country: "France",
      dates: "July 15–Aug 15, 2025",
      duration: "4 weeks",
      focus: "French Language, Art, History",
      cost: "€2,800",
      scholarship: null,
      image: "/placeholder.svg",
      rating: 4.7,
      featured: true
    },
    {
      id: 4,
      name: "Tokyo Tech Summer Camp",
      host: "Tokyo Institute of Technology",
      country: "Japan",
      dates: "Aug 1–Aug 28, 2025",
      duration: "4 weeks",
      focus: "Technology, Anime Culture, Japanese Society",
      cost: "¥220,000",
      scholarship: null,
      image: "/placeholder.svg",
      rating: 4.9,
      featured: true
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Summer Camps</h2>
          <p className="text-lg text-gray-600">Handpicked programs from world-renowned institutions</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuredCamps.map((camp) => (
            <Card key={camp.id} className="bg-white border-2 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="relative">
                <img 
                  src={camp.image} 
                  alt={camp.name}
                  className="w-full h-48 object-cover"
                />
                {camp.featured && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 px-2 py-1 rounded-full">
                  <div className="flex items-center text-sm font-medium">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    {camp.rating}
                  </div>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-xl">{camp.name}</CardTitle>
                <p className="text-gray-600 font-medium">{camp.host}</p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {camp.country}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {camp.dates}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {camp.duration}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {camp.cost}
                    </div>
                    {camp.scholarship && (
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        {camp.scholarship}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Focus Areas:</h4>
                  <p className="text-sm text-gray-600">{camp.focus}</p>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCamps;
