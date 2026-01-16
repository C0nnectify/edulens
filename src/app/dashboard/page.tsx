'use client';

import ModernDashboardLayout from '@/components/dashboard/ModernDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import {
  FileText,
  Upload,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/signin?redirect=/dashboard');
    }
  }, [session, isPending, router]);

  if (isPending) {
    return null; // Layout handles loading state
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  const stats = [
    {
      title: 'Documents Created',
      value: '3',
      icon: FileText,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      iconBg: 'bg-blue-500/10',
    },
    {
      title: 'Applications Tracked',
      value: '5',
      icon: ClipboardList,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-emerald-500/10',
    },
    {
      title: 'Chat Sessions',
      value: '12',
      icon: MessageSquare,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      iconBg: 'bg-purple-500/10',
    },
    {
      title: 'Upload Progress',
      value: '75%',
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50',
      iconBg: 'bg-orange-500/10',
      progress: 75,
    },
  ];

  const quickActions = [
    {
      title: 'Upload Documents',
      description: 'Upload your academic documents for AI processing',
      icon: Upload,
      href: '/dashboard/document-vault',
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Build Documents',
      description: 'Create AI-powered resumes, CVs, and SOPs',
      icon: FileText,
      href: '/dashboard/document-builder',
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-500',
    },
    {
      title: 'Track Applications',
      description: 'Monitor your university application status',
      icon: ClipboardList,
      href: '/dashboard/application-tracker',
      gradient: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-500',
    },
    {
      title: 'Start Research',
      description: 'Chat with AI to research universities and programs',
      icon: MessageSquare,
      href: '/dashboard/chat',
      gradient: 'from-orange-500 to-red-600',
      iconBg: 'bg-orange-500',
    },
  ];

  const recentActivity = [
    {
      title: 'Resume generated for MIT application',
      time: '2 hours ago',
      icon: CheckCircle,
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      title: 'Application status updated for Stanford',
      time: '4 hours ago',
      icon: AlertCircle,
      gradient: 'from-blue-400 to-indigo-500',
    },
    {
      title: 'SOP created for Harvard Business School',
      time: '1 day ago',
      icon: FileText,
      gradient: 'from-purple-400 to-pink-500',
    },
    {
      title: 'Chat session: Research on Canadian universities',
      time: '2 days ago',
      icon: MessageSquare,
      gradient: 'from-orange-400 to-red-500',
    },
  ];

  const nextSteps = [
    {
      title: 'Complete your profile',
      description: 'Add work experience and skills',
      icon: Target,
      priority: 'high',
    },
    {
      title: 'Generate CV for UK universities',
      description: 'Tailored for academic programs',
      icon: FileText,
      priority: 'medium',
    },
    {
      title: 'Research scholarship opportunities',
      description: 'Use AI chat to find funding options',
      icon: Sparkles,
      priority: 'low',
    },
  ];

  return (
    <ModernDashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/50 bg-gradient-to-br from-white/80 via-white/60 to-white/40 backdrop-blur-xl p-5 sm:p-8 shadow-xl shadow-indigo-500/5">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-400/30 via-purple-400/20 to-transparent blur-3xl animate-pulse" />
            <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-400/30 via-blue-400/20 to-transparent blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-pink-400/10 to-transparent blur-3xl" />
          </div>
          
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 mb-3">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="text-xs font-semibold text-indigo-700">Dashboard Overview</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                  Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span>! 👋
                </h1>
                <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-xl">
                  Continue your study abroad journey with AI-powered tools, progress tracking, and smart recommendations.
                </p>
              </div>
              
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Today&apos;s Date</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                "group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/50 p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer",
                `bg-gradient-to-br ${stat.bgGradient}`
              )}
            >
              <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3",
                  stat.iconBg
                )}>
                  <stat.icon className={cn("h-5 w-5 sm:h-6 sm:w-6 bg-gradient-to-br bg-clip-text", stat.gradient)} style={{ color: 'transparent', backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
                  <stat.icon className={cn("h-5 w-5 sm:h-6 sm:w-6 absolute")} style={{ background: `linear-gradient(135deg, ${stat.gradient.includes('blue') ? '#3b82f6' : stat.gradient.includes('emerald') ? '#10b981' : stat.gradient.includes('purple') ? '#a855f7' : '#f97316'}, ${stat.gradient.includes('indigo') ? '#6366f1' : stat.gradient.includes('teal') ? '#14b8a6' : stat.gradient.includes('pink') ? '#ec4899' : '#ef4444'})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                
                {'progress' in stat && (
                  <div className="mt-3">
                    <div className="h-1.5 sm:h-2 w-full rounded-full bg-white/60">
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", stat.gradient)}
                        style={{ width: `${stat.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Shortcuts to your key workflows</p>
            </div>
            <Link 
              href="/dashboard/chat" 
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Ask AI Assistant
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href} className="group">
                <div className="relative h-full overflow-hidden rounded-xl sm:rounded-2xl border border-white/50 bg-white/80 backdrop-blur-sm p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1">
                  {/* Hover gradient overlay */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br",
                    action.gradient
                  )} />
                  
                  <div className="relative">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                      action.iconBg
                    )}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 group-hover:text-indigo-600 transition-colors">{action.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2">{action.description}</p>
                    
                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 group-hover:gap-3 transition-all">
                      Get Started
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity & Next Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Activity */}
          <Card className="border-white/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-gray-200/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your latest actions on the platform</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2.5">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index} 
                    className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-3 sm:px-4 py-3 hover:border-indigo-100 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className={cn(
                      "mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
                      activity.gradient
                    )}>
                      <activity.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-white/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-gray-200/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Next Steps</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Recommended actions for you</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2.5">
                {nextSteps.map((step, index) => (
                  <div 
                    key={index} 
                    className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-3 sm:px-4 py-3 hover:border-emerald-100 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className={cn(
                      "mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      step.priority === 'high' ? 'bg-gradient-to-br from-red-400 to-orange-500' :
                      step.priority === 'medium' ? 'bg-gradient-to-br from-amber-400 to-yellow-500' :
                      'bg-gradient-to-br from-emerald-400 to-teal-500'
                    )}>
                      <step.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">{step.title}</p>
                        <span className={cn(
                          "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full",
                          step.priority === 'high' ? 'bg-red-100 text-red-700' :
                          step.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        )}>
                          {step.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4 border-dashed border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-600 hover:text-emerald-700 transition-colors"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Recommendations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernDashboardLayout>
  );
} 