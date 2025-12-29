'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, GraduationCap, Sparkles, Rocket, CheckCircle2 } from 'lucide-react';
import { hasPendingDreamData, getDreamDataSummary, migrateDreamToProfile } from '@/lib/services/profile-service';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDream = searchParams.get('from') === 'dream';
  const sessionId = searchParams.get('sessionId');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [migratingDream, setMigratingDream] = useState(false);
  const [dreamSummary, setDreamSummary] = useState<{
    originalDream: string;
    stageCount: number;
    sessionId: string;
  } | null>(null);

  const { signup, user } = useAuth();

  // Check for pending dream data on mount
  useEffect(() => {
    if (fromDream && hasPendingDreamData()) {
      const summary = getDreamDataSummary();
      setDreamSummary(summary);
    }
  }, [fromDream]);

  // Handle dream migration after successful signup
  useEffect(() => {
    async function handleDreamMigration() {
      if (user && fromDream && hasPendingDreamData() && !migratingDream) {
        setMigratingDream(true);
        try {
          await migrateDreamToProfile(user.id);
          // Redirect to profile page after migration
          router.push('/profile?welcome=true');
        } catch (err) {
          console.error('Dream migration failed:', err);
          // Still redirect to dashboard even if migration fails
          router.push('/new-dashboard');
        }
      }
    }
    handleDreamMigration();
  }, [user, fromDream, migratingDream, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Skip redirect if coming from dream - we'll handle it ourselves after migration
    const success = await signup(formData.name, formData.email, formData.password, fromDream);
    if (!success) {
      setError('Failed to create account. Please try again.');
      setLoading(false);
    }
    // If success, the useEffect will handle dream migration
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Show migration in progress state
  if (migratingDream) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      fromDream 
        ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            {fromDream ? (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  EduLens
                </span>
              </div>
            ) : (
              <>
                <GraduationCap className="h-8 w-8 text-blue-600 mr-2" />
                <span className="text-2xl font-bold text-blue-600">EduLens</span>
              </>
            )}
          </div>
          
          {fromDream ? (
            <>
              <CardTitle className="text-2xl">Time to Make It Real! 🚀</CardTitle>
              <CardDescription>
                Create your account to save your personalized roadmap and start tracking your journey
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl">Create an account</CardTitle>
              <CardDescription>
                Enter your details to get started with your study abroad journey
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {/* Dream Data Preview */}
          {fromDream && dreamSummary && (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-emerald-900 mb-1">
                    Your Roadmap is Ready!
                  </h4>
                  <p className="text-xs text-emerald-700 line-clamp-2 mb-2">
                    &quot;{dreamSummary.originalDream.slice(0, 80)}...&quot;
                  </p>
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <Sparkles className="h-3 w-3" />
                    <span>{dreamSummary.stageCount} personalized stages</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className={`w-full ${fromDream ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : fromDream ? (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Start My Journey
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link 
              href={fromDream ? `/auth/signin?from=dream&sessionId=${sessionId}` : '/auth/signin'} 
              className={`hover:underline font-medium ${fromDream ? 'text-emerald-600' : 'text-blue-600'}`}
            >
              Sign in
            </Link>
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
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}