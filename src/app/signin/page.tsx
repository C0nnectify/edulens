"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Bot, Zap, Shield, Rocket, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { signIn, useSession } from '@/lib/auth-client';
import { hasPendingDreamData, getDreamDataSummary, migrateDreamToProfile } from '@/lib/services/profile-service';

function SignInPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDream = searchParams.get('from') === 'dream';
  const sessionId = searchParams.get('sessionId');
  
  const { data: session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [migratingDream, setMigratingDream] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
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

  // Handle redirect or dream migration after login
  useEffect(() => {
    async function handlePostLogin() {
      if (session?.user) {
        if (fromDream && hasPendingDreamData() && !migratingDream) {
          setMigratingDream(true);
          try {
            await migrateDreamToProfile(session.user.id);
            router.push('/profile?welcome=true');
          } catch (err) {
            console.error('Dream migration failed:', err);
            router.push('/new-dashboard');
          }
        } else if (!migratingDream) {
          const redirect = searchParams.get('redirect') || '/dashboard';
          router.push(redirect);
        }
      }
    }
    handlePostLogin();
  }, [session, router, searchParams, fromDream, migratingDream]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (result.error) {
        setError(result.error.message || 'Invalid email or password');
        setLoading(false);
      }
      // If success, the useEffect will handle redirect/migration
    } catch {
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
            <h2 className="text-xl font-bold text-slate-900">Welcome Back!</h2>
            <p className="text-slate-600">
              Adding your new roadmap to your profile...
            </p>
            <div className="flex items-center gap-2 text-emerald-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Updating your journey</span>
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
      <div className="max-w-4xl w-full flex items-center gap-12">
        {/* Left side - Value Proposition */}
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
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome Back,{' '}
                  <span className="text-emerald-600">Dreamer</span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Sign in to add your new roadmap to your existing journey.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Your AI Study Team is{' '}
                  <span className="text-blue-600">Waiting</span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Sign in to continue your journey with AI agents that work 24/7 to make your study abroad dreams reality.
                </p>
              </>
            )}
          </div>

          {fromDream && dreamSummary ? (
            <>
              {/* Dream Data Preview */}
              <div className="bg-white/80 backdrop-blur-sm border border-emerald-200 p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-2">Your New Roadmap</h3>
                    <p className="text-sm text-gray-600 line-clamp-3 italic">
                      &quot;{dreamSummary.originalDream}&quot;
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-emerald-600 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      <span>{dreamSummary.stageCount} personalized stages ready</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 rounded-xl">
                <p className="text-lg font-semibold mb-2">🚀 Continue your journey</p>
                <p className="text-emerald-100">Sign in to merge this roadmap with your existing profile.</p>
              </div>
            </>
          ) : (
            <>
              {/* AI Features Preview */}
              <div className="space-y-4">
                <div className="flex items-start space-x-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bot className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Document AI Ready</h3>
                    <p className="text-sm text-gray-600">Personalized SOPs and resumes waiting for you</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Application Tracking Active</h3>
                    <p className="text-sm text-gray-600">Your portals monitored, notifications ready</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Research Agent Standby</h3>
                    <p className="text-sm text-gray-600">University matches and insights prepared</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl">
                <p className="text-lg font-semibold mb-2">🚀 Resume from where you left off</p>
                <p className="text-blue-100">Your AI agents never sleep, never forget, always ready to help.</p>
              </div>
            </>
          )}
        </div>

        {/* Right side - Sign In Form */}
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
            <h2 className="text-2xl font-bold text-gray-900">
              {fromDream ? 'Welcome back, Dreamer!' : 'Welcome back to your AI study team'}
            </h2>
          </div>

          {/* Dream Data Preview for Mobile */}
          {fromDream && dreamSummary && (
            <div className="lg:hidden mb-6 p-4 bg-white/80 border border-emerald-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-emerald-900 mb-1">New Roadmap Ready!</h4>
                  <p className="text-xs text-emerald-700 line-clamp-2">
                    &quot;{dreamSummary.originalDream.slice(0, 60)}...&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="mt-1 focus:ring-blue-500 focus:border-blue-500"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
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
                ? 'Signing In...' 
                : fromDream 
                  ? 'Continue My Journey'
                  : 'Access Your AI Study Team'
              }
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href={fromDream ? `/signup?from=dream&sessionId=${sessionId}` : '/signup'}
                className={`font-medium ${fromDream ? 'text-emerald-600 hover:text-emerald-700' : 'text-blue-600 hover:text-blue-700'}`}
              >
                {fromDream ? 'Create account' : 'Join the AI revolution'}
              </Link>
            </p>
          </div>

          <div className={`mt-6 p-4 rounded-lg ${fromDream ? 'bg-emerald-50' : 'bg-blue-50'}`}>
            <p className={`text-xs text-center ${fromDream ? 'text-emerald-800' : 'text-blue-800'}`}>
              {fromDream 
                ? '✅ Roadmap will be saved • ✅ Progress tracked • ✅ Journey continues'
                : '✅ Your AI agents are ready • ✅ No setup required • ✅ Instant access'
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
        </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <SignInPageInner />
    </Suspense>
  );
}