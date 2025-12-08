
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Download, Search, Filter, Star } from 'lucide-react';
import { useState } from 'react';

const ResourcesLibrary = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Resources' },
    { id: 'sop', name: 'SOP Library' },
    { id: 'resume', name: 'Resume Library' },
    { id: 'cv', name: 'CV Library' },
    { id: 'essay', name: 'Essay Library' },
    { id: 'tools', name: 'Tools' }
  ];

  const resources = [
    {
      id: 1,
      title: "Computer Science SOP Template",
      category: "sop",
      type: "Template",
      downloads: 1234,
      rating: 4.8,
      description: "Proven SOP template for CS programs with examples",
      author: "Dr. Sarah Johnson",
      university: "Stanford University"
    },
    {
      id: 2,
      title: "Engineering Resume Template",
      category: "resume",
      type: "Template",
      downloads: 892,
      rating: 4.9,
      description: "Professional engineering resume template with industry standards",
      author: "Prof. Mike Chen",
      university: "MIT"
    },
    {
      id: 3,
      title: "PhD CV Builder",
      category: "cv",
      type: "Tool",
      downloads: 567,
      rating: 4.7,
      description: "AI-powered CV builder specifically for PhD applications",
      author: "EduLens AI",
      university: "Built-in Tool"
    },
    {
      id: 4,
      title: "Scholarship Essay Examples",
      category: "essay",
      type: "Examples",
      downloads: 1567,
      rating: 4.9,
      description: "Collection of winning scholarship essays with analysis",
      author: "Multiple Authors",
      university: "Various"
    }
  ];

  const tools = [
    { name: "CV & Resume Builder", description: "AI-powered document creation", status: "Available" },
    { name: "Form Builder", description: "Custom application forms", status: "Available" },
    { name: "Event Management", description: "Event creation and automation", status: "Available" },
    { name: "Payment Collection", description: "Secure payment processing", status: "Available" }
  ];

  const features = [
    { name: "Mentorship Program", description: "1-week intensive mentorship", duration: "7 days" },
    { name: "Study Abroad Guidance", description: "Complete program assistance", programs: ["Undergraduate", "Postgraduate", "PhD", "Summer Camp"] },
    { name: "Eligibility Check", description: "Automated qualification verification", steps: ["Information", "Submission", "Payment", "Visa Process", "Completion"] },
    { name: "Job & Internship Finder", description: "Part-time opportunities and internships", type: "Listing & Finder" }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Resources Library & Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive collection of templates, tools, and resources to support your study abroad journey
          </p>
        </div>

        {/* Search and Categories */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources, templates, and tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? 
                  "bg-gradient-to-r from-green-600 to-blue-600" : 
                  "hover:bg-gray-50"
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {resource.type}
                </span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-sm text-gray-600">{resource.rating}</span>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 text-lg mb-2">
                {resource.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4">
                {resource.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Author:</span>
                  <span className="font-medium">{resource.author}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Downloads:</span>
                  <span className="font-medium text-green-600">{resource.downloads.toLocaleString()}</span>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          ))}
        </div>

        {/* Tools Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Available Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-xl">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">{tool.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {tool.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">Platform Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/10 rounded-xl p-6">
                <h4 className="font-bold text-lg mb-3">{feature.name}</h4>
                <p className="mb-4 opacity-90">{feature.description}</p>
                
                {feature.duration && (
                  <div className="text-sm opacity-75">Duration: {feature.duration}</div>
                )}
                
                {feature.programs && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {feature.programs.map((program, programIndex) => (
                      <span key={programIndex} className="px-2 py-1 bg-white/20 rounded text-xs">
                        {program}
                      </span>
                    ))}
                  </div>
                )}
                
                {feature.steps && (
                  <div className="text-sm opacity-75 mt-2">
                    Process: {feature.steps.join(' → ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResourcesLibrary;
