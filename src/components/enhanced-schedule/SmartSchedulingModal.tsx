'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  MessageSquare, 
  CheckCircle, 
  Users, 
  Globe, 
  Sparkles,
  FileText,
  GraduationCap,
  CreditCard,
  User,
  Heart,
  Zap,
  ChevronRight,
  Bot,
  PartyPopper
} from 'lucide-react';

interface SmartSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const consultationTypes = [
  { 
    id: 'general', 
    label: 'General Guidance', 
    emoji: '🧭', 
    description: 'Overall study abroad planning',
    aiRecommendation: false
  },
  { 
    id: 'university-selection', 
    label: 'University Selection', 
    emoji: '🏫', 
    description: 'Find the perfect universities',
    aiRecommendation: true
  },
  { 
    id: 'application-review', 
    label: 'Application Review', 
    emoji: '📄', 
    description: 'Polish your applications',
    aiRecommendation: false
  },
  { 
    id: 'visa-guidance', 
    label: 'Visa Guidance', 
    emoji: '✈️', 
    description: 'Navigate visa requirements',
    aiRecommendation: false
  },
  { 
    id: 'scholarship', 
    label: 'Scholarship Help', 
    emoji: '💰', 
    description: 'Find funding opportunities',
    aiRecommendation: true
  },
  { 
    id: 'interview-prep', 
    label: 'Interview Prep', 
    emoji: '🎤', 
    description: 'Ace your interviews',
    aiRecommendation: false
  }
];

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

