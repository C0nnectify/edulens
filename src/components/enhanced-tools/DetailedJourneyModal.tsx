
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight, Loader2, X, Star, Upload, Download } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import ChatStyleToolInterface from './ChatStyleToolInterface';
import { UnifiedCard, TrustBadge, AIFeedbackBar } from '../ui/design-system';

interface DetailedJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: number;
  agentName: string;
  journey: string[];
  toolType: 'agent' | 'tool';
}

const DetailedJourneyModal = ({ isOpen, onClose, agentId, agentName, journey, toolType }: DetailedJourneyModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [results, setResults] = useState<any>(null);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const { startInteraction, updateInteraction, completeInteraction } = useAI();
  const [interactionId, setInteractionId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !interactionId) {
      const id = startInteraction(agentId, agentName);
      setInteractionId(id);
    }
  }, [isOpen, agentId, agentName, startInteraction, interactionId]);

  const getStepDetails = (stepIndex: number) => {
    const stepDetailsMap: Record<string, any> = {
      // SOP & Resume Builder
      "Choose Template": {
        description: "Select from professional templates tailored to your field",
        inputs: ["document_type", "field_of_study", "template_style"],
        aiFeatures: ["Template recommendation", "Style analysis"]
      },
      "Profile Analysis": {
        description: "AI analyzes your background to identify key strengths",
        inputs: ["academic_background", "work_experience", "achievements"],
        aiFeatures: ["Strength identification", "Gap analysis", "Personalization"]
      },
      "AI Content Generation": {
        description: "Generate compelling content with AI assistance",
        inputs: ["goals", "experiences", "motivation"],
        aiFeatures: ["Content generation", "Tone optimization", "Structure guidance"]
      },
      "Expert Review": {
        description: "Get feedback from industry experts",
        inputs: ["draft_document"],
        aiFeatures: ["Expert matching", "Feedback synthesis", "Improvement suggestions"]
      },
      "ATS Optimization": {
        description: "Optimize for Applicant Tracking Systems",
        inputs: ["target_companies", "job_descriptions"],
        aiFeatures: ["Keyword optimization", "Format validation", "Score prediction"]
      },
      // University Finder
      "Profile Setup": {
        description: "Create comprehensive academic and personal profile",
        inputs: ["academic_records", "test_scores", "preferences", "budget"],
        aiFeatures: ["Profile completeness check", "Strength assessment"]
      },
      "Preference Analysis": {
        description: "AI analyzes your preferences for perfect matches",
        inputs: ["location_preference", "program_type", "university_size"],
        aiFeatures: ["Preference weighting", "Priority ranking"]
      },
      "University Matching": {
        description: "Find universities that match your profile",
        inputs: ["minimum_requirements", "reach_universities"],
        aiFeatures: ["Match scoring", "Probability calculation", "Alternative suggestions"]
      },
      // Default for other steps
      "default": {
        description: "AI-powered step with personalized guidance",
        inputs: ["user_input"],
        aiFeatures: ["Smart analysis", "Personalized recommendations"]
      }
    };

    return stepDetailsMap[journey[stepIndex]] || stepDetailsMap["default"];
  };

  const simulateAIProcessing = async (stepIndex: number) => {
    setIsProcessing(true);
    
    if (interactionId) {
      updateInteraction(interactionId, {
        step: journey[stepIndex],
        progress: ((stepIndex + 1) / journey.length) * 100
      });
    }

    // Simulate realistic AI processing time
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 4000));
    
    const stepResults = generateDetailedResults(stepIndex, agentName, formData);
    setResults(prev => ({ ...prev, [stepIndex]: stepResults }));
    
    setIsProcessing(false);
    
    if (stepIndex === journey.length - 1) {
      if (interactionId) {
        completeInteraction(interactionId, { finalResults: stepResults, formData });
      }
    }
  };

  const generateDetailedResults = (stepIndex: number, agentName: string, data: any) => {
    const baseResults = {
      timestamp: new Date().toISOString(),
      confidence: 85 + Math.random() * 12,
      processingTime: (2 + Math.random() * 5).toFixed(1) + 's',
      step: journey[stepIndex]
    };

    // Generate specific results based on tool type and step
    if (agentName.includes('SOP') || agentName.includes('Resume')) {
      return {
        ...baseResults,
        document: {
          score: 75 + Math.random() * 20,
          wordCount: 450 + Math.floor(Math.random() * 200),
          improvements: [
            'Strengthen opening statement',
            'Add quantifiable achievements',
            'Improve keyword density',
            'Enhance conclusion impact'
          ],
          downloadReady: stepIndex >= 4
        }
      };
    } else if (agentName.includes('University')) {
      return {
        ...baseResults,
        universities: [
          { name: 'MIT', match: 92, tuition: '$57,986', location: 'Boston, MA', acceptance: '6.7%' },
          { name: 'Stanford', match: 89, tuition: '$61,731', location: 'Stanford, CA', acceptance: '4.3%' },
          { name: 'Harvard', match: 87, tuition: '$59,076', location: 'Cambridge, MA', acceptance: '3.4%' },
          { name: 'Caltech', match: 85, tuition: '$63,255', location: 'Pasadena, CA', acceptance: '3.9%' },
          { name: 'UC Berkeley', match: 83, tuition: '$48,465', location: 'Berkeley, CA', acceptance: '14.5%' }
        ]
      };
    } else if (agentName.includes('Scholarship')) {
      return {
        ...baseResults,
        scholarships: [
          { name: 'Merit Excellence Award', amount: '$25,000', deadline: '2024-03-15', eligibility: '95%' },
          { name: 'International Student Grant', amount: '$15,000', deadline: '2024-04-01', eligibility: '87%' },
          { name: 'STEM Leadership Scholarship', amount: '$20,000', deadline: '2024-03-30', eligibility: '78%' },
          { name: 'Diversity Excellence Fund', amount: '$12,000', deadline: '2024-04-15', eligibility: '92%' }
        ],
        totalPotential: '$72,000'
      };
    } else if (agentName.includes('Financial')) {
      return {
        ...baseResults,
        budget: {
          totalCost: '$85,420',
          tuition: '$55,000',
          living: '$18,000',
          other: '$12,420',
          fundingSources: [
            { type: 'Scholarships', amount: '$25,000', percentage: 29 },
            { type: 'Family Contribution', amount: '$35,000', percentage: 41 },
            { type: 'Student Loan', amount: '$25,420', percentage: 30 }
          ]
        }
      };
    }

    return {
      ...baseResults,
      analysis: {
        score: 78 + Math.random() * 15,
        recommendations: [
          'Continue with current approach',
          'Consider additional options',
          'Review and refine strategy'
        ]
      }
    };
  };

  const handleNextStep = () => {
    if (currentStep < journey.length - 1) {
      setCurrentStep(currentStep + 1);
      simulateAIProcessing(currentStep + 1);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    const step = journey[currentStep];
    const stepDetails = getStepDetails(currentStep);
    
    if (showChatInterface) {
      return (
        <div className="h-[500px]">
          <ChatStyleToolInterface
            toolName={agentName}
            toolDescription={`Step ${currentStep + 1}: ${step}`}
            onMessageSend={(message) => console.log('Message sent:', message)}
          />
          <Button 
            onClick={() => setShowChatInterface(false)}
            variant="outline"
            className="mt-4 w-full"
          >
            Return to Guided Journey
          </Button>
        </div>
      );
    }
    
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          <UnifiedCard variant="primary">
            <h4 className="font-semibold mb-3 flex items-center">
              <Star className="mr-2 h-5 w-5 text-emerald-600" />
              {step}
            </h4>
            <p className="text-gray-600 mb-4">{stepDetails.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Your Name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <input
                placeholder="Email Address"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={formData.level || ''}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Level</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="masters">Masters</option>
                <option value="phd">PhD</option>
              </select>
              <select
                value={formData.field || ''}
                onChange={(e) => handleInputChange('field', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Field of Study</option>
                <option value="engineering">Engineering</option>
                <option value="business">Business</option>
                <option value="medicine">Medicine</option>
                <option value="arts">Arts & Humanities</option>
                <option value="sciences">Sciences</option>
              </select>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-2">AI Features in this step:</h5>
              <div className="space-y-1">
                {stepDetails.aiFeatures.map((feature: string, index: number) => (
                  <div key={index} className="text-sm text-blue-700 flex items-center">
                    <TrustBadge type="ai" text={feature} />
                  </div>
                ))}
              </div>
            </div>
          </UnifiedCard>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <UnifiedCard>
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="text-gray-600 font-medium">AI is processing your {step.toLowerCase()}...</p>
            <p className="text-sm text-gray-500 mt-2">Using advanced algorithms for best results</p>
            <div className="mt-4 max-w-md mx-auto">
              <Progress value={25 + (Math.random() * 50)} className="h-2" />
            </div>
          </div>
        </UnifiedCard>
      );
    }

    if (results?.[currentStep]) {
      const result = results[currentStep];
      return (
        <div className="space-y-6">
          <UnifiedCard variant="success">
            <div className="flex items-center text-green-600 mb-4">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-semibold">{step} Completed Successfully</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="font-semibold">{result.confidence?.toFixed(1)}%</div>
                <div className="text-gray-600">Confidence</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="font-semibold">{result.processingTime}</div>
                <div className="text-gray-600">Processing Time</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="font-semibold">Step {currentStep + 1}</div>
                <div className="text-gray-600">of {journey.length}</div>
              </div>
            </div>

            {result.universities && (
              <div>
                <h4 className="font-semibold mb-3">Recommended Universities:</h4>
                <div className="space-y-3">
                  {result.universities.slice(0, 3).map((uni: any, index: number) => (
                    <div key={index} className="p-3 bg-white border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold">{uni.name}</h5>
                          <p className="text-sm text-gray-600">{uni.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600">{uni.match}%</div>
                          <div className="text-xs text-gray-500">match</div>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span>Tuition: {uni.tuition}</span>
                        <span>Acceptance: {uni.acceptance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.scholarships && (
              <div>
                <h4 className="font-semibold mb-3">Available Scholarships:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.scholarships.slice(0, 4).map((scholarship: any, index: number) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-green-800">{scholarship.name}</h5>
                        <span className="text-green-600 font-bold">{scholarship.amount}</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>Deadline: {scholarship.deadline}</div>
                        <div>Eligibility: {scholarship.eligibility}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-green-100 rounded text-center">
                  <span className="font-bold text-green-800">Total Potential: {result.totalPotential}</span>
                </div>
              </div>
            )}

            {result.document && (
              <div>
                <h4 className="font-semibold mb-3">Document Analysis:</h4>
                <div className="space-y-4">
                  <AIFeedbackBar 
                    score={result.document.score} 
                    label="Document Quality Score"
                    explanation={`${result.document.wordCount} words generated`}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Improvements Needed:</h5>
                      <ul className="text-sm space-y-1">
                        {result.document.improvements.map((improvement: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-center">
                      {result.document.downloadReady && (
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                          <Download className="mr-2 h-4 w-4" />
                          Download Document
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.budget && (
              <div>
                <h4 className="font-semibold mb-3">Financial Planning Results:</h4>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{result.budget.totalCost}</div>
                    <div className="text-sm text-gray-600">Total Estimated Cost</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold">{result.budget.tuition}</div>
                      <div className="text-gray-600">Tuition</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold">{result.budget.living}</div>
                      <div className="text-gray-600">Living</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold">{result.budget.other}</div>
                      <div className="text-gray-600">Other</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </UnifiedCard>
        </div>
      );
    }

    return (
      <UnifiedCard>
        <div className="text-center py-8">
          <h4 className="font-semibold text-lg mb-2">{step}</h4>
          <p className="text-gray-600 mb-4">{stepDetails.description}</p>
          <div className="space-y-2 mb-6">
            {stepDetails.aiFeatures.map((feature: string, index: number) => (
              <TrustBadge key={index} type="ai" text={feature} />
            ))}
          </div>
          <Button 
            onClick={() => setShowChatInterface(true)}
            variant="outline"
            className="mr-4"
          >
            Use Chat Interface
          </Button>
          <p className="text-sm text-gray-500 mt-2">Click "Process Step" to continue with guided journey</p>
        </div>
      </UnifiedCard>
    );
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return formData.name && formData.email && formData.level && formData.field;
    }
    return results?.[currentStep] && !isProcessing;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {agentName} - Detailed Journey
            </DialogTitle>
            {/* REMOVED redundant close X Button here */}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {journey.length}</span>
              <span>{Math.floor(((currentStep + 1) / journey.length) * 100)}% Complete</span>
            </div>
            <Progress value={((currentStep + 1) / journey.length) * 100} className="h-3" />
          </div>

          {/* Journey Steps Visualization */}
          <div className="overflow-x-auto">
            <div className="flex justify-between items-center min-w-[600px]">
              {journey.map((step, index) => (
                <div key={index} className="flex flex-col items-center text-center flex-1 mx-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-2 ${
                    index < currentStep ? 'bg-green-500 text-white' :
                    index === currentStep ? 'bg-emerald-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index < currentStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
                  </div>
                  <span className="text-xs text-gray-600 px-1 leading-tight">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Actions */}
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
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Process Step
                    </Button>
                  )}
                  <Button 
                    onClick={handleNextStep}
                    disabled={!canProceed()}
                    className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                  >
                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={onClose}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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

export default DetailedJourneyModal;

