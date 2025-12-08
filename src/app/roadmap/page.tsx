import type { Metadata } from 'next';
import Link from 'next/link';
import { Rocket, Target, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Study Abroad Roadmap | EduLens',
  description: 'Visualize your complete study abroad journey from dream to arrival with EduLens interactive roadmap.',
};

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Your Study Abroad Journey
          </h1>
          <p className="text-slate-600 mt-2">Choose a mode to explore your path</p>
        </div>
      </div>

      {/* Mode Selection Cards */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          
          {/* Dream Mode Card */}
          <Link href="/roadmap/dream">
            <div className="group relative bg-white rounded-2xl border-2 border-indigo-100 hover:border-indigo-400 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer overflow-hidden">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative p-8">
                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Rocket className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  Dream Mode
                </h2>

                {/* Description */}
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Understand the full journey from dream to arrival. See the complete roadmap without any pressure or data input.
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>Visual journey through 12 stages</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>No login required</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>Learn what each stage involves</span>
                  </li>
                </ul>

                {/* CTA */}
                <div className="flex items-center gap-2 text-indigo-600 font-semibold group-hover:gap-3 transition-all">
                  <span>Start Dreaming</span>
                  <Rocket className="w-4 h-4" />
                </div>

                {/* Badge */}
                <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Available Now
                </div>
              </div>
            </div>
          </Link>

          {/* Reality Mode Card (Coming Soon) */}
          <div className="relative bg-white rounded-2xl border-2 border-slate-200 opacity-60 cursor-not-allowed overflow-hidden">
            <div className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Reality Mode
              </h2>

              {/* Description */}
              <p className="text-slate-600 mb-6 leading-relaxed">
                Track your actual progress and readiness across all stages. Get personalized tasks and AI guidance based on your profile.
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span>Personalized progress tracking</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span>AI-powered readiness scores</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span>Real data and deadlines</span>
                </li>
              </ul>

              {/* Badge */}
              <div className="absolute top-4 right-4 bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
                Coming Soon
              </div>
            </div>
          </div>

          {/* Future Potential Mode Card (Coming Soon) */}
          <div className="relative bg-white rounded-2xl border-2 border-slate-200 opacity-60 cursor-not-allowed overflow-hidden">
            <div className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Future Potential Mode
              </h2>

              {/* Description */}
              <p className="text-slate-600 mb-6 leading-relaxed">
                Explore different routes and what-if scenarios. Simulate choices like different countries, fields, or timelines.
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span>Scenario simulations</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span>Compare different paths</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span>AI-powered predictions</span>
                </li>
              </ul>

              {/* Badge */}
              <div className="absolute top-4 right-4 bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
                Coming Soon
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center max-w-2xl mx-auto">
          <p className="text-slate-600 text-lg">
            Start with <span className="font-semibold text-indigo-600">Dream Mode</span> to understand the complete journey,
            then upgrade to Reality Mode when you&apos;re ready to track your real progress.
          </p>
        </div>
      </div>
    </main>
  );
}
