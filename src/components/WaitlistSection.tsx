'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Rocket, Mail, Users, Star, Zap } from 'lucide-react';

const WaitlistSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Handle waitlist submission
      console.log('Waitlist email:', email);
      setIsSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 text-center relative">
        {/* Main Content */}
        <div className="mb-12">
          <div className="inline-flex items-center bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/20 mb-6">
            <Rocket className="w-5 h-5 text-orange-500 mr-2" />
            <span className="text-sm font-semibold text-gray-700">Early Access Available</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            🚀 Be the First to Try <span className="text-blue-600">Edu</span><span className="text-purple-600">Lens</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            We&apos;re launching human mentorship first — and you&apos;ll be the first to access our AI agents when they go live.
          </p>
        </div>

        {/* Waitlist Form */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 rounded-lg border-2 border-white/50 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:bg-white transition-all"
              />
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Join Waitlist
              </Button>
            </div>
          </form>
        ) : (
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-green-100 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <p className="font-semibold text-green-800">You&apos;re in! 🎉</p>
                <p className="text-sm text-green-700">We&apos;ll notify you when we launch.</p>
              </div>
            </div>
          </div>
        )}

        {/* Reassuring Message */}
        <p className="text-gray-600 mb-12">
          ✨ Early users get exclusive access, updates, and mentor priority
        </p>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Priority Access</h3>
            <p className="text-gray-600 text-sm">Be among the first 100 users to experience our platform</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Exclusive Updates</h3>
            <p className="text-gray-600 text-sm">Get insider updates on new features and AI agents</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Free Beta Access</h3>
            <p className="text-gray-600 text-sm">Use all AI agents and features for free during beta</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WaitlistSection;