
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, SortAsc } from 'lucide-react';

interface ReviewFiltersProps {
  filters: {
    country: string;
    rating: string;
    sortBy: string;
  };
  onFiltersChange: (filters: any) => void;
}

const countries = [
  'All Countries', 'United States', 'Canada', 'United Kingdom', 'Australia', 
  'Germany', 'Netherlands', 'France', 'Singapore', 'New Zealand'
];

const ReviewFilters: React.FC<ReviewFiltersProps> = ({ filters, onFiltersChange }) => {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div id="reviews-grid" className="bg-gray-50 p-6 rounded-xl mb-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Filters:</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Select value={filters.country} onValueChange={(value) => updateFilter('country', value)}>
            <SelectTrigger className="w-full sm:w-48 bg-white">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.rating} onValueChange={(value) => updateFilter('rating', value)}>
            <SelectTrigger className="w-full sm:w-40 bg-white">
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="3">3+ Stars</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger className="w-full sm:w-40 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ReviewFilters;
