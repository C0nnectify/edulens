import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, MapPin, ExternalLink } from 'lucide-react';

const ScholarshipsSection = () => {
  const [countryFilter, setCountryFilter] = useState('all');
  const [fundingFilter, setFundingFilter] = useState('all');

  const scholarships = [
    {
      id: 1,
      name: "DAAD Doctoral Scholarship",
      country: "Germany",
      amount: "€1,200/month + travel",
      deadline: "Oct 15, 2025",
      eligibility: "Master's degree, research proposal",
      type: "Full Funding"
    },
    {
      id: 2,
      name: "Rhodes Scholarship",
      country: "United Kingdom",
      amount: "£17,668/year + fees",
      deadline: "Sep 30, 2025",
      eligibility: "Outstanding academic record, leadership",
      type: "Full Funding"
    },
    {
      id: 3,
      name: "Vanier Canada Graduate Scholarship",
      country: "Canada",
      amount: "CAD $50,000/year",
      deadline: "Nov 1, 2025",
      eligibility: "PhD candidate, research excellence",
      type: "Full Funding"
    },
    {
      id: 4,
      name: "Australia Awards Scholarship",
      country: "Australia",
      amount: "AUD $31,000/year + fees",
      deadline: "Apr 30, 2025",
      eligibility: "Developing country citizen",
      type: "Full Funding"
    },
    {
      id: 5,
      name: "Fulbright PhD Program",
      country: "United States",
      amount: "$25,000-45,000/year",
      deadline: "May 15, 2025",
      eligibility: "Non-US citizen, academic excellence",
      type: "Partial Funding"
    },
    {
      id: 6,
      name: "Swiss Government Excellence Scholarship",
      country: "Switzerland",
      amount: "CHF 1,920/month",
      deadline: "Dec 15, 2025",
      eligibility: "Research proposal, supervisor contact",
      type: "Full Funding"
    }
  ];

  const filteredScholarships = scholarships.filter(scholarship => {
    const matchesCountry = !countryFilter || countryFilter === 'all' || scholarship.country.toLowerCase().includes(countryFilter.toLowerCase());
    const matchesFunding = !fundingFilter || fundingFilter === 'all' || scholarship.type === fundingFilter;
    return matchesCountry && matchesFunding;
  });

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">PhD Scholarships & Funding</h2>
          <p className="text-lg text-gray-600">Discover fully-funded doctoral opportunities worldwide</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="germany">Germany</SelectItem>
                <SelectItem value="united kingdom">United Kingdom</SelectItem>
                <SelectItem value="canada">Canada</SelectItem>
                <SelectItem value="australia">Australia</SelectItem>
                <SelectItem value="united states">United States</SelectItem>
                <SelectItem value="switzerland">Switzerland</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={fundingFilter} onValueChange={setFundingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by funding type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funding Types</SelectItem>
                <SelectItem value="Full Funding">Full Funding</SelectItem>
                <SelectItem value="Partial Funding">Partial Funding</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScholarships.map((scholarship) => (
            <Card key={scholarship.id} className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{scholarship.name}</CardTitle>
                  <Badge 
                    className={scholarship.type === 'Full Funding' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {scholarship.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {scholarship.country}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {scholarship.amount}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Deadline: {scholarship.deadline}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Eligibility:</h4>
                  <p className="text-sm text-gray-600">{scholarship.eligibility}</p>
                </div>
                
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredScholarships.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No scholarships found matching your criteria.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ScholarshipsSection;
