
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { useState } from 'react';

const SearchEngine = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'universities', name: 'Universities' },
    { id: 'scholarships', name: 'Scholarships' },
    { id: 'programs', name: 'Programs' },
    { id: 'mentors', name: 'Mentors' },
    { id: 'events', name: 'Events' },
    { id: 'resources', name: 'Resources' }
  ];

  const filters = {
    location: ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'Netherlands'],
    budget: ['Under $20K', '$20K-$40K', '$40K-$60K', '$60K+'],
    program: ['Undergraduate', 'Masters', 'PhD', 'Summer Camp'],
    duration: ['1 Year', '2 Years', '3-4 Years', 'Short Term']
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Powered by Study Abroad Database
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Search through our comprehensive database of universities, scholarships, programs, mentors, and resources
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search universities, scholarships, programs, mentors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? 
                  "bg-gradient-to-r from-blue-600 to-purple-600" : 
                  "hover:bg-gray-50"
                }
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Filter Toggle */}
          <div className="text-center mb-8">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center"
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(filters).map(([filterType, options]) => (
                  <div key={filterType}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {filterType}
                    </label>
                    <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Select {filterType}</option>
                      {options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results Preview */}
          {searchQuery && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Search Results for &quot;{searchQuery}&quot;
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Harvard University - Computer Science</div>
                    <div className="text-sm text-gray-600">Masters Program • USA • $65,000/year</div>
                  </div>
                  <Button size="sm">View Details</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Fulbright Scholarship</div>
                    <div className="text-sm text-gray-600">Full Funding • International Students • Multiple Countries</div>
                  </div>
                  <Button size="sm">Apply Now</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Dr. Sarah Johnson - CS Mentor</div>
                    <div className="text-sm text-gray-600">Stanford Alumni • 5+ years experience • Available for consultation</div>
                  </div>
                  <Button size="sm">Connect</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SearchEngine;
