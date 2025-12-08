
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle, 
  Pin, 
  Clock,
  Flag,
  MoreVertical,
  Reply
} from 'lucide-react';
import ThreadDetailModal from './ThreadDetailModal';
import type { ForumCategory, ForumThread } from '@/pages/Forum';

interface TrendingThreadsProps {
  selectedCategory: ForumCategory | 'all';
  searchQuery: string;
  sortBy: 'recent' | 'answered' | 'trending';
}

// Mock data for demonstration
const mockThreads: ForumThread[] = [
  {
    id: 1,
    title: "IELTS requirement for SDS 2025?",
    content: "I'm planning to apply through SDS for Canada in 2025. What are the current IELTS score requirements?",
    category: 'visa',
    tags: ['Canada', 'IELTS', 'SDS', 'Visa'],
    author: {
      name: "Sarah Chen",
      country: "India",
      degree: "Master's",
      badges: ['Verified', 'Top Contributor'],
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b977?w=40&h=40&fit=crop&crop=face"
    },
    replies: [
      {
        id: 1,
        content: "For SDS 2025, you need IELTS 6.0 overall with no band less than 6.0. This is still the current requirement.",
        author: {
          name: "Mike Johnson",
          country: "Canada",
          badges: ['Mentor', 'Expert'],
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
        },
        upvotes: 12,
        isAnswer: true,
        createdAt: "2024-01-15T10:30:00Z"
      }
    ],
    upvotes: 15,
    isAnswered: true,
    isPinned: false,
    createdAt: "2024-01-15T08:00:00Z",
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    title: "University of Toronto vs McGill - Which is better for CS?",
    content: "I got admitted to both UofT and McGill for Computer Science. Can someone help me decide?",
    category: 'university',
    tags: ['Canada', 'Computer Science', 'University Choice'],
    author: {
      name: "Alex Kumar",
      country: "Pakistan",
      degree: "Bachelor's",
      badges: ['Student'],
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
    },
    replies: [],
    upvotes: 8,
    isAnswered: false,
    isPinned: true,
    createdAt: "2024-01-14T15:20:00Z",
    lastUpdated: "2024-01-14T15:20:00Z"
  },
  {
    id: 3,
    title: "Housing costs in Melbourne vs Sydney?",
    content: "Planning to study in Australia. What are the realistic housing costs in these cities?",
    category: 'housing',
    tags: ['Australia', 'Housing', 'Cost of Living'],
    author: {
      name: "Emma Wilson",
      country: "UK",
      degree: "Master's",
      badges: ['Verified'],
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face"
    },
    replies: [
      {
        id: 1,
        content: "Sydney is definitely more expensive. Expect to pay 300-500 AUD per week for shared accommodation.",
        author: {
          name: "David Lee",
          country: "Australia",
          badges: ['Local Expert'],
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face"
        },
        upvotes: 5,
        isAnswer: false,
        createdAt: "2024-01-13T12:15:00Z"
      }
    ],
    upvotes: 6,
    isAnswered: false,
    isPinned: false,
    createdAt: "2024-01-13T09:45:00Z",
    lastUpdated: "2024-01-13T12:15:00Z"
  }
];

const TrendingThreads: React.FC<TrendingThreadsProps> = ({ selectedCategory, searchQuery, sortBy }) => {
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);

  // Filter threads based on category and search
  const filteredThreads = mockThreads.filter(thread => {
    const matchesCategory = selectedCategory === 'all' || thread.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sort threads
  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    switch (sortBy) {
      case 'answered':
        return (b.isAnswered ? 1 : 0) - (a.isAnswered ? 1 : 0);
      case 'trending':
        return b.upvotes - a.upvotes;
      default: // recent
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    }
  });

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Verified': return 'bg-green-100 text-green-800';
      case 'Mentor': return 'bg-blue-100 text-blue-800';
      case 'Expert': return 'bg-purple-100 text-purple-800';
      case 'Top Contributor': return 'bg-orange-100 text-orange-800';
      case 'Local Expert': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {selectedCategory === 'all' ? 'All Discussions' : 'Filtered Discussions'}
        </h2>
        
        {sortedThreads.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No discussions found. Be the first to start one!</p>
          </Card>
        ) : (
          sortedThreads.map((thread) => (
            <Card key={thread.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={thread.author.avatar} alt={thread.author.name} />
                    <AvatarFallback>{thread.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {thread.isPinned && <Pin className="w-4 h-4 text-blue-600" />}
                      <h3 
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                        onClick={() => setSelectedThread(thread)}
                      >
                        {thread.title}
                      </h3>
                      {thread.isAnswered && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{thread.content}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {thread.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-700">{thread.author.name}</span>
                          <span>from {thread.author.country}</span>
                          {thread.author.badges.map((badge, index) => (
                            <Badge key={index} className={`text-xs ${getBadgeColor(badge)}`}>
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{thread.replies.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{thread.upvotes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{getTimeAgo(thread.lastUpdated)}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Reply className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {selectedThread && (
        <ThreadDetailModal
          thread={selectedThread}
          onClose={() => setSelectedThread(null)}
        />
      )}
    </>
  );
};

export default TrendingThreads;
