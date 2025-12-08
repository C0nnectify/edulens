
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Upload, CheckCircle } from 'lucide-react';
import type { ReviewType } from '@/pages/Reviews';

const WriteReviewSection = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: '',
    country: '',
    university: '',
    title: '',
    content: '',
    rating: 0
  });
  const [hoverRating, setHoverRating] = useState(0);

  const reviewTypes = [
    { value: 'university', label: 'University Review' },
    { value: 'city', label: 'City Life Review' },
    { value: 'housing', label: 'Housing Review' },
    { value: 'visa', label: 'Visa & Immigration' },
    { value: 'courses', label: 'Courses/Professors' },
    { value: 'mentorship', label: 'Mentorships & Services' },
    { value: 'sop', label: 'SOP/Essay Prep' }
  ];

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 
    'Germany', 'Netherlands', 'France', 'Singapore', 'New Zealand'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    setStep(4); // Show success message
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <button
        key={index}
        type="button"
        className="focus:outline-none"
        onMouseEnter={() => setHoverRating(index + 1)}
        onMouseLeave={() => setHoverRating(0)}
        onClick={() => setFormData({ ...formData, rating: index + 1 })}
      >
        <Star
          className={`w-8 h-8 transition-colors ${
            (hoverRating || formData.rating) > index
              ? 'text-yellow-500 fill-current'
              : 'text-gray-300 hover:text-yellow-400'
          }`}
        />
      </button>
    ));
  };

  if (step === 4) {
    return (
      <section id="write-review" className="bg-green-50 py-16 rounded-2xl mb-16">
        <div className="max-w-2xl mx-auto text-center px-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Review Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for sharing your experience. Your review will be published after moderation.
          </p>
          <Button onClick={() => { setStep(1); setFormData({ type: '', country: '', university: '', title: '', content: '', rating: 0 }); }}>
            Write Another Review
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section id="write-review" className="bg-blue-50 py-16 rounded-2xl mb-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Share Your Experience</h2>
          <p className="text-gray-600">
            Help future students by sharing your honest review about studying abroad.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Write a Review - Step {step} of 3</CardTitle>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Review Type</label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Choose what you want to review" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {reviewTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Country</label>
                    <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === 'university' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">University Name</label>
                      <Input
                        placeholder="Enter university name"
                        value={formData.university}
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Review Title</label>
                    <Input
                      placeholder="Give your review a catchy title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Your Review</label>
                    <Textarea
                      placeholder="Share your honest experience. What should other students know?"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="bg-white min-h-32"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <div className="flex items-center gap-2">
                      {renderStars()}
                      <span className="ml-2 text-sm text-gray-600">
                        {formData.rating > 0 ? `${formData.rating} star${formData.rating !== 1 ? 's' : ''}` : 'Click to rate'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Add Photos (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Drag and drop photos here, or click to browse</p>
                      <Button type="button" variant="outline">Choose Files</Button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Moderation Agreement</h4>
                    <p className="text-sm text-yellow-700">
                      By submitting this review, you agree that your content is honest and based on your personal experience. 
                      Reviews are subject to moderation to ensure quality and authenticity.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6">
                {step > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(step - 1)}
                  >
                    Previous
                  </Button>
                )}
                
                {step < 3 ? (
                  <Button 
                    type="button" 
                    onClick={() => setStep(step + 1)}
                    disabled={
                      (step === 1 && (!formData.type || !formData.country)) ||
                      (step === 2 && (!formData.title || !formData.content || formData.rating === 0))
                    }
                    className="ml-auto"
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    className="ml-auto bg-green-600 hover:bg-green-700"
                  >
                    Submit Review
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WriteReviewSection;
