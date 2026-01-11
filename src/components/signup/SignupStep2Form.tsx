"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowRight, 
  ArrowLeft,
  GraduationCap, 
  BookOpen,
  Globe2,
  Wallet,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Loader2
} from 'lucide-react';
import type { 
  SignupStep2Data, 
  BudgetRange, 
  IntakeSemester, 
  TestPrepStatus 
} from '@/types/roadmap';

interface ExtractedField {
  field: string;
  value: string | string[] | number;
  confidence: 'high' | 'medium' | 'low';
  source: 'dream_chat';
  sourceText?: string;
}

interface ExtractedOnboardingData {
  dreamCountries?: ExtractedField;
  preferredProgramType?: ExtractedField;
  budget?: ExtractedField;
  targetIntake?: ExtractedField;
  major?: ExtractedField;
  currentDegree?: ExtractedField;
}

interface SignupStep2FormProps {
  onSubmit: (data: SignupStep2Data) => void;
  onSkip: () => void;
  onBack: () => void;
  loading?: boolean;
  dreamMessages?: Array<{ role: 'user' | 'ai'; content: string }>;
}

const TEST_STATUS_OPTIONS: Array<{ value: TestPrepStatus; label: string; icon: typeof Clock }> = [
  { value: 'not_started', label: 'Not Started', icon: Clock },
  { value: 'preparing', label: 'Preparing', icon: BookOpen },
  { value: 'scheduled', label: 'Scheduled', icon: Calendar },
  { value: 'completed', label: 'Completed', icon: CheckCircle },
];

const BUDGET_OPTIONS: Array<{ value: BudgetRange; label: string }> = [
  { value: 'under_20k', label: 'Under $20,000/year' },
  { value: '20k_40k', label: '$20,000 - $40,000/year' },
  { value: '40k_60k', label: '$40,000 - $60,000/year' },
  { value: '60k_80k', label: '$60,000 - $80,000/year' },
  { value: 'above_80k', label: 'Above $80,000/year' },
  { value: 'flexible', label: 'Flexible budget' },
];

const DEGREE_OPTIONS = [
  { value: 'bachelors', label: 'Bachelor\'s' },
  { value: 'masters', label: 'Master\'s' },
  { value: 'phd', label: 'PhD' },
  { value: 'other', label: 'Other' },
];

const PROGRAM_TYPE_OPTIONS = [
  { value: 'masters', label: 'Master\'s' },
  { value: 'phd', label: 'PhD' },
  { value: 'mba', label: 'MBA' },
  { value: 'any', label: 'Open to any' },
];

const POPULAR_COUNTRIES = [
  'USA', 'UK', 'Canada', 'Germany', 'Australia', 'Netherlands', 'France', 'Singapore', 'Japan', 'Ireland'
];

