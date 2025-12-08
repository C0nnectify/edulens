
'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

const AISearchBox = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const suggestions = [
    { icon: '🏫', text: 'Harvard University', type: 'University', category: 'Universities' },
    { icon: '💰', text: 'Merit Scholarships', type: 'Scholarship', category: 'Scholarships' },
    { icon: '💻', text: 'Data Science Programs', type: 'Program', category: 'Programs' },
    { icon: '👨‍🏫', text: 'Computer Science Mentors', type: 'Mentor', category: 'Mentors' },
    { icon: '🇺🇸', text: 'Study in USA', type: 'Country', category: 'Programs' },
    { icon: '🎓', text: 'PhD in Engineering', type: 'Program', category: 'Programs' },
    { icon: '🏕️', text: 'MIT Summer Camp', type: 'Program', category: 'Programs' },
    { icon: '📊', text: 'MBA Programs', type: 'Program', category: 'Programs' },
  ];

  const filters = ['All', 'Universities', 'Scholarships', 'Programs', 'Mentors'];

  const filteredSuggestions = activeFilter === 'All' 
    ? suggestions 
    : suggestions.filter(s => s.category === activeFilter);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Implement search logic here
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* Main Search Box */}
      <div className="relative">
        <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-white/20 overflow-hidden">
          <div className="flex-1 flex items-center">
            <Search className="ml-6 w-6 h-6 text-gray-400 flex-shrink-0" />
            <Input
              type="text"
              placeholder="Search universities, scholarships, programs, mentors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyPress={handleKeyPress}
              className="border-0 bg-transparent text-lg px-4 py-6 focus:ring-0 focus:outline-none placeholder:text-gray-500"
            />
          </div>
          
          {/* Filter Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`mx-2 flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
              showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          
          {/* Search Button */}
          <Button
            onClick={handleSearch}
            className="mr-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Search
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-700">Filter by category</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full transition-all ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Auto-suggestions Dropdown */}
      {showSuggestions && searchQuery.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 z-50 max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-600">Suggestions</h4>
          </div>
          {filteredSuggestions
            .filter(suggestion => 
              suggestion.text.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 6)
            .map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
                onClick={() => {
                  setSearchQuery(suggestion.text);
                  setShowSuggestions(false);
                }}
              >
                <span className="text-2xl mr-3">{suggestion.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{suggestion.text}</div>
                  <div className="text-sm text-gray-500">{suggestion.type}</div>
                </div>
                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {suggestion.category}
                </div>
              </div>
            ))}
          
          {filteredSuggestions.filter(s => 
            s.text.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
            <div className="px-4 py-6 text-center text-gray-500">
              No suggestions found for &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AISearchBox;
