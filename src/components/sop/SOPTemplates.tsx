'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scroll, FileText, Target, Users, Award, BookOpen } from 'lucide-react';

interface SOPTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  wordCount: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: any;
  color: string;
  bgColor: string;
  textColor: string;
  features: string[];
  sampleContent: string;
}

export default function SOPTemplates() {
  const templates: SOPTemplate[] = [
    {
      id: 'academic-research',
      name: 'Academic Research Focus',
      description: 'Perfect for PhD and research-focused Master\'s programs',
      category: 'Graduate Studies',
      wordCount: '800-1200 words',
      difficulty: 'Advanced',
      icon: BookOpen,
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      features: [
        'Research experience emphasis',
        'Publication highlights',
        'Academic achievements',
        'Future research goals',
      ],
      sampleContent: 'This template emphasizes your research background, publications, and academic contributions...',
    },
    {
      id: 'career-transition',
      name: 'Career Transition',
      description: 'Ideal for professionals switching fields or advancing their careers',
      category: 'Professional Development',
      wordCount: '600-800 words',
      difficulty: 'Intermediate',
      icon: Target,
      color: 'from-purple-600 to-pink-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      features: [
        'Career progression story',
        'Transferable skills',
        'Industry experience',
        'Clear motivation',
      ],
      sampleContent: 'This template helps you articulate your career journey and why you\'re making a change...',
    },
    {
      id: 'fresh-graduate',
      name: 'Fresh Graduate',
      description: 'Designed for recent graduates with limited work experience',
      category: 'Entry Level',
      wordCount: '500-700 words',
      difficulty: 'Beginner',
      icon: Users,
      color: 'from-green-600 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      features: [
        'Academic achievements',
        'Extracurricular activities',
        'Internship experience',
        'Future aspirations',
      ],
      sampleContent: 'This template focuses on academic performance, projects, and potential rather than extensive experience...',
    },
    {
      id: 'international-student',
      name: 'International Student',
      description: 'Tailored for students applying to universities abroad',
      category: 'International',
      wordCount: '700-900 words',
      difficulty: 'Intermediate',
      icon: Award,
      color: 'from-orange-600 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      features: [
        'Cultural perspective',
        'Language proficiency',
        'International experience',
        'Adaptability skills',
      ],
      sampleContent: 'This template highlights your international background and cross-cultural competencies...',
    },
  ];

  const categories = ['All', 'Graduate Studies', 'Professional Development', 'Entry Level', 'International'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Scroll className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">SOP Templates</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose from our professionally crafted templates designed for different types of applications and experience levels.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center`}>
                    <template.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${template.bgColor} ${template.textColor} border-0`}
                >
                  {template.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Info */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{template.category}</span>
                <span>{template.wordCount}</span>
              </div>

              {/* Features */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Features:</h4>
                <div className="space-y-1">
                  {template.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Content Preview */}
              <div className={`${template.bgColor} rounded-lg p-3`}>
                <p className={`text-sm ${template.textColor} line-clamp-2`}>
                  {template.sampleContent}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button 
                  className={`flex-1 bg-gradient-to-r ${template.color} hover:opacity-90 text-white`}
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
                <Button variant="outline" size="sm">
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Template Option */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Need a Custom Template?
          </h3>
          <p className="text-gray-600 mb-4">
            Can't find the perfect template? Our AI can create a custom SOP structure based on your specific needs.
          </p>
          <Button variant="outline">
            Create Custom Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