const INTAKE_SEMESTERS: Array<{ value: IntakeSemester; label: string }> = [
  { value: 'fall', label: 'Fall' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
];

function getIntakeYears(): number[] {
  const currentYear = new Date().getFullYear();
  return [currentYear + 1, currentYear + 2, currentYear + 3];
}

export function SignupStep2Form({ onSubmit, onSkip, onBack, loading, dreamMessages }: SignupStep2FormProps) {
  const [formData, setFormData] = useState<Partial<SignupStep2Data>>({
    gpa: 3.5,
    gpaScale: 4,
    currentDegree: 'bachelors',
    tests: {
      gre: { status: 'not_started' },
      toefl: { status: 'not_started' },
      ielts: { status: 'not_started' },
    },
    budget: '40k_60k',
    targetIntake: {
      semester: 'fall',
      year: new Date().getFullYear() + 1,
    },
    dreamCountries: [],
    preferredProgramType: 'masters',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [extractedFields, setExtractedFields] = useState<ExtractedOnboardingData>({});
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);

  // Fetch prefill data from dream chat on mount
  useEffect(() => {
    async function fetchPrefill() {
      if (!dreamMessages || dreamMessages.length === 0) return;
      
      setPrefillLoading(true);
      try {
        const response = await fetch('/api/onboarding/prefill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: dreamMessages }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.prefill) {
            // Apply prefilled values
            setFormData(prev => ({
              ...prev,
              ...data.prefill,
              // Keep nested objects merged properly
              targetIntake: data.prefill.targetIntake || prev.targetIntake,
            }));
            setExtractedFields(data.extracted || {});
            setPrefillApplied(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch prefill data:', error);
      } finally {
        setPrefillLoading(false);
      }
    }
    
    fetchPrefill();
  }, [dreamMessages]);

  // Helper to check if a field was extracted from dream chat
  const isFromDreamChat = (field: keyof ExtractedOnboardingData): boolean => {
    return !!extractedFields[field];
  };

  const getFieldConfidence = (field: keyof ExtractedOnboardingData): 'high' | 'medium' | 'low' | null => {
    return extractedFields[field]?.confidence || null;
  };

  const handleGpaChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      gpa: Math.min(value, prev?.gpaScale || 4),
    }));
    setErrors(prev => ({ ...prev, gpa: '' }));
  };

  const handleGpaScaleChange = (scale: number) => {
    setFormData(prev => ({
      ...prev,
      gpaScale: scale,
      gpa: Math.min(prev?.gpa || 0, scale),
    }));
  };

  const handleTestStatusChange = (test: 'gre' | 'toefl' | 'ielts', status: TestPrepStatus) => {
    setFormData(prev => ({
      ...prev,
      tests: {
        ...prev?.tests,
        [test]: { ...prev?.tests?.[test], status },
      },
    }));
  };

  const handleCountryToggle = (country: string) => {
    setFormData(prev => {
      const currentCountries = prev?.dreamCountries || [];
      const isSelected = currentCountries.includes(country);
      
      if (isSelected) {
        return {
          ...prev,
          dreamCountries: currentCountries.filter(c => c !== country),
        };
      } else if (currentCountries.length < 3) {
        return {
          ...prev,
          dreamCountries: [...currentCountries, country],
        };
      }
      return prev; // Max 3 countries
    });
    setErrors(prev => ({ ...prev, dreamCountries: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.gpa || formData.gpa <= 0) {
      newErrors.gpa = 'Please enter your GPA';
    }
    
    if (!formData.dreamCountries || formData.dreamCountries.length === 0) {
      newErrors.dreamCountries = 'Please select at least one country';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Build complete data object with defaults
      const completeData: SignupStep2Data = {
        gpa: formData.gpa || 3.0,
        gpaScale: formData.gpaScale || 4,
        currentDegree: formData.currentDegree || 'bachelors',
        major: formData.major,
        tests: {
          gre: formData.tests?.gre || { status: 'not_started' },
          toefl: formData.tests?.toefl || { status: 'not_started' },
          ielts: formData.tests?.ielts || { status: 'not_started' },
        },
        budget: formData.budget || '40k_60k',
        targetIntake: formData.targetIntake || {
          semester: 'fall',
          year: new Date().getFullYear() + 1,
        },
        dreamCountries: formData.dreamCountries || [],
        dreamUniversities: formData.dreamUniversities,
        preferredProgramType: formData.preferredProgramType || 'masters',
      };
      onSubmit(completeData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl mb-4">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Build Your Reality</h2>
        <p className="text-sm text-gray-600 mt-2">
          Help us calculate a realistic timeline for your journey
        </p>
      </div>

      {/* Prefill Loading State */}
      {prefillLoading && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
          <span className="text-sm text-emerald-700">Extracting info from your dream chat...</span>
        </div>
      )}

      {/* Prefill Applied Notice */}
      {prefillApplied && Object.keys(extractedFields).length > 0 && !prefillLoading && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-medium text-emerald-900 text-sm">Pre-filled from your dream chat</h4>
              <p className="text-xs text-emerald-700 mt-1">
                We extracted {Object.keys(extractedFields).length} field(s) from your conversation. 
                Fields marked with ✓ are from your dream chat. Feel free to adjust them!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* GPA Section */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <GraduationCap className="h-4 w-4 text-emerald-600" />
          Current GPA
        </Label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={formData.gpaScale || 4}
              step="0.1"
              value={formData.gpa || 0}
              onChange={(e) => handleGpaChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              min="0"
              max={formData.gpaScale || 4}
              value={formData.gpa || ''}
              onChange={(e) => handleGpaChange(parseFloat(e.target.value) || 0)}
              className="w-20 text-center"
            />
            <span className="text-gray-500">/</span>
            <select
              value={formData.gpaScale || 4}
              onChange={(e) => handleGpaScaleChange(parseInt(e.target.value))}
              className="w-16 px-2 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={4}>4.0</option>
              <option value={10}>10.0</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        {errors.gpa && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.gpa}
          </p>
        )}
      </div>

      {/* Current Degree & Major */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Current Degree</Label>
          <select
            value={formData.currentDegree || 'bachelors'}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              currentDegree: e.target.value as SignupStep2Data['currentDegree']
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {DEGREE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Pursuing</Label>
          <select
            value={formData.preferredProgramType || 'masters'}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              preferredProgramType: e.target.value as SignupStep2Data['preferredProgramType']
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {PROGRAM_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Test Scores Section */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <BookOpen className="h-4 w-4 text-emerald-600" />
          Test Preparation Status
        </Label>
        <div className="space-y-3">
          {(['gre', 'toefl', 'ielts'] as const).map((test) => (
            <div key={test} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700 uppercase text-sm">{test}</span>
              <div className="flex gap-1">
                {TEST_STATUS_OPTIONS.map((opt) => {
                  const isSelected = formData.tests?.[test]?.status === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleTestStatusChange(test, opt.value)}
                      className={`px-3 py-1.5 text-xs rounded-full flex items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-600 hover:border-emerald-300'
                      }`}
                      title={opt.label}
                    >
                      <Icon className="h-3 w-3" />
                      <span className="hidden sm:inline">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          This helps us adjust your timeline based on test preparation needs
        </p>
      </div>

      {/* Target Countries */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Globe2 className="h-4 w-4 text-emerald-600" />
          Dream Countries <span className="text-gray-400 font-normal">(Select up to 3)</span>
          {isFromDreamChat('dreamCountries') && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle className="h-3 w-3" /> From dream chat
            </span>
          )}
        </Label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_COUNTRIES.map((country) => {
            const isSelected = formData.dreamCountries?.includes(country);
            const wasExtracted = isFromDreamChat('dreamCountries') && 
              (extractedFields.dreamCountries?.value as string[])?.includes(country);
            return (
              <button
                key={country}
                type="button"
                onClick={() => handleCountryToggle(country)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                  isSelected
                    ? wasExtracted 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white ring-2 ring-emerald-300 ring-offset-1'
                      : 'bg-emerald-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:border-emerald-300'
                } ${
                  !isSelected && (formData.dreamCountries?.length || 0) >= 3 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
                disabled={!isSelected && (formData.dreamCountries?.length || 0) >= 3}
              >
                {isSelected && wasExtracted && <CheckCircle className="h-3 w-3 inline mr-1" />}
                {country}
              </button>
            );
          })}
        </div>
        {errors.dreamCountries && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.dreamCountries}
          </p>
        )}
      </div>

      {/* Budget & Intake */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Wallet className="h-4 w-4 text-emerald-600" />
            Budget Range
            {isFromDreamChat('budget') && (
              <CheckCircle className="h-3 w-3 text-emerald-500 ml-auto" title="From dream chat" />
            )}
          </Label>
          <select
            value={formData.budget || '40k_60k'}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              budget: e.target.value as BudgetRange 
            }))}
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              isFromDreamChat('budget') 
                ? 'border-emerald-300 bg-emerald-50/50' 
                : 'border-gray-300'
            }`}
          >
            {BUDGET_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4 text-emerald-600" />
            Target Intake
            {isFromDreamChat('targetIntake') && (
              <CheckCircle className="h-3 w-3 text-emerald-500 ml-auto" title="From dream chat" />
            )}
          </Label>
          <div className="flex gap-2">
            <select
              value={formData.targetIntake?.semester || 'fall'}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                targetIntake: { 
                  semester: e.target.value as IntakeSemester,
                  year: prev?.targetIntake?.year || new Date().getFullYear() + 1,
                } 
              }))}
              className={`flex-1 px-3 py-2 border rounded-md text-sm ${
                isFromDreamChat('targetIntake') 
                  ? 'border-emerald-300 bg-emerald-50/50' 
                  : 'border-gray-300'
              }`}
            >
              {INTAKE_SEMESTERS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={formData.targetIntake?.year || new Date().getFullYear() + 1}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                targetIntake: { 
                  semester: prev?.targetIntake?.semester || 'fall',
                  year: parseInt(e.target.value),
                } 
              }))}
              className={`w-24 px-3 py-2 border rounded-md text-sm ${
                isFromDreamChat('targetIntake') 
                  ? 'border-emerald-300 bg-emerald-50/50' 
                  : 'border-gray-300'
              }`}
            >
              {getIntakeYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Preview */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Clock className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-medium text-emerald-900">Timeline Adjustment</h4>
            <p className="text-sm text-emerald-700 mt-1">
              Based on your test status, we&apos;ll calculate realistic dates for each milestone
              {formData.tests?.gre?.status === 'not_started' && 
                ' (GRE prep may add ~4 months)'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Skip for now
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
          >
            {loading ? 'Creating...' : 'Complete Setup'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
