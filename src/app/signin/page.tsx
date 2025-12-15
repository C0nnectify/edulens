"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Bot, Zap, Shield } from 'lucide-react';
import { signIn, useSession } from '@/lib/auth-client';

function SignInPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }, [session, router, searchParams]);

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
      } else {
        const redirect = searchParams.get('redirect') || '/dashboard';
        router.push(redirect);
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full flex items-center gap-12">
        {/* Left side - Value Proposition */}
        <div className="hidden lg:block lg:w-1/2 space-y-8">
          <div>
            <Link href="/" className="flex items-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">EduLens</h1>
            </Link>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your AI Study Team is{' '}
              <span className="text-blue-600">Waiting</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Sign in to continue your journey with AI agents that work 24/7 to make your study abroad dreams reality.
            </p>
          </div>

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
        </div>

        {/* Right side - Sign In Form */}
        <div className="w-full lg:w-1/2 max-w-md mx-auto">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="flex justify-center mb-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">EduLens</h1>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back to your AI study team
            </h2>
          </div>

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
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 disabled:opacity-50"
            >
              <Bot className="w-5 h-5 mr-2" />
              {loading ? 'Signing In...' : 'Access Your AI Study Team'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Join the AI revolution
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              ✅ Your AI agents are ready • ✅ No setup required • ✅ Instant access
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <SignInPageInner />
    </Suspense>
  );
}