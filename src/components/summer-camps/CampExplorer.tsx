
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, DollarSign } from 'lucide-react';

const CampExplorer = () => {
  const [filters, setFilters] = useState({
    ageGroup: 'all',
    country: 'all',
    duration: 'all',
    campType: 'all',
    fundingType: 'all'
  });

  const camps = [
    {
      id: 1,
      name: "MIT Summer Research Program",
      country: "USA",
      duration: "8 weeks",
      type: "STEM",
      ageGroup: "17-21",
      cost: "$5,200",
      fundingType: "Partial",
      description: "Hands-on research in AI and robotics"
    },
    {
      id: 2,
      name: "Cambridge Language Academy",
      country: "UK",
      duration: "4 weeks",
      type: "Language",
      ageGroup: "14-17",
      cost: "£2,800",
      fundingType: "Paid",
      description: "English immersion with cultural activities"
    },
    {
      id: 3,
      name: "Toronto Leadership Summit",
      country: "Canada",
      duration: "2 weeks",
      type: "Leadership",
      ageGroup: "17-21",
      cost: "CAD $3,200",
      fundingType: "Fully-funded",
      description: "Develop leadership skills with global peers"
    },
    {
      id: 4,
      name: "Paris Arts & Culture Camp",
      country: "France",
      duration: "4 weeks",
      type: "Arts",
      ageGroup: "14-17",
      cost: "€2,400",
      fundingType: "Partial",
      description: "Explore French art, music, and theatre"
    },
    {
      id: 5,
      name: "Tokyo Tech Innovation",
      country: "Japan",
      duration: "4 weeks",
      type: "STEM",
      ageGroup: "17-21",
      cost: "¥280,000",
      fundingType: "Paid",
      description: "Technology and Japanese culture immersion"
    },
    {
      id: 6,
      name: "Sydney Cultural Exchange",
      country: "Australia",
      duration: "2 weeks",
      type: "Culture",
      ageGroup: "14-17",
      cost: "AUD $2,800",
      fundingType: "Paid",
      description: "Experience Australian lifestyle and nature"
    }
  ];

  const filteredCamps = camps.filter(camp => {
    const matchesAge = filters.ageGroup === 'all' || camp.ageGroup === filters.ageGroup;
    const matchesCountry = filters.country === 'all' || camp.country.toLowerCase() === filters.country;
    const matchesDuration = filters.duration === 'all' || camp.duration === filters.duration;
    const matchesType = filters.campType === 'all' || camp.type === filters.campType;
    const matchesFunding = filters.fundingType === 'all' || camp.fundingType === filters.fundingType;
    
    return matchesAge && matchesCountry && matchesDuration && matchesType && matchesFunding;
  });

  return (
    <section id="camp-explorer" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Your Perfect Summer Camp</h2>
          <p className="text-lg text-gray-600">Use our filters to discover camps that match your interests</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
              <Select value={filters.ageGroup} onValueChange={(value) => setFilters({...filters, ageGroup: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="14-17">14-17 years</SelectItem>
                  <SelectItem value="17-21">17-21 years</SelectItem>
                  <SelectItem value="21+">21+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <Select value={filters.country} onValueChange={(value) => setFilters({...filters, country: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="usa">USA</SelectItem>
                  <SelectItem value="uk">UK</SelectItem>
                  <SelectItem value="canada">Canada</SelectItem>
                  <SelectItem value="france">France</SelectItem>
                  <SelectItem value="japan">Japan</SelectItem>
                  <SelectItem value="australia">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <Select value={filters.duration} onValueChange={(value) => setFilters({...filters, duration: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Durations</SelectItem>
                  <SelectItem value="2 weeks">2 weeks</SelectItem>
                  <SelectItem value="4 weeks">4 weeks</SelectItem>
                  <SelectItem value="8 weeks">8 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Camp Type</label>
              <Select value={filters.campType} onValueChange={(value) => setFilters({...filters, campType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="STEM">STEM</SelectItem>
                  <SelectItem value="Language">Language</SelectItem>
                  <SelectItem value="Leadership">Leadership</SelectItem>
                  <SelectItem value="Arts">Arts</SelectItem>
                  <SelectItem value="Culture">Culture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Funding</label>
              <Select value={filters.fundingType} onValueChange={(value) => setFilters({...filters, fundingType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select funding" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial">Partial Scholarship</SelectItem>
                  <SelectItem value="Fully-funded">Fully Funded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCamps.map((camp) => (
            <Card key={camp.id} className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{camp.name}</CardTitle>
                  <Badge className={
                    camp.fundingType === 'Fully-funded' ? 'bg-green-100 text-green-800' :
                    camp.fundingType === 'Partial' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {camp.fundingType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {camp.country}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {camp.duration} • Ages {camp.ageGroup}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {camp.cost}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{camp.description}</p>
                
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCamps.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No camps found matching your criteria. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CampExplorer;
