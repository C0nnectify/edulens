"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Bot, AlertCircle, CheckCircle, Clock, FileText, Target, Rocket, Sparkles, Loader2 } from 'lucide-react';
import { signUp, useSession } from '@/lib/auth-client';
import { hasPendingDreamData, getDreamDataSummary, migrateDreamToProfile } from '@/lib/services/profile-service';
import { SignupStep2Form } from '@/components/signup/SignupStep2Form';
import type { SignupStep2Data } from '@/types/roadmap';

type SignupStep = 'account' | 'reality';

function SignUpPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDream = searchParams.get('from') === 'dream';
  const sessionId = searchParams.get('sessionId');
  
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState<SignupStep>('account');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [migratingDream, setMigratingDream] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [step2Data, setStep2Data] = useState<SignupStep2Data | null>(null);
  const [dreamSummary, setDreamSummary] = useState<{
    originalDream: string;
    stageCount: number;
    sessionId: string;
  } | null>(null);

  // Check for pending dream data on mount
  useEffect(() => {
    if (fromDream && hasPendingDreamData()) {
      const summary = getDreamDataSummary();
      setDreamSummary(summary);
    }
  }, [fromDream]);

  // Handle dream migration after successful signup - wait for Step 2 if from dream
  useEffect(() => {
    async function handleDreamMigration() {
      // For dream flow: wait until Step 2 is completed or skipped before migrating
      if (session?.user && fromDream && hasPendingDreamData() && !migratingDream) {
        // If still on account step after auth, show Step 2
        if (currentStep === 'account') {
          setCurrentStep('reality');
          return;
        }
        
        // Only migrate when Step 2 is done (either submitted or skipped)
        if (currentStep === 'reality' && (step2Data !== null || loading)) {
          return; // Still processing Step 2
        }
        
        setMigratingDream(true);
        try {
          await migrateDreamToProfile(session.user.id, step2Data || undefined);
          router.push('/new-dashboard?welcome=true');
        } catch (err) {
          console.error('Dream migration failed:', err);
          router.push('/new-dashboard');
        }
      } else if (session?.user && !fromDream) {
        router.push('/new-dashboard');
      }
    }
    handleDreamMigration();
  }, [session, fromDream, migratingDream, router, currentStep, step2Data, loading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  // Step 2 handlers
  const handleStep2Submit = async (data: SignupStep2Data) => {
    if (!session?.user?.id) {
      setError('Session not found. Please try again.');
      return;
    }
    
    setStep2Data(data);
    setLoading(true);
    setMigratingDream(true);
    
    try {
      await migrateDreamToProfile(session.user.id, data);
      router.push('/new-dashboard?welcome=true');
    } catch (err) {
      console.error('Dream migration failed:', err);
      setError('Failed to save your data. Redirecting...');
      setLoading(false);
      setMigratingDream(false);
      // Still redirect to dashboard after error
      setTimeout(() => router.push('/new-dashboard'), 1500);
    }
  };

  const handleStep2Skip = async () => {
    if (!session?.user?.id) {
      setError('Session not found. Please try again.');
      return;
    }
    
    setLoading(true);
    setMigratingDream(true);
    
    try {
      await migrateDreamToProfile(session.user.id);
      router.push('/new-dashboard?welcome=true');
    } catch (err) {
      console.error('Dream migration failed:', err);
      setLoading(false);
      setMigratingDream(false);
      router.push('/new-dashboard');
    }
  };

  const handleStep2Back = () => {
    // Can't really go back after signup, but we can skip
    handleStep2Skip();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const result = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: fullName,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create account. Email may already be in use.');
        setLoading(false);
      }
      // If success, the useEffect will handle redirect/migration
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Show migration in progress state
  if (migratingDream) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <Rocket className="h-8 w-8 text-white animate-bounce" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-yellow-800" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Making Your Dream Real!</h2>
            <p className="text-slate-600">
              We&apos;re setting up your personalized journey with your roadmap...
            </p>
            <div className="flex items-center gap-2 text-emerald-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Creating your profile</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      fromDream 
        ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className="max-w-6xl w-full flex items-center gap-12">
        {/* Left side - Pain Point & Value Proposition */}
        <div className="hidden lg:block lg:w-1/2 space-y-8">
          <div>
            <Link href="/" className="flex items-center mb-8">
              {fromDream ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Rocket className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">EduLens</h1>
                </div>
              ) : (
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">EduLens</h1>
              )}
            </Link>

            {fromDream ? (
              <>
                {/* Dream Mode Value Proposition */}
                <div className="inline-flex items-center bg-emerald-50 border border-emerald-200 px-6 py-3 rounded-full shadow-sm mb-6">
                  <Sparkles className="w-5 h-5 text-emerald-600 mr-2" />
                  <span className="text-sm font-semibold text-emerald-700">Your roadmap is ready!</span>
                </div>

                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Time to Make Your{' '}
                  <span className="text-emerald-600">Dream Real</span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Create your account to save your personalized roadmap and start tracking your journey to study abroad success.
                </p>
              </>
            ) : (
              <>
                {/* Pain Point Badge */}
                <div className="inline-flex items-center bg-red-50 border border-red-200 px-6 py-3 rounded-full shadow-sm mb-6">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm font-semibold text-red-700">Stop the study abroad nightmare</span>
                </div>

                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Tired of{' '}
                  <span className="text-red-600">Drowning</span>{' '}
                  in Applications?
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Join thousands who chose AI over anxiety. Get your personal study abroad team
                  that works 24/7 while you focus on your dreams.
                </p>
              </>
            )}
          </div>

          {fromDream ? (
            <>
              {/* Dream Data Preview */}
              {dreamSummary && (
                <div className="bg-white/80 backdrop-blur-sm border border-emerald-200 p-6 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-2">Your Dream</h3>
                      <p className="text-sm text-gray-600 line-clamp-3 italic">
                        &quot;{dreamSummary.originalDream}&quot;
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-emerald-600 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        <span>{dreamSummary.stageCount} personalized stages created</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* What you'll get */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">What happens next:</h3>
                
                <div className="flex items-start space-x-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Save Your Roadmap</h4>
                    <p className="text-sm text-gray-600">Your personalized journey stages are preserved</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Track Progress</h4>
                    <p className="text-sm text-gray-600">Mark stages complete as you advance</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">AI Guidance</h4>
                    <p className="text-sm text-gray-600">Get help at every step of your journey</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 rounded-xl">
                <p className="text-lg font-semibold mb-2">🚀 Your dream journey starts here</p>
                <p className="text-emerald-100">Sign up to save your roadmap and begin your transformation.</p>
              </div>
            </>
          ) : (
            <>
              {/* Problem vs Solution */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">What you get instead of chaos:</h3>

                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-red-600" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-red-700 line-through mb-1">200+ hours of manual research</div>
                      <div className="text-sm font-medium text-green-700">✅ AI finds perfect matches in minutes</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-red-600" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-red-700 line-through mb-1">Generic templates that get rejected</div>
                      <div className="text-sm font-medium text-green-700">✅ Personalized documents that get accepted</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <Target className="w-4 h-4 text-red-600" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-red-700 line-through mb-1">Missed deadlines and opportunities</div>
                      <div className="text-sm font-medium text-green-700">✅ 24/7 tracking with instant alerts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Story Preview */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 rounded-xl">
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                  <span className="font-semibold text-green-800">Sarah&apos;s Success Story</span>
                </div>
                <p className="text-sm text-green-700 italic">
                  "I went from overwhelmed and confused to getting accepted to my dream university in Canada.
                  The AI agents did in 2 weeks what would have taken me 6 months.&quot;
                </p>
                <div className="mt-3 text-xs text-green-600 font-medium">
                  Got into University of Toronto • Computer Science Masters
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl">
                <p className="text-lg font-semibold mb-2">🚀 Start your success story today</p>
                <p className="text-blue-100">Your AI study team is ready to activate. No setup, no waiting.</p>
              </div>
            </>
          )}
        </div>

        {/* Right side - Sign Up Form */}
        <div className="w-full lg:w-1/2 max-w-md mx-auto">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="flex justify-center mb-4">
              {fromDream ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <Rocket className="h-4 w-4 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">EduLens</h1>
                </div>
              ) : (
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">EduLens</h1>
              )}
            </Link>
            {fromDream ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Time to Make It Real! 🚀
                </h2>
                <p className="text-sm text-gray-600">
                  Sign up to save your personalized roadmap
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Join the AI Study Revolution
                </h2>
                <p className="text-sm text-gray-600">
                  Stop struggling alone. Get your AI study team.
                </p>
              </>
            )}
          </div>

          {/* Dream Data Preview for Mobile */}
          {fromDream && dreamSummary && (
            <div className="lg:hidden mb-6 p-4 bg-white/80 border border-emerald-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-emerald-900 mb-1">Your Roadmap is Ready!</h4>
                  <p className="text-xs text-emerald-700 line-clamp-2">
                    &quot;{dreamSummary.originalDream.slice(0, 60)}...&quot;
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>{dreamSummary.stageCount} stages</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step Indicator for Dream Flow */}
          {fromDream && currentStep !== 'account' && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="w-12 h-1 bg-emerald-500 mx-1" />
                </div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 'reality' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    2
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-gray-500">
                Step {currentStep === 'reality' ? '2' : '1'} of 2
              </p>
            </div>
          )}

          {/* Step 1: Account Creation (or Step 2 if authenticated) */}
          {currentStep === 'account' ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pr-10 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pr-10 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center">{error}</div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 disabled:opacity-50 ${
                    fromDream 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                  }`}
                >
                  {fromDream ? (
                    <Rocket className="w-5 h-5 mr-2" />
                  ) : (
                    <Bot className="w-5 h-5 mr-2" />
                  )}
                  {loading 
                    ? 'Creating Account...' 
                    : fromDream 
                      ? 'Continue' 
                      : 'Get My AI Study Team'
                  }
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    href={fromDream ? `/signin?from=dream&sessionId=${sessionId}` : '/signin'}
                    className={`font-medium ${fromDream ? 'text-emerald-600 hover:text-emerald-700' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    Sign in {fromDream ? 'to continue' : 'to your AI team'}
                  </Link>
                </p>
              </div>

              <div className={`mt-6 p-4 rounded-lg ${fromDream ? 'bg-emerald-50' : 'bg-green-50'}`}>
                <p className={`text-xs text-center font-medium ${fromDream ? 'text-emerald-800' : 'text-green-800'}`}>
                  {fromDream 
                    ? '✅ Roadmap saved • ✅ Progress tracking • ✅ AI guidance'
                    : '✅ Free AI consultation • ✅ Instant activation • ✅ No credit card required'
                  }
                </p>
              </div>

              {fromDream && (
                <div className="mt-4 text-center">
                  <Link 
                    href="/dream" 
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    ← Back to dream mode
                  </Link>
                </div>
              )}

              {!fromDream && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Join 10,000+ students already using AI for study abroad success
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Step 2: Build Your Reality (only for dream flow) */
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                  {error}
                </div>
              )}
              <SignupStep2Form
                onSubmit={handleStep2Submit}
                onSkip={handleStep2Skip}
                onBack={handleStep2Back}
                loading={loading}
              />
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <SignUpPageInner />
    </Suspense>
  );
} 