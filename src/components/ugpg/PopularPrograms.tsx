
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

const PopularPrograms = () => {
  const programs = [
    {
      title: 'Computer Science',
      icon: '💻',
      description: 'Build the future with cutting-edge technology and programming skills',
      universities: ['MIT', 'Stanford', 'CMU', 'UC Berkeley'],
      requirements: 'Strong math background, Programming experience preferred',
      tuitionRange: '$30,000 - $60,000/year',
      careerOutcomes: ['Software Engineer', 'Data Scientist', 'Product Manager'],
      growthRate: '+22%',
      averageSalary: '$95,000'
    },
    {
      title: 'Business & Management',
      icon: '📊',
      description: 'Lead organizations and drive strategic business decisions',
      universities: ['Harvard', 'Wharton', 'INSEAD', 'London Business School'],
      requirements: 'Leadership experience, GMAT/GRE scores',
      tuitionRange: '$40,000 - $80,000/year',
      careerOutcomes: ['Management Consultant', 'Investment Banker', 'Entrepreneur'],
      growthRate: '+8%',
      averageSalary: '$85,000'
    },
    {
      title: 'Engineering',
      icon: '⚙️',
      description: 'Solve complex problems and design innovative solutions',
      universities: ['Caltech', 'ETH Zurich', 'Imperial College', 'TU Delft'],
      requirements: 'Strong STEM background, Research experience',
      tuitionRange: '$25,000 - $55,000/year',
      careerOutcomes: ['Design Engineer', 'Project Manager', 'Research Scientist'],
      growthRate: '+6%',
      averageSalary: '$80,000'
    },
    {
      title: 'Psychology',
      icon: '🧠',
      description: 'Understand human behavior and mental processes',
      universities: ['Yale', 'Oxford', 'UCLA', 'University of Toronto'],
      requirements: 'Research experience, Statistics knowledge',
      tuitionRange: '$20,000 - $45,000/year',
      careerOutcomes: ['Clinical Psychologist', 'Researcher', 'Therapist'],
      growthRate: '+14%',
      averageSalary: '$65,000'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Most Popular Programs</h2>
          <p className="text-lg text-gray-600">Explore in-demand fields with excellent career prospects</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {programs.map((program, index) => (
            <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <span className="text-2xl">{program.icon}</span>
                  {program.title}
                </CardTitle>
                <p className="text-gray-600">{program.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Top Universities</h4>
                  <div className="flex flex-wrap gap-2">
                    {program.universities.map((uni, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{uni}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Entry Requirements</h4>
                  <p className="text-sm text-gray-600">{program.requirements}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Tuition Range</h4>
                  <p className="text-sm text-gray-600">{program.tuitionRange}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Career Outcomes</h4>
                  <div className="flex flex-wrap gap-1">
                    {program.careerOutcomes.map((career, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{career}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">{program.growthRate}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm font-medium">{program.averageSalary}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-600 hover:bg-emerald-50">
                    Explore Programs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularPrograms;
