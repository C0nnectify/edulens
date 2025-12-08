
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

const ProgramFinder = () => {
  const [degreeType, setDegreeType] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [country, setCountry] = useState('');

  const handleSearch = () => {
    console.log('Searching for:', { degreeType, fieldOfStudy, country });
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Your Perfect Program</h2>
          <p className="text-lg text-gray-600">Start your search with our intelligent program finder</p>
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Degree Type</label>
              <Select value={degreeType} onValueChange={setDegreeType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select degree type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
                  <SelectItem value="master">Master's Degree</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
              <Select value={fieldOfStudy} onValueChange={setFieldOfStudy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="computer-science">Computer Science</SelectItem>
                  <SelectItem value="business">Business & Management</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="psychology">Psychology</SelectItem>
                  <SelectItem value="arts">Arts & Humanities</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Country</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usa">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="canada">Canada</SelectItem>
                  <SelectItem value="germany">Germany</SelectItem>
                  <SelectItem value="australia">Australia</SelectItem>
                  <SelectItem value="netherlands">Netherlands</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={handleSearch}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-3"
            >
              <Search className="mr-2 h-5 w-5" />
              Find Programs
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProgramFinder;
