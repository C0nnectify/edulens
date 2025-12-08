import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAI } from '../contexts/AIContext';
import DetailedJourneyModal from './enhanced-tools/DetailedJourneyModal';

interface AIJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: number;
  agentName: string;
  journey: string[];
  toolType: 'agent' | 'tool';
}

const AIJourneyModal = ({ isOpen, onClose, agentId, agentName, journey, toolType }: AIJourneyModalProps) => {
  const [showDetailedJourney, setShowDetailedJourney] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const { updateInteraction } = useAI();
  const [interactionId, setInteractionId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !interactionId) {
      // Assuming setInteractionId is a state setter, not a function to generate an ID.
      // If you need to generate an ID, use a separate function, e.g., generateInteractionId.
      const id = `${agentId}-${agentName}-${Date.now()}`;
      setInteractionId(id);
    }
  }, [isOpen, agentId, agentName, interactionId]);

  // For tools with more than 4 steps, show the detailed journey by default
  const shouldUseDetailedJourney = journey.length > 4;

  if (shouldUseDetailedJourney || showDetailedJourney) {
    return (
      <DetailedJourneyModal
        isOpen={isOpen}
        onClose={onClose}
        agentId={agentId}
        agentName={agentName}
        journey={journey}
        toolType={toolType}
      />
    );
  }

  const simulateAIProcessing = async (stepIndex: number) => {
    setIsProcessing(true);
    
    if (interactionId) {
      updateInteraction(interactionId, {
        step: journey[stepIndex],
        progress: ((stepIndex + 1) / journey.length) * 100
      });
    }

    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    
    const stepResults = generateSimulatedResults(stepIndex, agentName, formData);
    setResults(prev => ({ ...prev, [stepIndex]: stepResults }));
    
    setIsProcessing(false);
    
    if (stepIndex === journey.length - 1) {
      if (interactionId) {
        completeInteraction(interactionId, { finalResults: stepResults, formData });
      }
    }
  };

  const generateSimulatedResults = (stepIndex: number, agentName: string, _data: Record<string, string>) => {
    const baseResults = {
      timestamp: new Date().toISOString(),
      confidence: 85 + Math.random() * 10,
      processingTime: (1 + Math.random() * 3).toFixed(1) + 's'
    };

    if (agentName.includes('University')) {
      return {
        ...baseResults,
        universities: [
          { name: 'MIT', match: 92, tuition: '$57,986' },
          { name: 'Stanford', match: 89, tuition: '$61,731' },
          { name: 'Harvard', match: 87, tuition: '$59,076' }
        ]
      };
    } else if (agentName.includes('Scholarship')) {
      return {
        ...baseResults,
        scholarships: [
          { name: 'Merit Scholarship', amount: '$15,000', deadline: '2024-03-15' },
          { name: 'International Student Grant', amount: '$8,000', deadline: '2024-04-01' }
        ]
      };
    }

    return baseResults;
  };

  const handleNextStep = () => {
    if (currentStep < journey.length - 1) {
      setCurrentStep(currentStep + 1);
      simulateAIProcessing(currentStep + 1);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    const step = journey[currentStep];
    
    if (currentStep === 0) {
      return (
        <div className="space-y-4">
          <p className="text-gray-600">Let&apos;s start your {agentName.toLowerCase()} journey. Please provide some basic information:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Your Name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Email Address"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.level || ''}
              onChange={(e) => handleInputChange('level', e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Level</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="masters">Masters</option>
              <option value="phd">PhD</option>
            </select>
            <select
              value={formData.country || ''}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Preferred Country</option>
              <option value="usa">USA</option>
              <option value="uk">UK</option>
              <option value="canada">Canada</option>
              <option value="australia">Australia</option>
            </select>
          </div>

          <div className="mt-4 text-center">
            <Button 
              onClick={() => setShowDetailedJourney(true)}
              variant="outline"
              className="mb-2"
            >
              Switch to Detailed Journey
            </Button>
            <p className="text-xs text-gray-500">For comprehensive step-by-step guidance</p>
          </div>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">AI is processing your {step.toLowerCase()}...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      );
    }

    if (results?.[currentStep]) {
      const result = results[currentStep];
      return (
        <div className="space-y-4">
          <div className="flex items-center text-green-600 mb-4">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-semibold">{step} Completed</span>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Confidence:</span>
                <span className="ml-2 font-semibold">{result.confidence?.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-gray-500">Processing Time:</span>
                <span className="ml-2 font-semibold">{result.processingTime}</span>
              </div>
            </div>
          </div>

          {result.universities && (
            <div>
              <h4 className="font-semibold mb-2">Recommended Universities:</h4>
              <div className="space-y-2">
                {result.universities.map((uni: Record<string, unknown>, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span>{uni.name}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-600">{uni.match}% match</div>
                      <div className="text-xs text-gray-500">{uni.tuition}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.scholarships && (
            <div>
              <h4 className="font-semibold mb-2">Available Scholarships:</h4>
              <div className="space-y-2">
                {result.scholarships.map((scholarship: Record<string, unknown>, index: number) => (
                  <div key={index} className="p-2 bg-green-50 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{scholarship.name}</span>
                      <span className="text-green-600 font-bold">{scholarship.amount}</span>
                    </div>
                    <div className="text-xs text-gray-500">Deadline: {scholarship.deadline}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Ready to process: {step}</p>
        <p className="text-sm text-gray-500 mt-2">Click &quot;Process Step&quot; to continue</p>
      </div>
    );
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return formData.name && formData.email && formData.level && formData.country;
    }
    return results?.[currentStep] && !isProcessing;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {agentName} Journey
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {journey.length}</span>
              <span>{Math.floor(((currentStep + 1) / journey.length) * 100)}% Complete</span>
            </div>
            <Progress value={((currentStep + 1) / journey.length) * 100} />
          </div>

          <div className="flex justify-between items-center">
            {journey.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-2 ${
                  index < currentStep ? 'bg-green-500 text-white' :
                  index === currentStep ? 'bg-blue-500 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                <span className="text-xs text-gray-600 px-1">{step}</span>
              </div>
            ))}
          </div>

          <div className="min-h-[200px]">
            <h3 className="text-lg font-semibold mb-4">{journey[currentStep]}</h3>
            {renderStepContent()}
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0 || isProcessing}
            >
              Previous
            </Button>
            
            <div className="space-x-2">
              {currentStep < journey.length - 1 ? (
                <>
                  {!results?.[currentStep] && !isProcessing && currentStep > 0 && (
                    <Button 
                      onClick={() => simulateAIProcessing(currentStep)}
                      disabled={isProcessing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Process Step
                    </Button>
                  )}
                  <Button 
                    onClick={handleNextStep}
                    disabled={!canProceed()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={onClose}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  Complete Journey
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIJourneyModal;
function completeInteraction(interactionId: string, arg1: { finalResults: { timestamp: string; confidence: number; processingTime: string; } | { universities: { name: string; match: number; tuition: string; }[]; timestamp: string; confidence: number; processingTime: string; } | { scholarships: { name: string; amount: string; deadline: string; }[]; timestamp: string; confidence: number; processingTime: string; }; formData: Record<string, string>; }) {
  throw new Error('Function not implemented.');
}

