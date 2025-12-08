
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UnifiedCard, MobileOptimizedButton } from './ui/design-system';
import { ArrowRight, Target, HelpCircle, CheckCircle, Globe, BookOpen, Users } from 'lucide-react';

const OnboardingFlow = ({ onComplete }: { onComplete: (profile: Record<string, unknown>) => void }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    goal: '',
    stage: '',
    preferences: {},
    background: {}
  });

  const steps = [
    {
      title: "What's your main goal?",
      subtitle: "Help us personalize your experience",
      options: [
        { id: 'explore', label: "I want to explore study abroad options", icon: Globe, description: "Just starting to research" },
        { id: 'confused', label: "I'm confused and need guidance", icon: HelpCircle, description: "Need step-by-step help" },
        { id: 'applying', label: "I'm ready to apply", icon: Target, description: "Have shortlisted universities" },
        { id: 'admitted', label: "I already have admits", icon: CheckCircle, description: "Planning next steps" }
      ]
    },
    {
      title: "What's your current stage?",
      subtitle: "We'll customize your dashboard accordingly",
      options: [
        { id: 'research', label: "Research & Planning", icon: BookOpen, description: "Finding the right fit" },
        { id: 'preparation', label: "Document Preparation", icon: Target, description: "Getting paperwork ready" },
        { id: 'application', label: "Application Process", icon: Users, description: "Submitting applications" },
        { id: 'decision', label: "Waiting for Decisions", icon: CheckCircle, description: "Applications submitted" }
      ]
    }
  ];

  const handleOptionSelect = (optionId: string) => {
    if (step === 0) {
      setProfile(prev => ({ ...prev, goal: optionId }));
      setStep(1);
    } else if (step === 1) {
      const finalProfile = { ...profile, stage: optionId };
      setProfile(finalProfile);
      onComplete(finalProfile);
    }
  };

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <UnifiedCard className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Welcome to Your Study Abroad Journey
          </h1>
          <p className="text-gray-600 mb-6">{currentStep.subtitle}</p>
          <Progress value={progress} className="mb-4" />
          <span className="text-sm text-gray-500">Step {step + 1} of {steps.length}</span>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
            {currentStep.title}
          </h2>
          
          <div className="grid gap-4">
            {currentStep.options.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  className="text-left p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <IconComponent className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{option.label}</h3>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {step > 0 && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="mr-4"
            >
              Back
            </Button>
          </div>
        )}
      </UnifiedCard>
    </div>
  );
};

export default OnboardingFlow;
