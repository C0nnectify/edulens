
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  MapPin, 
  FileText, 
  Edit, 
  BookOpen, 
  Users, 
  Home, 
  Heart 
} from 'lucide-react';
import type { ForumCategory } from '@/pages/Forum';

interface ForumCategoriesProps {
  selectedCategory: ForumCategory | 'all';
  onCategoryChange: (category: ForumCategory | 'all') => void;
}

const categories = [
  { id: 'all' as const, label: 'All Topics', icon: BookOpen, color: 'bg-gray-100 text-gray-700' },
  { id: 'university' as const, label: 'Universities', icon: GraduationCap, color: 'bg-blue-100 text-blue-700' },
  { id: 'country' as const, label: 'Countries', icon: MapPin, color: 'bg-green-100 text-green-700' },
  { id: 'visa' as const, label: 'Visa & Immigration', icon: FileText, color: 'bg-red-100 text-red-700' },
  { id: 'sop' as const, label: 'SOP / Essays', icon: Edit, color: 'bg-purple-100 text-purple-700' },
  { id: 'test-prep' as const, label: 'Test Prep', icon: BookOpen, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'mentorship' as const, label: 'Tools & Mentorship', icon: Users, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'housing' as const, label: 'Housing & Costs', icon: Home, color: 'bg-orange-100 text-orange-700' },
  { id: 'student-life' as const, label: 'Student Life', icon: Heart, color: 'bg-pink-100 text-pink-700' },
];

const ForumCategories: React.FC<ForumCategoriesProps> = ({ selectedCategory, onCategoryChange }) => {
  return (
    <section className="bg-white py-8 border-b sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`flex items-center gap-2 transition-all ${
                  isSelected 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : `${category.color} hover:scale-105 border-gray-200`
                }`}
                onClick={() => onCategoryChange(category.id)}
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ForumCategories;
