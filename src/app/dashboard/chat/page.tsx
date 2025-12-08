'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  BookOpen,
  DollarSign,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage, Source } from '@/components/chat/ChatMessage';
import { SourcesDisplay } from '@/components/chat/SourceCard';
import { RelatedQuestions, RelatedQuestion, generateRelatedQuestions } from '@/components/chat/RelatedQuestions';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ChatLayout from '@/components/dashboard/ChatLayout';

interface ChatMessageData {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sources?: Source[];
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState('1');

  const [chatSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'UK Universities Research',
      lastMessage: 'Tell me about scholarship opportunities in the UK for international students',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      messageCount: 12,
    },
    {
      id: '2',
      title: 'Computer Science Programs',
      lastMessage: 'What are the top CS programs in Canada?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      messageCount: 8,
    },
    {
      id: '3',
      title: 'Application Strategy',
      lastMessage: 'How should I prepare for MIT application?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      messageCount: 15,
    },
    {
      id: '4',
      title: 'Visa Requirements',
      lastMessage: 'Student visa process for Germany',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      messageCount: 6,
    },
  ]);

  const [messages] = useState<ChatMessageData[]>([
    {
      id: '1',
      type: 'user',
      content: 'I want to study computer science abroad. Can you help me research the best universities?',
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
    },
    {
      id: '2',
      type: 'ai',
      content: `I'd be happy to help you research computer science programs abroad! Here are some top universities to consider:

**United States:**
- MIT - World-renowned for AI and computer science research [1]
- Stanford University - Strong in tech innovation and entrepreneurship [2]
- Carnegie Mellon University - Excellent for robotics and software engineering [3]

**United Kingdom:**
- University of Cambridge - Top-tier computer science program
- Imperial College London - Strong industry connections
- University of Oxford - Excellent theoretical computer science

**Canada:**
- University of Toronto - Leading AI research hub
- University of Waterloo - Famous for co-op programs
- McGill University - Strong international reputation

**Key factors to consider:**
- Research areas that interest you
- Program structure (coursework vs research)
- Location and cost of living
- Admission requirements and deadlines

What specific area of computer science interests you most? This will help me provide more targeted recommendations.`,
      timestamp: new Date(Date.now() - 1000 * 60 * 24),
      sources: [
        {
          id: '1',
          title: 'QS World University Rankings 2024 - Computer Science',
          url: 'https://www.topuniversities.com/university-rankings',
          snippet: 'MIT ranks #1 globally for Computer Science with exceptional research output and industry partnerships.',
        },
        {
          id: '2',
          title: 'Stanford Computer Science Department',
          url: 'https://cs.stanford.edu',
          snippet: 'Located in Silicon Valley, Stanford offers unparalleled access to tech companies and startup ecosystem.',
        },
        {
          id: '3',
          title: 'Carnegie Mellon School of Computer Science',
          url: 'https://www.cs.cmu.edu',
          snippet: 'CMU pioneered the field of AI and robotics, offering world-class programs in both areas.',
        },
      ],
    },
    {
      id: '3',
      type: 'user',
      content: 'I\'m particularly interested in artificial intelligence and machine learning. What are the admission requirements typically like?',
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
    },
    {
      id: '4',
      type: 'ai',
      content: `For AI/ML programs, here are typical admission requirements:

**Academic Requirements:**
- Bachelor's degree in Computer Science, Mathematics, or related field
- Strong GPA (typically 3.5+ for top programs)
- Relevant coursework: Linear Algebra, Statistics, Programming, Calculus

**Standardized Tests:**
- GRE: Generally 160+ Quantitative, 155+ Verbal
- TOEFL/IELTS: 100+/7.0+ for non-native English speakers

**Application Materials:**
- Statement of Purpose highlighting AI/ML interest
- 2-3 Letters of Recommendation (preferably from research supervisors)
- Resume/CV with relevant projects and experience
- Portfolio of coding projects or research papers (if available)

**Preferred Experience:**
- Programming experience (Python, R, MATLAB)
- Machine learning projects or coursework
- Research experience or publications
- Internships in tech companies

**Timeline Considerations:**
- Most programs have deadlines between December-February
- Start preparing 12-18 months in advance
- Research advisor compatibility for PhD programs

Would you like me to help you evaluate your current profile against these requirements or explore specific programs in more detail?`,
      timestamp: new Date(Date.now() - 1000 * 60 * 18),
      sources: [
        {
          id: '1',
          title: 'MIT EECS Graduate Admissions',
          url: 'https://www.eecs.mit.edu/academics/graduate-programs',
          snippet: 'Competitive applicants typically have strong technical backgrounds and research experience.',
        },
        {
          id: '2',
          title: 'Stanford AI Graduate Program Requirements',
          url: 'https://ai.stanford.edu/admissions',
          snippet: 'GRE scores are optional but recommended. Strong emphasis on research potential.',
        },
      ],
    },
  ]);

  const relatedQuestions: RelatedQuestion[] = [
    {
      id: '1',
      question: 'Compare costs of studying CS in the US vs UK vs Canada',
      icon: DollarSign,
      category: 'Finance',
    },
    {
      id: '2',
      question: 'What scholarships are available for international AI students?',
      icon: BookOpen,
      category: 'Funding',
    },
    {
      id: '3',
      question: 'How competitive are admissions for top AI programs?',
      icon: TrendingUp,
      category: 'Strategy',
    },
    {
      id: '4',
      question: 'Which cities have the best tech ecosystems for graduates?',
      icon: MapPin,
      category: 'Location',
    },
  ];

  const quickPrompts = [
    {
      icon: BookOpen,
      text: 'Research universities in Canada',
      category: 'Research',
    },
    {
      icon: DollarSign,
      text: 'Calculate study abroad costs',
      category: 'Finance',
    },
    {
      icon: MapPin,
      text: 'Compare living costs by city',
      category: 'Location',
    },
    {
      icon: TrendingUp,
      text: 'Analyze my admission chances',
      category: 'Strategy',
    },
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleRelatedQuestion = (question: string) => {
    setMessage(question);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffMinutes / 1440)}d ago`;
    }
  };

  return (
    <ChatLayout>
      <div className="flex h-[calc(100vh)] bg-background rounded-lg shadow-lg">
        {/* Sidebar - Chat History */}
        <div className="w-80 bg-muted/30 flex flex-col shadow-md">
          {/* Header */}
          <div className="p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-[#20808D]" />
                <h2 className="font-semibold text-foreground">AI Research Chat</h2>
              </div>
              <Button size="sm" className="bg-gradient-to-br from-[#20808D] to-[#1a6d78] hover:shadow-md transition-all duration-150 shadow-sm">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search chats..." className="pl-10 border-none shadow-sm" />
            </div>
          </div>

          {/* Chat Sessions */}
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {chatSessions.map((session) => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-all duration-150 border-none shadow-sm hover:shadow-md ${
                    activeSessionId === session.id ? 'bg-[#20808D]/10 shadow-md ring-1 ring-[#20808D]/20' : 'bg-card'
                  }`}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate text-sm">
                          {session.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {session.lastMessage}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-xs border-none shadow-sm bg-muted">
                            {session.messageCount} messages
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(session.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 bg-background shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {chatSessions.find(s => s.id === activeSessionId)?.title || 'AI Research Assistant'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Get personalized guidance for your study abroad journey
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800 border-none shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Online
                </Badge>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 bg-background">
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <ChatMessage
                    id={msg.id}
                    type={msg.type}
                    content={msg.content}
                    timestamp={msg.timestamp}
                    sources={msg.sources}
                    onRegenerate={msg.type === 'ai' ? () => console.log('Regenerate') : undefined}
                    onFeedback={msg.type === 'ai' ? (feedback) => console.log('Feedback:', feedback) : undefined}
                  />

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 ml-11">
                      <SourcesDisplay sources={msg.sources} messageId={msg.id} />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && <TypingIndicator />}

              {/* Related Questions - Show after AI response */}
              {messages.length > 0 && !isTyping && (
                <div className="mt-6">
                  <RelatedQuestions
                    questions={relatedQuestions}
                    onQuestionClick={handleRelatedQuestion}
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Prompts */}
          <div className="p-4 bg-muted/20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="max-w-4xl mx-auto mb-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
                <Sparkles className="h-4 w-4 mr-1.5 text-[#F5A576]" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto p-3 border-none shadow-sm hover:shadow-md transition-all duration-150 bg-card"
                    onClick={() => setMessage(prompt.text)}
                  >
                    <prompt.icon className="h-4 w-4 mr-2 flex-shrink-0 text-[#F5A576]" />
                    <div>
                      <p className="text-sm font-medium">{prompt.text}</p>
                      <p className="text-xs text-muted-foreground">{prompt.category}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                value={message}
                onChange={setMessage}
                onSubmit={handleSendMessage}
                onStop={() => setIsTyping(false)}
                isLoading={isTyping}
                showAttachment={false}
                showVoice={false}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                AI can make mistakes. Verify important information with official sources.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}
