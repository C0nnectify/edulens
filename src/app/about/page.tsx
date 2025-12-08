
import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Bot, Brain, Shield, Zap, FileText, Target, AlertCircle, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center bg-blue-50 border border-blue-200 px-6 py-3 rounded-full shadow-sm mb-6">
              <Bot className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-semibold text-blue-700">AI-First Study Abroad Platform</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              The Future of{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Study Abroad
              </span>{' '}
              is Here
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              We're revolutionizing international education with AI agents that eliminate chaos,
              reduce stress, and maximize your success rate. No more drowning in paperwork.
            </p>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl inline-block shadow-lg">
              <p className="text-lg font-semibold">AI that thinks like a counselor, works like a team</p>
            </div>
          </div>
        </section>

        {/* The Problem We're Solving */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-red-50 border border-red-200 px-6 py-3 rounded-full shadow-sm mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-sm font-semibold text-red-700">The Broken System</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why 70% of Students Give Up on Study Abroad Dreams
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                The traditional study abroad process is outdated, overwhelming, and designed to fail students.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-800 mb-3">Document Nightmare</h3>
                <p className="text-red-700">Generic templates, missed requirements, and rejection letters</p>
              </div>
              <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-800 mb-3">Tracking Chaos</h3>
                <p className="text-red-700">Missed deadlines, lost opportunities, constant anxiety</p>
              </div>
              <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-800 mb-3">Information Overload</h3>
                <p className="text-red-700">200+ hours of research, outdated data, decision paralysis</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our AI Solution */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-green-50 border border-green-200 px-6 py-3 rounded-full shadow-sm mb-6">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-semibold text-green-700">The AI Revolution</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Meet Your{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AI Study Team
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Three specialized AI agents working 24/7 to turn your study abroad dreams into reality.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              {/* Document AI */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-200">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Document AI</h3>
                <p className="text-gray-600 mb-6 text-center">
                  Creates compelling, personalized documents that get you noticed by admissions committees.
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    University-specific SOP writing
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    ATS-optimized resume building
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Academic CV formatting
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Plagiarism-free content
                  </li>
                </ul>
              </div>

              {/* Research AI */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-purple-200">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Research AI</h3>
                <p className="text-gray-600 mb-6 text-center">
                  Powered by Firecrawl MCP, analyzes thousands of programs to find your perfect matches.
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    Real-time university data scraping
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    AI-powered program matching
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    Admission probability scoring
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    Scholarship opportunity finder
                  </li>
                </ul>
              </div>

              {/* Tracker AI */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-green-200">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Tracker AI</h3>
                <p className="text-gray-600 mb-6 text-center">
                  Never miss an update with 24/7 monitoring and instant notifications via WhatsApp.
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    24/7 portal monitoring
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    Instant WhatsApp alerts
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    Predictive timeline analysis
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    Deadline management
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-6">
                Powered by Cutting-Edge Technology
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                We use the most advanced AI and web scraping technologies to give you an unfair advantage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
                <div className="flex items-center mb-4">
                  <Zap className="w-8 h-8 text-yellow-400 mr-3" />
                  <h3 className="text-2xl font-bold text-white">Firecrawl MCP</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  Advanced web scraping that monitors 500+ university portals in real-time,
                  bypassing anti-bot protection and CAPTCHA challenges.
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li>• 99.9% uptime monitoring</li>
                  <li>• Real-time data extraction</li>
                  <li>• Automatic portal adaptation</li>
                  <li>• CAPTCHA handling</li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
                <div className="flex items-center mb-4">
                  <Bot className="w-8 h-8 text-blue-400 mr-3" />
                  <h3 className="text-2xl font-bold text-white">Multi-Agent AI</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  Specialized AI agents that collaborate seamlessly to provide comprehensive
                  study abroad support from research to acceptance.
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li>• Natural language processing</li>
                  <li>• Machine learning predictions</li>
                  <li>• Personalized recommendations</li>
                  <li>• Continuous learning</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  To eliminate the chaos and stress from study abroad applications using AI technology,
                  ensuring every student has equal access to world-class guidance and support.
                </p>
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3">What Makes Us Different</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      AI-first approach, not an afterthought
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      24/7 availability vs limited consultant hours
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      Fraction of traditional consultant costs
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      Real-time data vs outdated information
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  A world where geographic and economic barriers don't limit educational opportunities.
                  Where AI democratizes access to premium guidance and every student can pursue their dreams.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 mt-1">
                      <Bot className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">AI-Powered Future</h4>
                      <p className="text-gray-600">Making world-class guidance accessible to everyone, everywhere</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 mt-1">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Student Success</h4>
                      <p className="text-gray-600">Measurable outcomes that transform dreams into acceptances</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4 mt-1">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Innovation First</h4>
                      <p className="text-gray-600">Continuously advancing technology to solve real problems</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Success Metrics */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-12">Why Students Choose EduLen AI</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold mb-2">95%</div>
                <div className="text-lg">Tracking Accuracy</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">10x</div>
                <div className="text-lg">Faster Research</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-lg">AI Support</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50+</div>
                <div className="text-lg">Countries</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
} 