
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";

interface ProductFiltersProps {
  selectedCategory: string;
  priceRange: number[];
  sortBy: string;
  showFilters: boolean;
  onCategoryChange: (category: string) => void;
  onPriceChange: (range: number[]) => void;
  onSortChange: (sort: string) => void;
  onToggleFilters: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  selectedCategory,
  priceRange,
  sortBy,
  showFilters,
  onCategoryChange,
  onPriceChange,
  onSortChange,
  onToggleFilters
}) => {
  const countries = ["All Countries", "USA", "UK", "Canada", "Australia", "Germany", "Netherlands"];
  const productTypes = ["All Types", "Consulting", "Tools", "Coaching", "Editing"];
  const studyLevels = ["All Levels", "Undergraduate", "Postgraduate", "PhD"];

  return (
    <div className="mb-8">
      {/* Filter Toggle & Sort */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onToggleFilters}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          
          {selectedCategory && (
            <Badge variant="secondary" className="flex items-center gap-2">
              {selectedCategory}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onCategoryChange("")}
              />
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="bestseller">Bestsellers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl p-6 shadow-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Country Target */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country Target</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Study Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Study Level</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {studyLevels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range: ${priceRange[0]} - ${priceRange[1]}
              </label>
              <Slider
                value={priceRange}
                onValueChange={onPriceChange}
                max={500}
                min={0}
                step={10}
                className="mt-2"
              />
            </div>
          </div>
          
          {/* Quick Filters */}
          <div className="mt-6 pt-6 border-t">
            <span className="text-sm font-medium text-gray-700 mb-3 block">Quick Filters:</span>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-emerald-50">Verified Only</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-emerald-50">Under $50</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-emerald-50">Instant Delivery</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-emerald-50">Money Back Guarantee</Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
