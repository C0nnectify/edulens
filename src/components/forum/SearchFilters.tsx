
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import type { ForumCategory } from '@/pages/Forum';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'recent' | 'answered' | 'trending';
  onSortChange: (sort: 'recent' | 'answered' | 'trending') => void;
  selectedCategory: ForumCategory | 'all';
  onCategoryChange: (category: ForumCategory | 'all') => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedCategory,
  onCategoryChange
}) => {
  return (
    <div className="bg-white p-6 rounded-lg border space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <span className="font-medium text-gray-700">Search & Filter</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search questions, tags, or keywords..."
            className="pl-10"
          />
        </div>
        
        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="university">Universities</SelectItem>
            <SelectItem value="country">Countries</SelectItem>
            <SelectItem value="visa">Visa & Immigration</SelectItem>
            <SelectItem value="sop">SOP / Essays</SelectItem>
            <SelectItem value="test-prep">Test Prep</SelectItem>
            <SelectItem value="mentorship">Tools & Mentorship</SelectItem>
            <SelectItem value="housing">Housing & Costs</SelectItem>
            <SelectItem value="student-life">Student Life</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="answered">Most Answered</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SearchFilters;
