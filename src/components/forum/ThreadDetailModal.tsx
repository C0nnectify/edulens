
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ThumbsUp, 
  MessageSquare, 
  CheckCircle, 
  Flag, 
  MoreVertical,
  Pin,
  Reply,
  Quote
} from 'lucide-react';
import type { ForumThread } from '@/pages/Forum';

interface ThreadDetailModalProps {
  thread: ForumThread;
  onClose: () => void;
}

const ThreadDetailModal: React.FC<ThreadDetailModalProps> = ({ thread, onClose }) => {
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const handleReply = () => {
    if (replyContent.trim()) {
      // Handle reply submission
      console.log('Submitting reply:', replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {thread.isPinned && <Pin className="w-5 h-5 text-blue-600" />}
            {thread.title}
            {thread.isAnswered && <CheckCircle className="w-5 h-5 text-green-600" />}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Original Question */}
          <div className="border-b pb-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={thread.author.avatar} alt={thread.author.name} />
                <AvatarFallback>{thread.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{thread.author.name}</span>
                  <span className="text-sm text-gray-500">from {thread.author.country}</span>
                  {thread.author.badges.map((badge, index) => (
                    <Badge key={index} className={`text-xs ${getBadgeColor(badge)}`}>
                      {badge}
                    </Badge>
                  ))}
                  <span className="text-sm text-gray-500 ml-auto">
                    {getTimeAgo(thread.createdAt)}
                  </span>
                </div>
                
                <div className="prose prose-sm max-w-none mb-4">
                  <p>{thread.content}</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {thread.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{thread.upvotes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsReplying(true)}>
                    <Reply className="w-4 h-4 mr-1" />
                    Reply
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Quote className="w-4 h-4 mr-1" />
                    Quote
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Flag className="w-4 h-4 mr-1" />
                    Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Replies */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">
              {thread.replies.length} {thread.replies.length === 1 ? 'Reply' : 'Replies'}
            </h3>
            
            {thread.replies.map((reply) => (
              <div key={reply.id} className={`border-l-4 pl-4 ${reply.isAnswer ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={reply.author.avatar} alt={reply.author.name} />
                    <AvatarFallback>{reply.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{reply.author.name}</span>
                      <span className="text-sm text-gray-500">from {reply.author.country}</span>
                      {reply.author.badges.map((badge, index) => (
                        <Badge key={index} className={`text-xs ${getBadgeColor(badge)}`}>
                          {badge}
                        </Badge>
                      ))}
                      {reply.isAnswer && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          ✓ Accepted Answer
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500 ml-auto">
                        {getTimeAgo(reply.createdAt)}
                      </span>
                    </div>
                    
                    <div className="prose prose-sm max-w-none mb-3">
                      <p>{reply.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{reply.upvotes}</span>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Reply className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                      {!reply.isAnswer && (
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark as Answer
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Flag className="w-4 h-4 mr-1" />
                        Report
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Reply Form */}
          {isReplying && (
            <div className="border-t pt-6">
              <h4 className="font-medium mb-3">Write a Reply</h4>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Share your knowledge, experience, or ask for clarification..."
                className="min-h-24 mb-3"
              />
              <div className="flex gap-2">
                <Button onClick={handleReply} disabled={!replyContent.trim()}>
                  Post Reply
                </Button>
                <Button variant="outline" onClick={() => setIsReplying(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Quick Reply Button */}
          {!isReplying && (
            <Button 
              onClick={() => setIsReplying(true)}
              className="w-full"
              variant="outline"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Add a Reply
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThreadDetailModal;