const SmartSchedulingModal: React.FC<SmartSchedulingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<'intake' | 'form' | 'confirmation'>('intake');
  const [isConversational, setIsConversational] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [isFlexible, setIsFlexible] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    program: '',
    consultationType: '',
    goals: ''
  });

  // Simulated AI personalization
  useEffect(() => {
    if (isOpen) {
      // Simulate AI-powered pre-filling based on previous interactions
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          program: 'masters', // Auto-filled based on AI analysis
        }));
      }, 1000);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
    setCurrentStep('confirmation');
    
    // Simulate booking animation
    setTimeout(() => {
      console.log('Consultation booked:', { ...formData, date: selectedDate, time: selectedTime });
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRecommendedConsultationType = () => {
    return consultationTypes.find(type => type.aiRecommendation);
  };

  const getDynamicRightPanel = () => {
    const selectedType = consultationTypes.find(type => type.id === formData.consultationType);
    
    if (selectedType?.id === 'visa-guidance') {
      return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Visa Consultation Checklist</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Valid passport (6+ months validity)
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              University acceptance letter
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Financial documents
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Academic transcripts
            </li>
          </ul>
        </div>
      );
    }

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👨‍🎓 Meet Your Mentor</h3>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Sarah Johnson</div>
            <div className="text-sm text-gray-600">Expert Study Abroad Counselor</div>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          10+ years helping students achieve their dreams. Specialized in {selectedType?.label || 'study abroad guidance'}.
        </p>
      </div>
    );
  };

  if (currentStep === 'confirmation') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">You're all set!</h2>
            <p className="text-gray-600 mb-8">
              Your consultation is booked for {selectedDate && format(selectedDate, 'PPP')} at {selectedTime}
            </p>
            
            <div className="space-y-4">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Add to Google Calendar
              </Button>
              
              <Button variant="outline" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Share with Family
              </Button>
              
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mt-6">
                <p className="text-sm text-gray-700 mb-3">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  While you wait, explore our AI tools:
                </p>
                <Button variant="outline" size="sm" className="mr-2">
                  ✍️ SOP Writing Assistant
                </Button>
                <Button variant="outline" size="sm">
                  🎤 Interview Prep Agent
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (currentStep === 'intake' && isConversational) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <div className="py-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold">Hi there! 👋</h2>
              <p className="text-gray-600">I can help you book a session. What would you like help with today?</p>
            </div>
            
            <div className="space-y-3">
              {consultationTypes.slice(0, 3).map((type) => (
                <Button
                  key={type.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => {
                    handleInputChange('consultationType', type.id);
                    setCurrentStep('form');
                  }}
                >
                  <span className="text-2xl mr-3">{type.emoji}</span>
                  <div className="text-left">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentStep('form')}
                className="text-blue-600"
              >
                Or use the traditional form
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Left Side - Enhanced Form */}
          <div className="p-8 overflow-y-auto">
            <DialogHeader className="mb-6">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Book Your Dream Session ✨
                </DialogTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Conversational mode</span>
                  <Switch
                    checked={isConversational}
                    onCheckedChange={(checked) => {
                      setIsConversational(checked);
                      if (checked) setCurrentStep('intake');
                    }}
                  />
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What should we call you? <Heart className="w-4 h-4 inline text-red-500" />
                    </label>
                    <Input
                      placeholder="Your preferred name..."
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                      className="border-2 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Best email to reach you
                    </label>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="border-2 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Phone number (optional)"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="border-2 focus:border-blue-500"
                  />
                  
                  {/* Smart Program Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Zap className="w-4 h-4 inline mr-1 text-yellow-500" />
                      AI-suggested program level
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['undergraduate', 'masters', 'phd'].map((level) => (
                        <Badge
                          key={level}
                          variant={formData.program === level ? "default" : "outline"}
                          className={`cursor-pointer px-3 py-2 ${
                            formData.program === level 
                              ? 'bg-blue-600 text-white' 
                              : 'hover:bg-blue-50'
                          } ${level === 'masters' ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}
                          onClick={() => handleInputChange('program', level)}
                        >
                          {level === 'masters' && <Sparkles className="w-3 h-3 mr-1" />}
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Badge>
                      ))}
                    </div>
                    {formData.program === 'masters' && (
                      <p className="text-xs text-blue-600 mt-1">✨ AI recommendation based on your profile</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Smart Consultation Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What brings you here today? 🤔
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {consultationTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        formData.consultationType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${type.aiRecommendation ? 'ring-2 ring-yellow-400 ring-opacity-30' : ''}`}
                      onClick={() => handleInputChange('consultationType', type.id)}
                    >
                      {type.aiRecommendation && (
                        <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs">
                          AI Pick
                        </Badge>
                      )}
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{type.emoji}</span>
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Date & Time Picker */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    When works best for you? 📅
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">I'm flexible</span>
                    <Switch
                      checked={isFlexible}
                      onCheckedChange={setIsFlexible}
                    />
                  </div>
                </div>

                {!isFlexible && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date Picker */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-2",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Time Slots */}
                    <div>
                      <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {timeSlots.map((time) => (
                          <Badge
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            className={`cursor-pointer text-center py-2 ${
                              selectedTime === time 
                                ? 'bg-blue-600 text-white' 
                                : 'hover:bg-blue-50'
                            }`}
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {isFlexible && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Perfect! We'll find the best time that works for both you and our expert counselors.
                    </p>
                  </div>
                )}
              </div>

              {/* Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us anything—your dreams, doubts, or questions 💭
                </label>
                <Textarea
                  placeholder="I'm hoping to study computer science in Canada, but I'm worried about..."
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  rows={4}
                  className="border-2 focus:border-blue-500"
                />
              </div>

              {/* Enhanced Submit Button */}
              <Button 
                type="submit" 
                className={cn(
                  "w-full font-semibold py-4 rounded-xl transition-all transform",
                  isBooked
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105"
                )}
                disabled={isBooked}
              >
                {isBooked ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Booked Successfully!
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    Schedule Your Dream Session
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Right Side - Dynamic Information */}
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 p-8 space-y-6 overflow-y-auto">
            {/* Dynamic Content Based on Selection */}
            {getDynamicRightPanel()}

            {/* Video Consultation Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <Video className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">HD Video Consultation</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Screen sharing for document review
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Session recording for reference
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Global timezone support
                </li>
              </ul>
            </div>

            {/* Success Metrics */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Why Students Love Us 💙</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-bold text-2xl">98%</div>
                  <div className="opacity-90">Success Rate</div>
                </div>
                <div>
                  <div className="font-bold text-2xl">10K+</div>
                  <div className="opacity-90">Dreams Achieved</div>
                </div>
                <div>
                  <div className="font-bold text-2xl">24h</div>
                  <div className="opacity-90">Response Time</div>
                </div>
                <div>
                  <div className="font-bold text-2xl">∞</div>
                  <div className="opacity-90">Support Until Success</div>
                </div>
              </div>
            </div>

            {/* Floating AI Assistant */}
            <div className="fixed bottom-6 right-6 lg:relative lg:bottom-0 lg:right-0">
              <Button 
                size="sm" 
                className="rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
              >
                <Bot className="w-4 h-4 mr-2" />
                Ask me anything! 🤖
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartSchedulingModal;