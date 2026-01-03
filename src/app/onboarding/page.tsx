'use client';

/**
 * Onboarding Flow - 5-Step First-Run Wizard
 * 
 * Collects essential information from new users to create their SmartProfile
 * and generate a personalized roadmap.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe2,
  GraduationCap,
  BookOpen,
  FileText,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  Rocket,
  AlertCircle,
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';

// Types for onboarding data
interface OnboardingData {
  // Step 1: Target Countries
  targetCountries: string[];
  
  // Step 2: Degree & Timeline
  targetDegree: 'bachelors' | 'masters' | 'phd' | 'mba';
  targetSemester: 'fall' | 'spring' | 'summer';
  targetYear: number;
  
  // Step 3: Current Education
  currentDegree: 'high_school' | 'bachelors' | 'masters' | 'phd';
  currentStatus: 'completed' | 'ongoing';
  institution: string;
  major: string;
  gpa: number;
  gpaScale: number;
  expectedGraduation?: string;
  
  // Step 4: English & Tests
  englishTestStatus: 'not_taken' | 'preparing' | 'have_score';
  englishTest?: 'ielts' | 'toefl' | 'duolingo' | 'pte';
  englishScore?: string;
  englishTestDate?: string;
  greStatus: 'not_taken' | 'preparing' | 'have_score' | 'not_required';
  greScore?: string;
  gmatStatus?: 'not_taken' | 'preparing' | 'have_score' | 'not_required';
  gmatScore?: string;
  
  // Step 5: Funding
  budgetMin: number;
  budgetMax: number;
  fundingSources: string[];
}

const COUNTRIES = [
  { code: 'USA', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
  { code: 'DEU', name: 'Germany', flag: '🇩🇪' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { code: 'NLD', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'FRA', name: 'France', flag: '🇫🇷' },
  { code: 'SGP', name: 'Singapore', flag: '🇸🇬' },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵' },
  { code: 'IRL', name: 'Ireland', flag: '🇮🇪' },
  { code: 'SWE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'OTHER', name: 'Other', flag: '🌍' },
];

const DEGREES = [
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
  { value: 'phd', label: 'PhD' },
  { value: 'mba', label: 'MBA' },
];

const SEMESTERS = [
  { value: 'fall', label: 'Fall' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
];

const FUNDING_OPTIONS = [
  { value: 'family', label: 'Family Funding' },
  { value: 'scholarship', label: 'Need Scholarship' },
  { value: 'loan', label: 'Willing to Take Loan' },
  { value: 'savings', label: 'Personal Savings' },
  { value: 'assistantship', label: 'TA/RA Assistantship' },
  { value: 'employer', label: 'Employer Sponsorship' },
];

function getYears(): number[] {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear + 1, currentYear + 2, currentYear + 3];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [data, setData] = useState<Partial<OnboardingData>>({
    targetCountries: [],
    targetDegree: 'masters',
    targetSemester: 'fall',
    targetYear: new Date().getFullYear() + 1,
    currentDegree: 'bachelors',
    currentStatus: 'ongoing',
    institution: '',
    major: '',
    gpa: 3.5,
    gpaScale: 4.0,
    englishTestStatus: 'not_taken',
    greStatus: 'not_taken',
    budgetMin: 20000,
    budgetMax: 60000,
    fundingSources: [],
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/signin?redirect=/onboarding');
    }
  }, [session, isPending, router]);

  // Check if user already has profile
  useEffect(() => {
    async function checkProfile() {
      if (session?.user?.id) {
        try {
          const res = await fetch('/api/smart-profile');
          if (res.ok) {
            const profile = await res.json();
            if (profile && profile.profile_completeness > 20) {
              // User already has substantial profile, skip to dashboard
              router.push('/new-dashboard');
            }
          }
        } catch {
          // No profile, continue with onboarding
        }
      }
    }
    checkProfile();
  }, [session, router]);

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = (): boolean => {
    setError(null);
    
    switch (currentStep) {
      case 1:
        if (!data.targetCountries || data.targetCountries.length === 0) {
          setError('Please select at least one target country');
          return false;
        }
        return true;
      case 2:
        if (!data.targetDegree || !data.targetSemester || !data.targetYear) {
          setError('Please complete all fields');
          return false;
        }
        return true;
      case 3:
        if (!data.institution || !data.major) {
          setError('Please fill in your institution and major');
          return false;
        }
        if (!data.gpa || data.gpa <= 0) {
          setError('Please enter a valid GPA');
          return false;
        }
        return true;
      case 4:
        return true; // Optional step
      case 5:
        if (!data.fundingSources || data.fundingSources.length === 0) {
          setError('Please select at least one funding source');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Create SmartProfile from onboarding data
      const profileData = transformToSmartProfile(data);
      
      const response = await fetch('/api/smart-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }

      // Trigger roadmap generation
      await fetch('/api/smart-profile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: 'to_roadmap' }),
      });

      // Navigate to dashboard with welcome flag
      router.push('/new-dashboard?welcome=true&from=onboarding');
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const transformToSmartProfile = (onboardingData: Partial<OnboardingData>) => {
    return {
      personal_info: {
        first_name: session?.user?.name?.split(' ')[0] || '',
        last_name: session?.user?.name?.split(' ').slice(1).join(' ') || '',
      },
      contact_info: {
        email: session?.user?.email || '',
      },
      education: [{
        degree_type: onboardingData.currentDegree,
        institution_name: onboardingData.institution,
        field_of_study: onboardingData.major,
        gpa: onboardingData.gpa,
        gpa_scale: onboardingData.gpaScale,
        status: onboardingData.currentStatus,
        expected_graduation: onboardingData.expectedGraduation,
      }],
      test_scores: {
        english: onboardingData.englishTestStatus === 'have_score' ? {
          test_type: onboardingData.englishTest,
          overall_score: onboardingData.englishScore ? parseFloat(onboardingData.englishScore) : undefined,
          test_date: onboardingData.englishTestDate,
        } : undefined,
        gre: onboardingData.greStatus === 'have_score' ? {
          total_score: onboardingData.greScore ? parseInt(onboardingData.greScore) : undefined,
        } : undefined,
        gmat: onboardingData.gmatStatus === 'have_score' ? {
          total_score: onboardingData.gmatScore ? parseInt(onboardingData.gmatScore) : undefined,
        } : undefined,
      },
      application_goals: {
        target_degree: onboardingData.targetDegree,
        target_countries: onboardingData.targetCountries,
        target_intake: {
          semester: onboardingData.targetSemester,
          year: onboardingData.targetYear,
        },
        field_of_interest: onboardingData.major,
      },
      financial_details: {
        budget_range: {
          min: onboardingData.budgetMin,
          max: onboardingData.budgetMax,
          currency: 'USD',
        },
        funding_sources: onboardingData.fundingSources,
        need_scholarship: onboardingData.fundingSources?.includes('scholarship'),
      },
    };
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Progress Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Welcome to EduLens</h1>
                <p className="text-sm text-slate-400">Step {currentStep} of 5</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/new-dashboard')}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Skip for now
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  step <= currentStep
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-500'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <Step1Countries
              key="step1"
              selected={data.targetCountries || []}
              onChange={(countries) => setData({ ...data, targetCountries: countries })}
            />
          )}
          
          {currentStep === 2 && (
            <Step2Degree
              key="step2"
              data={data}
              onChange={(updates) => setData({ ...data, ...updates })}
            />
          )}
          
          {currentStep === 3 && (
            <Step3Education
              key="step3"
              data={data}
              onChange={(updates) => setData({ ...data, ...updates })}
            />
          )}
          
          {currentStep === 4 && (
            <Step4Tests
              key="step4"
              data={data}
              onChange={(updates) => setData({ ...data, ...updates })}
            />
          )}
          
          {currentStep === 5 && (
            <Step5Funding
              key="step5"
              data={data}
              onChange={(updates) => setData({ ...data, ...updates })}
            />
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Start My Journey
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Target Countries
function Step1Countries({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (countries: string[]) => void;
}) {
  const toggleCountry = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter(c => c !== code));
    } else if (selected.length < 5) {
      onChange([...selected, code]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
          <Globe2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Where do you want to study?</h2>
        <p className="text-slate-400">Select up to 5 countries (selected: {selected.length}/5)</p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {COUNTRIES.map((country) => {
          const isSelected = selected.includes(country.code);
          return (
            <button
              key={country.code}
              onClick={() => toggleCountry(country.code)}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="text-3xl mb-2">{country.flag}</div>
              <div className={`text-sm font-medium ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>
                {country.name}
              </div>
              {isSelected && (
                <Check className="w-4 h-4 text-emerald-400 mx-auto mt-2" />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// Step 2: Target Degree & Timeline
function Step2Degree({
  data,
  onChange,
}: {
  data: Partial<OnboardingData>;
  onChange: (updates: Partial<OnboardingData>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">What degree are you targeting?</h2>
        <p className="text-slate-400">Select your target program and timeline</p>
      </div>

      <div className="space-y-6">
        {/* Degree Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Degree Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DEGREES.map((degree) => (
              <button
                key={degree.value}
                onClick={() => onChange({ targetDegree: degree.value as OnboardingData['targetDegree'] })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  data.targetDegree === degree.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <span className={`font-medium ${data.targetDegree === degree.value ? 'text-purple-400' : 'text-slate-300'}`}>
                  {degree.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Target Semester</label>
            <div className="space-y-2">
              {SEMESTERS.map((sem) => (
                <button
                  key={sem.value}
                  onClick={() => onChange({ targetSemester: sem.value as OnboardingData['targetSemester'] })}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    data.targetSemester === sem.value
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <span className={data.targetSemester === sem.value ? 'text-purple-400' : 'text-slate-300'}>
                    {sem.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Target Year</label>
            <div className="space-y-2">
              {getYears().map((year) => (
                <button
                  key={year}
                  onClick={() => onChange({ targetYear: year })}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    data.targetYear === year
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <span className={data.targetYear === year ? 'text-purple-400' : 'text-slate-300'}>
                    {year}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Step 3: Current Education
function Step3Education({
  data,
  onChange,
}: {
  data: Partial<OnboardingData>;
  onChange: (updates: Partial<OnboardingData>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your current education</h2>
        <p className="text-slate-400">Tell us about your academic background</p>
      </div>

      <div className="space-y-5">
        {/* Current Degree Level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Current Level</label>
            <select
              value={data.currentDegree}
              onChange={(e) => onChange({ currentDegree: e.target.value as OnboardingData['currentDegree'] })}
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="high_school">High School</option>
              <option value="bachelors">Bachelor&apos;s</option>
              <option value="masters">Master&apos;s</option>
              <option value="phd">PhD</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={data.currentStatus}
              onChange={(e) => onChange({ currentStatus: e.target.value as OnboardingData['currentStatus'] })}
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Institution */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Institution Name</label>
          <input
            type="text"
            value={data.institution || ''}
            onChange={(e) => onChange({ institution: e.target.value })}
            placeholder="e.g., BUET, Stanford University"
            className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Major */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Field of Study / Major</label>
          <input
            type="text"
            value={data.major || ''}
            onChange={(e) => onChange({ major: e.target.value })}
            placeholder="e.g., Computer Science, Electrical Engineering"
            className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* GPA */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">GPA</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={data.gpaScale || 4}
              value={data.gpa || ''}
              onChange={(e) => onChange({ gpa: parseFloat(e.target.value) || 0 })}
              placeholder="3.75"
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Scale</label>
            <select
              value={data.gpaScale}
              onChange={(e) => onChange({ gpaScale: parseFloat(e.target.value) })}
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value={4.0}>4.0</option>
              <option value={5.0}>5.0</option>
              <option value={10.0}>10.0</option>
              <option value={100.0}>100</option>
            </select>
          </div>
        </div>

        {/* Expected Graduation (if ongoing) */}
        {data.currentStatus === 'ongoing' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Expected Graduation</label>
            <input
              type="month"
              value={data.expectedGraduation || ''}
              onChange={(e) => onChange({ expectedGraduation: e.target.value })}
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Step 4: Tests & English Proficiency
function Step4Tests({
  data,
  onChange,
}: {
  data: Partial<OnboardingData>;
  onChange: (updates: Partial<OnboardingData>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Test Scores</h2>
        <p className="text-slate-400">Tell us about your English and standardized test status</p>
      </div>

      <div className="space-y-6">
        {/* English Test */}
        <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">English Proficiency</h3>
          
          <div className="space-y-3 mb-4">
            {[
              { value: 'not_taken', label: "Haven't taken any test yet" },
              { value: 'preparing', label: 'Preparing for test' },
              { value: 'have_score', label: 'Already have score' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => onChange({ englishTestStatus: option.value as OnboardingData['englishTestStatus'] })}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                  data.englishTestStatus === option.value
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  data.englishTestStatus === option.value ? 'border-orange-500 bg-orange-500' : 'border-slate-500'
                }`}>
                  {data.englishTestStatus === option.value && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={data.englishTestStatus === option.value ? 'text-orange-400' : 'text-slate-300'}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          {/* Score input if have_score */}
          {data.englishTestStatus === 'have_score' && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Test Type</label>
                <select
                  value={data.englishTest || ''}
                  onChange={(e) => onChange({ englishTest: e.target.value as OnboardingData['englishTest'] })}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                >
                  <option value="">Select</option>
                  <option value="ielts">IELTS</option>
                  <option value="toefl">TOEFL</option>
                  <option value="duolingo">Duolingo</option>
                  <option value="pte">PTE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Score</label>
                <input
                  type="text"
                  value={data.englishScore || ''}
                  onChange={(e) => onChange({ englishScore: e.target.value })}
                  placeholder="7.5"
                  className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Test Date</label>
                <input
                  type="month"
                  value={data.englishTestDate || ''}
                  onChange={(e) => onChange({ englishTestDate: e.target.value })}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* GRE */}
        <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">GRE</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'not_taken', label: 'Not taken' },
              { value: 'preparing', label: 'Preparing' },
              { value: 'have_score', label: 'Have score' },
              { value: 'not_required', label: 'Not required' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => onChange({ greStatus: option.value as OnboardingData['greStatus'] })}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  data.greStatus === option.value
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <span className={`text-sm ${data.greStatus === option.value ? 'text-orange-400' : 'text-slate-300'}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          {data.greStatus === 'have_score' && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <label className="block text-xs text-slate-400 mb-1">Total Score (260-340)</label>
              <input
                type="number"
                min="260"
                max="340"
                value={data.greScore || ''}
                onChange={(e) => onChange({ greScore: e.target.value })}
                placeholder="320"
                className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Step 5: Funding
function Step5Funding({
  data,
  onChange,
}: {
  data: Partial<OnboardingData>;
  onChange: (updates: Partial<OnboardingData>) => void;
}) {
  const toggleFunding = (source: string) => {
    const current = data.fundingSources || [];
    if (current.includes(source)) {
      onChange({ fundingSources: current.filter(f => f !== source) });
    } else {
      onChange({ fundingSources: [...current, source] });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mb-4">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Funding Situation</h2>
        <p className="text-slate-400">Help us understand your budget and funding options</p>
      </div>

      <div className="space-y-6">
        {/* Budget Range */}
        <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Available Budget (per year)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Minimum ($)</label>
              <input
                type="number"
                step="5000"
                min="0"
                value={data.budgetMin || ''}
                onChange={(e) => onChange({ budgetMin: parseInt(e.target.value) || 0 })}
                placeholder="20000"
                className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">Maximum ($)</label>
              <input
                type="number"
                step="5000"
                min="0"
                value={data.budgetMax || ''}
                onChange={(e) => onChange({ budgetMax: parseInt(e.target.value) || 0 })}
                placeholder="60000"
                className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              />
            </div>
          </div>
          
          <p className="text-xs text-slate-500 mt-2">
            Budget range: ${(data.budgetMin || 0).toLocaleString()} - ${(data.budgetMax || 0).toLocaleString()} per year
          </p>
        </div>

        {/* Funding Sources */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Funding Sources</h3>
          <div className="grid grid-cols-2 gap-3">
            {FUNDING_OPTIONS.map((option) => {
              const isSelected = data.fundingSources?.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleFunding(option.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={isSelected ? 'text-emerald-400' : 'text-slate-300'}>
                      {option.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Almost there!</h3>
          </div>
          <p className="text-slate-300 text-sm">
            Click &quot;Start My Journey&quot; to create your personalized roadmap and get AI-powered guidance
            for your study abroad journey.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
