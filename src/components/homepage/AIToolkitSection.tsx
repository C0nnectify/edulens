
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Zap, FileText, Search, DollarSign, BarChart, Calendar, GraduationCap, MessageSquare, Scale, CreditCard, PenTool, BookOpen, Briefcase } from 'lucide-react';

const AIToolkitSection = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Show All');

  const stats = [
    { value: '13', label: 'AI Tools', color: 'text-blue-600' },
    { value: '99%', label: 'Accuracy', color: 'text-green-600' },
    { value: '24/7', label: 'Availability', color: 'text-purple-600' },
    { value: '10x', label: 'Faster', color: 'text-orange-600' },
    { value: 'Free', label: 'Trial', color: 'text-emerald-600' }
  ];

  const filters = [
    'Show All', 'Documents', 'Research', 'Funding', 'Assessment', 
    'Planning', 'Academics', 'Guidance', 'Legal', 'Finance', 
    'Writing', 'Preparation', 'Integration', 'Career'
  ];

  const tools = [
    {
      icon: FileText,
      name: 'SOP Generator',
      description: 'AI-powered Statement of Purpose creation',
      category: 'Documents',
      tags: ['Writing', 'Documents'],
      color: 'bg-blue-500'
    },
    {
      icon: Search,
      name: 'University Matcher',
      description: 'Find perfect university matches using AI',
      category: 'Research',
      tags: ['Research', 'Academics'],
      color: 'bg-green-500'
    },
    {
      icon: DollarSign,
      name: 'Scholarship Finder',
      description: 'Discover funding opportunities worldwide',
      category: 'Funding',
      tags: ['Funding', 'Finance'],
      color: 'bg-yellow-500'
    },
    {
      icon: BarChart,
      name: 'Profile Evaluator',
      description: 'Assess your admission chances',
      category: 'Assessment',
      tags: ['Assessment', 'Guidance'],
      color: 'bg-purple-500'
    },
    {
      icon: Calendar,
      name: 'Timeline Planner',
      description: 'Plan your study abroad journey',
      category: 'Planning',
      tags: ['Planning', 'Preparation'],
      color: 'bg-pink-500'
    },
    {
      icon: GraduationCap,
      name: 'Course Recommender',
      description: 'Find ideal programs for your goals',
      category: 'Academics',
      tags: ['Academics', 'Research'],
      color: 'bg-indigo-500'
    },
    {
      icon: MessageSquare,
      name: 'Interview Prep',
      description: 'Practice with AI interview simulator',
      category: 'Preparation',
      tags: ['Preparation', 'Guidance'],
      color: 'bg-teal-500'
    },
    {
      icon: Scale,
      name: 'Visa Assistant',
      description: 'Navigate visa applications easily',
      category: 'Legal',
      tags: ['Legal', 'Guidance'],
      color: 'bg-red-500'
    },
    {
      icon: CreditCard,
      name: 'Budget Calculator',
      description: 'Estimate study abroad costs',
      category: 'Finance',
      tags: ['Finance', 'Planning'],
      color: 'bg-orange-500'
    },
    {
      icon: PenTool,
      name: 'Essay Writer',
      description: 'Craft compelling admission essays',
      category: 'Writing',
      tags: ['Writing', 'Documents'],
      color: 'bg-cyan-500'
    },
    {
      icon: BookOpen,
      name: 'Test Prep Guide',
      description: 'Prepare for standardized tests',
      category: 'Preparation',
      tags: ['Preparation', 'Academics'],
      color: 'bg-emerald-500'
    },
    {
      icon: Briefcase,
      name: 'Career Planner',
      description: 'Plan your post-graduation career',
      category: 'Career',
      tags: ['Career', 'Planning'],
      color: 'bg-gray-600'
    }
  ];

  const filteredTools = activeFilter === 'Show All' 
    ? tools 
    : tools.filter(tool => tool.tags.includes(activeFilter) || tool.category === activeFilter);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            ⚙️ Why Choose Our Complete AI Toolkit?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Everything you need for your study abroad — automated, guided, verified.
          </p>

          {/* Stats Grid */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="bg-gray-50 rounded-xl px-6 py-4 text-center min-w-[120px]">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {filters.map((filter) => (
            <Badge
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 transition-all ${
                activeFilter === filter
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </Badge>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredTools.map((tool, index) => {
            const IconComponent = tool.icon;
            return (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {tool.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            size="lg"
            onClick={() => navigate('/ai-agents')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Zap className="w-5 h-5 mr-2" />
            Explore All AI Tools
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AIToolkitSection;
