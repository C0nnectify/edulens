'use client';

import React, { useState } from 'react';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, X, Sparkles, Globe, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  message: string;
  timestamp: Date;
}

interface StudyAbroadChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const StudyAbroadChatbot: React.FC<StudyAbroadChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      message: "Hi! I'm your Study Abroad AI Assistant 🎓 I'm here to help you explore your international education journey. You can ask me about countries, universities, programs, costs, scholarships, and much more!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickQuestions = [
    "Which countries are best for studying Computer Science?",
    "What's the average cost of studying in Canada?",
    "How do I apply for scholarships?",
    "What are the IELTS requirements for UK universities?",
    "Best universities for Master's in Business?",
    "How to get a student visa for Australia?"
  ];

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('canada')) {
      return "🇨🇦 Canada is an excellent choice! Popular for its high-quality education, post-graduation work permits, and pathway to permanent residence. Top universities include University of Toronto, UBC, and McGill. Average tuition: $15,000-35,000 CAD/year. Would you like specific information about programs or application requirements?";
    }
    
    if (lowerMessage.includes('computer science') || lowerMessage.includes('cs')) {
      return "💻 For Computer Science, top destinations include: \n• USA (MIT, Stanford, Carnegie Mellon)\n• Canada (University of Toronto, UBC)\n• UK (Oxford, Cambridge, Imperial College)\n• Germany (TU Munich, Free)\n\nWhich country interests you most? I can provide detailed info about specific programs!";
    }
    
    if (lowerMessage.includes('scholarship')) {
      return "💰 Great question! Scholarships vary by country:\n• Canada: Vanier CGS, Trudeau Foundation\n• UK: Chevening, Commonwealth\n• USA: Fulbright, university-specific\n• Australia: Australia Awards\n\nTip: Apply early and maintain strong academics. Would you like me to help you find scholarships for a specific country or field?";
    }
    
    if (lowerMessage.includes('cost') || lowerMessage.includes('fees')) {
      return "💸 Study abroad costs vary significantly:\n• USA: $25,000-60,000/year\n• Canada: $15,000-35,000/year\n• UK: £15,000-40,000/year\n• Australia: $20,000-45,000 AUD/year\n• Germany: €0-20,000/year\n\nThis includes tuition + living costs. Which country are you considering? I can provide a detailed breakdown!";
    }
    
    if (lowerMessage.includes('ielts') || lowerMessage.includes('english test')) {
      return "📝 IELTS requirements by country:\n• Canada: 6.5+ overall (6.0+ each band)\n• UK: 6.0-7.0+ (varies by university)\n• Australia: 6.5+ overall\n• USA: TOEFL preferred (80-100+)\n\nTip: Aim higher than minimum requirements for better scholarship chances. Need preparation tips?";
    }
    
    if (lowerMessage.includes('visa')) {
      return "📄 Student visa requirements generally include:\n• Acceptance letter from university\n• Proof of funds (tuition + living)\n• English proficiency scores\n• Medical examination\n• Clean background check\n\nProcessing time: 2-12 weeks. Which country's visa process interests you? I can provide specific guidance!";
    }
    
    if (lowerMessage.includes('business') || lowerMessage.includes('mba')) {
      return "💼 Top business schools globally:\n• USA: Harvard, Wharton, Stanford\n• UK: London Business School, Oxford\n• Canada: Rotman, Schulich\n• Europe: INSEAD, IE Madrid\n\nMBA typically requires 2-5 years work experience. Interested in a specific specialization or country?";
    }
    
    return "That's a great question! I'd love to help you with more specific information. You can ask me about:\n\n🌍 Countries & universities\n💰 Costs & scholarships\n📚 Programs & requirements\n📋 Application process\n🏠 Living abroad tips\n\nWhat specific aspect would you like to explore?";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: generateBotResponse(inputMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl h-[80vh] translate-x-[-50%] translate-y-[-50%] gap-0 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          )}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Study Abroad AI Assistant</h3>
              <p className="text-sm opacity-90">Your personalized study abroad guide</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {msg.type === 'bot' && (
                    <Bot className="w-4 h-4 mt-1 text-blue-600" />
                  )}
                  <p className="whitespace-pre-line">{msg.message}</p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="p-4 border-t border-gray-200 bg-white">
            <p className="text-sm text-gray-600 mb-3">Try asking me:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion(question)}
                  className="text-left justify-start text-xs h-auto py-2"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about studying abroad..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default StudyAbroadChatbot;