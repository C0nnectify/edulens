"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Bot, AlertCircle, CheckCircle, Clock, FileText, Target } from 'lucide-react';
import { signUp, useSession } from '@/lib/auth-client';

export default function SignUpPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user) {
      router.push('/new-dashboard');
    }
  }, [session, router]);

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
      } else {
        router.push('/new-dashboard');
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
      <div className="max-w-6xl w-full flex items-center gap-12">
        {/* Left side - Pain Point & Value Proposition */}
        <div className="hidden lg:block lg:w-1/2 space-y-8">
          <div>
            <Link href="/" className="flex items-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">EduLens</h1>
            </Link>

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
          </div>

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
        </div>

        {/* Right side - Sign Up Form */}
        <div className="w-full lg:w-1/2 max-w-md mx-auto">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="flex justify-center mb-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">EduLens</h1>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Join the AI Study Revolution
            </h2>
            <p className="text-sm text-gray-600">
              Stop struggling alone. Get your AI study team.
            </p>
          </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
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
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 disabled:opacity-50"
            >
              <Bot className="w-5 h-5 mr-2" />
              {loading ? 'Creating Account...' : 'Get My AI Study Team'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/signin"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in to your AI team
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-green-800 text-center font-medium">
              ✅ Free AI consultation • ✅ Instant activation • ✅ No credit card required
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Join 10,000+ students already using AI for study abroad success
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
} 