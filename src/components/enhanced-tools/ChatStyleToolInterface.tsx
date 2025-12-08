
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UnifiedCard, AIFeedbackBar, TrustBadge } from '../ui/design-system';
import { Send, Bot, User, Loader2, CheckCircle, AlertCircle, Star } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface ChatStyleToolInterfaceProps {
  toolName: string;
  toolDescription: string;
  initialMessages?: Message[];
  onMessageSend?: (message: string) => void;
  isProcessing?: boolean;
}

const ChatStyleToolInterface = ({ 
  toolName, 
  toolDescription, 
  initialMessages = [],
  onMessageSend,
  isProcessing = false 
}: ChatStyleToolInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: `Welcome to ${toolName}! ${toolDescription}`,
      timestamp: new Date()
    },
    ...initialMessages
  ]);
  const [inputValue, setInputValue] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAiProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputValue, toolName),
        timestamp: new Date(),
        metadata: {
          confidence: 85 + Math.random() * 10,
          processingTime: (1 + Math.random() * 3).toFixed(1) + 's'
        }
      };
      setMessages(prev => [...prev, aiResponse]);
      setAiProcessing(false);
    }, 2000 + Math.random() * 2000);

    if (onMessageSend) {
      onMessageSend(inputValue);
    }
  };

  const generateAIResponse = (userInput: string, toolName: string) => {
    const responses = {
      'SOP Builder': [
        "I can help you create a compelling Statement of Purpose. Based on your input, I recommend focusing on your research experience and career goals. Would you like me to generate a draft?",
        "Great! Let me analyze your background. Your academic profile looks strong. I suggest highlighting your leadership experience more prominently.",
        "Here's a structured approach: 1) Academic background, 2) Research interests, 3) Career goals, 4) Why this university. Shall we start with section 1?"
      ],
      'University Finder': [
        "Based on your profile, I found 12 universities that match your criteria. MIT has a 92% match with your research interests in AI.",
        "Excellent choice! Here are the top matches: 1) MIT (92% match), 2) Stanford (89% match), 3) CMU (87% match). Would you like detailed information about any of these?",
        "I've filtered universities based on your budget and location preferences. Here are 5 options that offer good scholarship opportunities."
      ],
      'Scholarship Finder': [
        "I found 8 scholarships you're eligible for! The Merit Excellence Scholarship ($15,000) has a deadline next month. Shall I help you apply?",
        "Based on your nationality and field of study, you have strong chances for the International Student Grant. The application requires 2 essays.",
        "Great news! You match 3 full-tuition scholarships. The Fulbright program deadline is approaching - would you like help with the application?"
      ]
    };

    const toolResponses = responses[toolName as keyof typeof responses] || [
      "I understand your request. Let me analyze the information and provide you with personalized recommendations.",
      "That's a great question! Based on my analysis, here are the key points you should consider...",
      "I've processed your information and found several options that match your criteria. Would you like me to explain each one?"
    ];

    return toolResponses[Math.floor(Math.random() * toolResponses.length)];
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex items-start space-x-2 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {!isUser && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isSystem ? 'bg-gray-100' : 'bg-emerald-100'
            }`}>
              {isSystem ? (
                <Star className="h-4 w-4 text-gray-600" />
              ) : (
                <Bot className="h-4 w-4 text-emerald-600" />
              )}
            </div>
          )}
          {isUser && (
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
          )}
          
          <div className={`rounded-lg p-3 ${
            isUser ? 'bg-blue-500 text-white' : 
            isSystem ? 'bg-gray-100 text-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <p className="text-sm">{message.content}</p>
            {message.metadata && (
              <div className="mt-2 flex items-center space-x-2 text-xs opacity-75">
                <TrustBadge type="ai" text={`${message.metadata.confidence?.toFixed(0)}% confident`} />
                <span>{message.metadata.processingTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <UnifiedCard className="h-[600px] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{toolName}</h3>
            <p className="text-sm text-gray-600">{toolDescription}</p>
          </div>
          <TrustBadge type="ai" text="AI-Powered" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {aiProcessing && (
          <div className="flex justify-start mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span className="text-sm text-gray-600">AI is analyzing...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Ask ${toolName} anything...`}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            disabled={aiProcessing}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || aiProcessing}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </UnifiedCard>
  );
};

export default ChatStyleToolInterface;
