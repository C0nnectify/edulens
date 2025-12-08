
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users, ExternalLink } from 'lucide-react';

const CampScholarships = () => {
  const scholarships = [
    {
      id: 1,
      title: "Oxford STEM Full Scholarship",
      camp: "Oxford STEM Summer School",
      covers: "Tuition, housing, meals",
      deadline: "April 15, 2025",
      eligibility: "STEM interest, 80%+ in science, age 16–18",
      type: "Full Funding",
      color: "bg-green-100 text-green-800"
    },
    {
      id: 2,
      title: "Harvard Global Youth Partial Grant",
      camp: "Harvard Leadership Camp",
      covers: "50% tuition only",
      deadline: "March 20, 2025",
      eligibility: "Essay + transcript, ages 17–21",
      type: "Partial Funding",
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: 3,
      title: "Tokyo Summer Culture Grant",
      camp: "Tokyo Tech Summer Camp",
      covers: "Tuition + flight",
      deadline: "May 5, 2025",
      eligibility: "Japanese language not required, age 18–22",
      type: "Full Funding",
      color: "bg-green-100 text-green-800"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Scholarships for Summer Camps</h2>
          <p className="text-lg text-gray-600">Financial support to make your dream camp accessible</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {scholarships.map((scholarship) => (
            <Card key={scholarship.id} className="bg-white hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{scholarship.title}</CardTitle>
                  <Badge className={scholarship.color}>
                    {scholarship.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 font-medium">For: {scholarship.camp}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <DollarSign className="h-4 w-4 mr-2 mt-1 text-green-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Covers:</span>
                      <p className="text-sm text-gray-600">{scholarship.covers}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 mr-2 mt-1 text-red-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Deadline:</span>
                      <p className="text-sm text-gray-600">{scholarship.deadline}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Users className="h-4 w-4 mr-2 mt-1 text-blue-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Eligibility:</span>
                      <p className="text-sm text-gray-600">{scholarship.eligibility}</p>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Scholarship Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Apply Early</h4>
                <p className="text-sm text-gray-600">Scholarship funds are limited. Apply as soon as applications open.</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Strong Essays</h4>
                <p className="text-sm text-gray-600">Write compelling motivation letters that show your passion.</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Multiple Applications</h4>
                <p className="text-sm text-gray-600">Apply to several camps to increase your chances of getting funding.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CampScholarships;
