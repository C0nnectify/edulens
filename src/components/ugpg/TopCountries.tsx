
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TopCountries = () => {
  const countries = [
    {
      id: 'usa',
      name: 'United States',
      flag: '🇺🇸',
      duration: '4 years (Bachelor\'s), 2 years (Master\'s)',
      tuition: '$25,000 - $55,000/year',
      language: 'English',
      scholarships: 'Merit-based, Need-based',
      popularPrograms: ['Computer Science', 'Business', 'Engineering'],
      highlights: ['World-class universities', 'Research opportunities', 'Diverse culture']
    },
    {
      id: 'uk',
      name: 'United Kingdom',
      flag: '🇬🇧',
      duration: '3 years (Bachelor\'s), 1 year (Master\'s)',
      tuition: '£15,000 - £35,000/year',
      language: 'English',
      scholarships: 'Chevening, Commonwealth',
      popularPrograms: ['Finance', 'Law', 'Medicine'],
      highlights: ['Shorter duration', 'Historic universities', 'Gateway to Europe']
    },
    {
      id: 'canada',
      name: 'Canada',
      flag: '🇨🇦',
      duration: '4 years (Bachelor\'s), 2 years (Master\'s)',
      tuition: 'CAD 20,000 - 40,000/year',
      language: 'English/French',
      scholarships: 'Vanier, Trudeau Foundation',
      popularPrograms: ['Technology', 'Natural Resources', 'Healthcare'],
      highlights: ['Immigration-friendly', 'High quality of life', 'Research funding']
    },
    {
      id: 'germany',
      name: 'Germany',
      flag: '🇩🇪',
      duration: '3 years (Bachelor\'s), 2 years (Master\'s)',
      tuition: '€0 - €3,000/year (Public)',
      language: 'German/English',
      scholarships: 'DAAD, Erasmus+',
      popularPrograms: ['Engineering', 'Automotive', 'Technology'],
      highlights: ['Low tuition fees', 'Strong economy', 'Industry connections']
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Top Study Destinations</h2>
          <p className="text-lg text-gray-600">Explore the best countries for your higher education</p>
        </div>
        
        <Tabs defaultValue="usa" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            {countries.map((country) => (
              <TabsTrigger key={country.id} value={country.id} className="text-sm">
                {country.flag} {country.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {countries.map((country) => (
            <TabsContent key={country.id} value={country.id}>
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <span className="text-3xl">{country.flag}</span>
                    {country.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Duration</h4>
                      <p className="text-gray-600">{country.duration}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Average Tuition</h4>
                      <p className="text-gray-600">{country.tuition}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Language</h4>
                      <p className="text-gray-600">{country.language}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Scholarships</h4>
                      <p className="text-gray-600">{country.scholarships}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Popular Programs</h4>
                      <div className="flex flex-wrap gap-1">
                        {country.popularPrograms.map((program) => (
                          <Badge key={program} variant="secondary">{program}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Key Highlights</h4>
                      <ul className="text-gray-600 text-sm space-y-1">
                        {country.highlights.map((highlight, idx) => (
                          <li key={idx}>• {highlight}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default TopCountries;
