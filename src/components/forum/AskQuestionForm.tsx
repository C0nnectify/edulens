
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Eye, EyeOff } from 'lucide-react';
import type { ForumCategory } from '@/pages/Forum';

interface AskQuestionFormProps {
  onClose: () => void;
}

const categories: { value: ForumCategory; label: string }[] = [
  { value: 'university', label: 'Universities' },
  { value: 'country', label: 'Countries' },
  { value: 'visa', label: 'Visa & Immigration' },
  { value: 'sop', label: 'SOP / Essays' },
  { value: 'test-prep', label: 'Test Prep' },
  { value: 'mentorship', label: 'Tools & Mentorship' },
  { value: 'housing', label: 'Housing & Costs' },
  { value: 'student-life', label: 'Student Life' },
];

const popularTags = [
  'Canada', 'USA', 'UK', 'Australia', 'Germany',
  'IELTS', 'TOEFL', 'GRE', 'GMAT',
  'SOP', 'LOR', 'Resume',
  'Student Visa', 'Study Permit',
  'Scholarships', 'Funding'
];

const titleSuggestions = [
  "How to improve my IELTS score?",
  "Best universities for Computer Science in Canada?",
  "SOP tips for Master's applications?",
  "Student housing options in Toronto?",
  "Visa interview preparation tips?"
];

const AskQuestionForm: React.FC<AskQuestionFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '' as ForumCategory | '',
    content: '',
    tags: [] as string[],
    isAnonymous: false
  });
  const [newTag, setNewTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Submitting question:', formData);
    onClose();
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({ ...prev, title: value }));
    setShowSuggestions(value.length > 2);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">Ask a Question</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Question Title *</Label>
            <div className="relative">
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="What's your question? Be specific and clear."
                className="w-full"
                required
              />
              
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md mt-1 shadow-lg z-10">
                  <div className="p-2 text-sm text-gray-600 font-medium border-b">Suggested titles:</div>
                  {titleSuggestions
                    .filter(suggestion => 
                      suggestion.toLowerCase().includes(formData.title.toLowerCase())
                    )
                    .slice(0, 3)
                    .map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left p-2 hover:bg-gray-50 text-sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, title: suggestion }));
                          setShowSuggestions(false);
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value: ForumCategory) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (up to 5)</Label>
            
            {/* Selected Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Add New Tag */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(newTag);
                  }
                }}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => addTag(newTag)}
                disabled={formData.tags.length >= 5}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Popular Tags */}
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Popular tags:</div>
              <div className="flex flex-wrap gap-2">
                {popularTags
                  .filter(tag => !formData.tags.includes(tag))
                  .slice(0, 8)
                  .map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                      disabled={formData.tags.length >= 5}
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Question Details *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Provide more details about your question. Include relevant background information, what you've already tried, and what kind of answers you're looking for."
              className="min-h-32"
              required
            />
            <div className="text-xs text-gray-500">
              You can include links and will be able to attach images after posting.
            </div>
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="anonymous" className="flex items-center gap-2 cursor-pointer">
              {formData.isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Post anonymously
            </Label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              Post Question
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AskQuestionForm;
