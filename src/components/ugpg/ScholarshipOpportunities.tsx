
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Calendar, Award, Filter } from 'lucide-react';

const ScholarshipOpportunities = () => {
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const scholarships = [
    {
      title: 'Fulbright Foreign Student Program',
      country: 'USA',
      type: 'Government',
      amount: 'Full tuition + stipend',
      deadline: 'October 2024',
      eligibility: 'Graduate students, strong academic record',
      coverage: 'Full',
      description: 'Prestigious scholarship for outstanding international students'
    },
    {
      title: 'Chevening Scholarships',
      country: 'UK',
      type: 'Government',
      amount: 'Full tuition + living expenses',
      deadline: 'November 2024',
      eligibility: 'Master\'s students with leadership potential',
      coverage: 'Full',
      description: 'UK government\'s global scholarship programme'
    },
    {
      title: 'Vanier Canada Graduate Scholarships',
      country: 'Canada',
      type: 'Government',
      amount: 'CAD 50,000/year for 3 years',
      deadline: 'November 2024',
      eligibility: 'PhD students, exceptional academic achievement',
      coverage: 'Partial',
      description: 'Highly competitive scholarship for doctoral studies'
    },
    {
      title: 'DAAD Scholarships',
      country: 'Germany',
      type: 'Government',
      amount: '€850-1,200/month',
      deadline: 'Various deadlines',
      eligibility: 'Graduate students, good German/English skills',
      coverage: 'Partial',
      description: 'German Academic Exchange Service scholarships'
    },
    {
      title: 'Australia Awards Scholarships',
      country: 'Australia',
      type: 'Government',
      amount: 'Full tuition + living allowance',
      deadline: 'April 2024',
      eligibility: 'Developing country students',
      coverage: 'Full',
      description: 'Australian government development scholarships'
    },
    {
      title: 'Stanford University Scholarships',
      country: 'USA',
      type: 'University',
      amount: 'Up to $50,000/year',
      deadline: 'December 2024',
      eligibility: 'Need-based, exceptional merit',
      coverage: 'Partial',
      description: 'Merit and need-based university scholarships'
    }
  ];

  const filteredScholarships = scholarships.filter(scholarship => {
    const countryMatch = filterCountry === 'all' || scholarship.country === filterCountry;
    const typeMatch = filterType === 'all' || scholarship.type === filterType;
    return countryMatch && typeMatch;
  });

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Scholarship Opportunities</h2>
          <p className="text-lg text-gray-600">Find funding options to make your education affordable</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-md mx-auto">
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="USA">United States</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
              <SelectItem value="Canada">Canada</SelectItem>
              <SelectItem value="Germany">Germany</SelectItem>
              <SelectItem value="Australia">Australia</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Government">Government</SelectItem>
              <SelectItem value="University">University</SelectItem>
              <SelectItem value="Private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScholarships.map((scholarship, index) => (
            <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0 rounded-xl">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={scholarship.coverage === 'Full' ? 'default' : 'secondary'} className="mb-2">
                    {scholarship.coverage} Coverage
                  </Badge>
                  <Badge variant="outline">{scholarship.country}</Badge>
                </div>
                <CardTitle className="text-lg">{scholarship.title}</CardTitle>
                <p className="text-sm text-gray-600">{scholarship.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Amount: {scholarship.amount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Deadline: {scholarship.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Type: {scholarship.type}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Eligibility</h4>
                  <p className="text-xs text-gray-600">{scholarship.eligibility}</p>
                </div>
                
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
            View All Scholarships
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ScholarshipOpportunities;
