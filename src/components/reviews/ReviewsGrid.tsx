
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp, CheckCircle, Calendar } from 'lucide-react';
import type { Review, ReviewType } from '@/pages/Reviews';

interface ReviewsGridProps {
  selectedCategory: ReviewType | 'all';
  filters: {
    country: string;
    rating: string;
    sortBy: string;
  };
}

const mockReviews: Review[] = [
  {
    id: 1,
    type: 'university',
    title: 'Strict but high-quality education at TU Delft',
    rating: 4,
    content: 'Professors are great, but expect heavy research. The engineering programs are world-class and you\'ll learn a lot, but the workload is intense. Great for serious students.',
    author: 'Sarah M.',
    country: 'Netherlands',
    tags: ['Engineering', 'Research'],
    date: '2024-01-15',
    helpful: 23,
    verified: true
  },
  {
    id: 2,
    type: 'visa',
    title: 'Canada SDS is fast and smooth',
    rating: 5,
    content: 'Got visa in 6 weeks. No interview. Just solid documents. Make sure you have all financial documents ready and follow the checklist exactly.',
    author: 'Raj P.',
    country: 'Canada',
    tags: ['SDS', 'Student Visa'],
    date: '2024-01-10',
    helpful: 45,
    verified: true
  },
  {
    id: 3,
    type: 'housing',
    title: 'Affordable but noisy dorm in Paris',
    rating: 4,
    content: 'Good price, but weekends are loud. 3rd floor is best. The location is perfect for getting to classes and the city center. Just bring earplugs!',
    author: 'Emma L.',
    country: 'France',
    tags: ['Student Housing', 'Dorm'],
    date: '2024-01-08',
    helpful: 18,
    verified: false
  },
  {
    id: 4,
    type: 'city',
    title: 'Melbourne has amazing coffee culture',
    rating: 5,
    content: 'The city is so livable and student-friendly. Public transport is great, and there are so many cultural events. Perfect for international students.',
    author: 'James K.',
    country: 'Australia',
    tags: ['City Life', 'Culture'],
    date: '2024-01-05',
    helpful: 31,
    verified: true
  },
  {
    id: 5,
    type: 'courses',
    title: 'CS program at UBC is challenging but rewarding',
    rating: 4,
    content: 'Professor quality varies, but overall excellent curriculum. The co-op program is fantastic for getting real work experience.',
    author: 'Alex C.',
    country: 'Canada',
    tags: ['Computer Science', 'Co-op'],
    date: '2024-01-03',
    helpful: 27,
    verified: true
  },
  {
    id: 6,
    type: 'mentorship',
    title: 'EduLens mentor helped me get into my dream school',
    rating: 5,
    content: 'My mentor guided me through the entire application process. Without their help, I wouldn\'t have known about the scholarship opportunities.',
    author: 'Priya S.',
    country: 'United Kingdom',
    tags: ['Application Help', 'Mentoring'],
    date: '2024-01-01',
    helpful: 52,
    verified: true
  }
];

const ReviewsGrid: React.FC<ReviewsGridProps> = ({ selectedCategory, filters }) => {
  const filteredReviews = mockReviews.filter(review => {
    if (selectedCategory !== 'all' && review.type !== selectedCategory) return false;
    if (filters.country && filters.country !== 'All Countries' && review.country !== filters.country) return false;
    if (filters.rating && filters.rating !== 'all') {
      const minRating = parseInt(filters.rating);
      if (review.rating < minRating) return false;
    }
    return true;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getTypeBadgeColor = (type: ReviewType) => {
    const colors = {
      university: 'bg-blue-100 text-blue-800',
      city: 'bg-green-100 text-green-800',
      housing: 'bg-purple-100 text-purple-800',
      visa: 'bg-red-100 text-red-800',
      courses: 'bg-yellow-100 text-yellow-800',
      mentorship: 'bg-indigo-100 text-indigo-800',
      sop: 'bg-pink-100 text-pink-800'
    };
    return colors[type];
  };

  return (
    <div className="mb-16">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">
          {filteredReviews.length} Review{filteredReviews.length !== 1 ? 's' : ''} Found
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReviews.map((review) => (
          <Card key={review.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <Badge className={getTypeBadgeColor(review.type)}>
                  {review.type.charAt(0).toUpperCase() + review.type.slice(1)}
                </Badge>
                {review.verified && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              <h3 className="font-bold text-lg leading-tight">{review.title}</h3>
              <div className="flex items-center gap-2">
                <div className="flex">{renderStars(review.rating)}</div>
                <span className="text-sm text-gray-600">by {review.author}</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-700 mb-4 line-clamp-3">{review.content}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="text-xs">
                  {review.country}
                </Badge>
                {review.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(review.date).toLocaleDateString()}
                </div>
                <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  {review.helpful}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReviewsGrid;
