import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign } from 'lucide-react';

const ProgramFinder = () => {
  const [filters, setFilters] = useState({
    degreeType: 'all',
    field: 'all',
    country: 'all',
    funding: 'all'
  });
  const [showResults, setShowResults] = useState(false);

  const samplePrograms = [
    {
      id: 1,
      name: "PhD in Computer Science",
      university: "Technical University of Munich",
      country: "Germany",
      topic: "AI & Machine Learning",
      duration: "3-5 years",
      funding: "Fully-funded (DAAD)",
      amount: "€1,200/month"
    },
    {
      id: 2,
      name: "DPhil in Engineering Science",
      university: "University of Oxford",
      country: "UK",
      topic: "Robotics & Automation",
      duration: "3-4 years",
      funding: "Fully-funded (Rhodes)",
      amount: "£17,668/year"
    },
    {
      id: 3,
      name: "PhD in Biomedical Sciences",
      university: "University of Toronto",
      country: "Canada",
      topic: "Cancer Research",
      duration: "4-6 years",
      funding: "Fully-funded (Vanier)",
      amount: "CAD $50,000/year"
    }
  ];

  const handleSearch = () => {
    setShowResults(true);
  };

  return (
    <section id="finder" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Your Perfect PhD Program</h2>
          <p className="text-lg text-gray-600">Search through thousands of funded doctoral opportunities</p>
        </div>
        
        <Card className="bg-white shadow-xl rounded-2xl mb-12">
          <CardHeader>
            <CardTitle className="text-center text-xl">Program Search Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label htmlFor="degreeType">Degree Type</Label>
                <Select value={filters.degreeType} onValueChange={(value) => setFilters(prev => ({...prev, degreeType: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Degree Types</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="dphil">DPhil</SelectItem>
                    <SelectItem value="edd">EdD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="field">Field of Research</Label>
                <Select value={filters.field} onValueChange={(value) => setFilters(prev => ({...prev, field: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    <SelectItem value="ai">Artificial Intelligence</SelectItem>
                    <SelectItem value="sociology">Sociology</SelectItem>
                    <SelectItem value="biotech">Biotechnology</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="psychology">Psychology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={filters.country} onValueChange={(value) => setFilters(prev => ({...prev, country: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="germany">Germany</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                    <SelectItem value="australia">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="funding">Funding Type</Label>
                <Select value={filters.funding} onValueChange={(value) => setFilters(prev => ({...prev, funding: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select funding" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funding Types</SelectItem>
                    <SelectItem value="full">Fully-funded</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="self">Self-funded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={handleSearch}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
              >
                Search Programs
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {showResults && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Search Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {samplePrograms.map((program) => (
                <Card key={program.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{program.name}</h4>
                      <p className="text-purple-600 font-medium">{program.university}</p>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {program.country}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {program.duration}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        {program.amount}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <Badge className="bg-green-100 text-green-800">{program.funding}</Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{program.topic}</p>
                    
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      View Program
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProgramFinder;
