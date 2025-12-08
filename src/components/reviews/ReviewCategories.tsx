
import React from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, MapPin, Home, FileText, BookOpen, Users, Edit } from 'lucide-react';
import type { ReviewType } from '@/pages/Reviews';

interface ReviewCategoriesProps {
  selectedCategory: ReviewType | 'all';
  onCategoryChange: (category: ReviewType | 'all') => void;
}

const categories = [
  { id: 'all' as const, label: 'All Reviews', icon: BookOpen, color: 'bg-gray-100 text-gray-700' },
  { id: 'university' as const, label: 'University Reviews', icon: GraduationCap, color: 'bg-blue-100 text-blue-700' },
  { id: 'city' as const, label: 'City Life Reviews', icon: MapPin, color: 'bg-green-100 text-green-700' },
  { id: 'housing' as const, label: 'Housing Reviews', icon: Home, color: 'bg-purple-100 text-purple-700' },
  { id: 'visa' as const, label: 'Visa & Immigration', icon: FileText, color: 'bg-red-100 text-red-700' },
  { id: 'courses' as const, label: 'Courses/Professors', icon: BookOpen, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'mentorship' as const, label: 'Mentorships & Services', icon: Users, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'sop' as const, label: 'SOP/Essay Prep', icon: Edit, color: 'bg-pink-100 text-pink-700' },
];

const ReviewCategories: React.FC<ReviewCategoriesProps> = ({ selectedCategory, onCategoryChange }) => {
  return (
    <section className="bg-white py-12 border-b">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Browse by Category</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                className={`flex items-center gap-2 px-4 py-2 transition-all ${
                  isSelected 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : `${category.color} hover:scale-105`
                }`}
                onClick={() => onCategoryChange(category.id)}
              >
                <IconComponent className="w-4 h-4" />
                {category.label}
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ReviewCategories;
