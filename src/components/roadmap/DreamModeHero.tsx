'use client';

import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

interface DreamModeHeroProps {
  onStart: () => void;
}

export function DreamModeHero({ onStart }: DreamModeHeroProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Logo/Icon */}
        <div className="mb-8 inline-flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-xl opacity-50" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <Rocket className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Your Dreams Deserve
          </span>
          <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            a Clear Vision
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-700 mb-4 max-w-3xl mx-auto leading-relaxed">
          Let&apos;s travel from your first dream to your first day at your dream university
        </p>

        <p className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto">
          Discover the complete 12-stage journey from Dream → Define → Audit → Build → Explore → Prepare → Apply → Decide → Visa → Depart → Arrive → Thrive
        </p>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={onStart}
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group"
          >
            <span className="mr-3">Let&apos;s Dream</span>
            <Rocket className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="px-8 py-6 text-lg rounded-xl border-2 border-slate-300 hover:border-indigo-400 hover:bg-white/50 transition-all"
            onClick={() => {
              // Scroll to learn more or show info
              window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
            }}
          >
            Learn More
          </Button>
        </div>

        {/* Info Pills */}
        <div className="mt-12 flex flex-wrap gap-3 justify-center">
          <div className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-indigo-200 text-sm text-slate-700">
            <span className="font-semibold text-indigo-600">✓</span> No login required
          </div>
          <div className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-indigo-200 text-sm text-slate-700">
            <span className="font-semibold text-indigo-600">✓</span> 12 interactive stages
          </div>
          <div className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-indigo-200 text-sm text-slate-700">
            <span className="font-semibold text-indigo-600">✓</span> Clear actionable steps
          </div>
        </div>
      </div>
    </div>
  );
}
