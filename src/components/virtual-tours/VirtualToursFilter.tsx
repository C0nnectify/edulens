
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';

const VirtualToursFilter = () => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedDegreeLevel, setSelectedDegreeLevel] = useState('');
  const [selectedTourType, setSelectedTourType] = useState('');

  const countries = ['All Countries', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'Netherlands'];
  const universities = ['All Universities', 'MIT', 'Harvard', 'Oxford', 'Cambridge', 'UBC', 'Melbourne'];
  const degreeLevels = ['All Levels', 'Undergraduate', 'Postgraduate', 'PhD'];
  const tourTypes = ['All Types', 'Campus', 'Dorm', 'City', 'Lab', 'Library'];

  const handleSearch = () => {
    const element = document.getElementById('featured-tours');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="explore" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect Virtual Tour
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Filter by country, university, or tour type to discover the experience that matters to you
          </p>
        </div>

        <Card className="max-w-5xl mx-auto shadow-lg">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                >
                  {universities.map(university => (
                    <option key={university} value={university}>{university}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Degree Level</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedDegreeLevel}
                  onChange={(e) => setSelectedDegreeLevel(e.target.value)}
                >
                  {degreeLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tour Type</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedTourType}
                  onChange={(e) => setSelectedTourType(e.target.value)}
                >
                  {tourTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                onClick={handleSearch}
              >
                <Search className="mr-2 h-5 w-5" />
                Find Virtual Tours
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default VirtualToursFilter;
