'use client';

import ModernDashboardLayout from '@/components/dashboard/ModernDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth-client';
import {
  FileText,
  Upload,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Calendar,
  RefreshCw,
  Rocket,
  BookOpen,
  GraduationCap,
  PlayCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Types for dashboard data
interface DashboardStats {
  documentsCreated: number;
  applicationsTracked: number;
  chatSessions: number;
  uploadProgress: number;
}

interface RecentActivity {
  id: string;
  title: string;
  time: string;
  type: 'document' | 'chat' | 'application';
  documentType: string | null;
}

interface NextStep {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  stageId?: string;
  status: string;
}

interface RoadmapInfo {
  totalStages: number;
  completedStages: number;
  currentStage?: {
    title: string;
    description: string;
  };
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  nextSteps: NextStep[];
  roadmap: RoadmapInfo | null;
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Get icon for activity type
function getActivityIcon(type: string, documentType?: string | null) {
  if (type === 'application') return ClipboardList;
  if (type === 'document') {
    if (documentType === 'sop') return FileText;
    if (documentType === 'lor') return BookOpen;
    if (documentType === 'cv' || documentType === 'resume') return GraduationCap;
    return FileText;
  }
  return MessageSquare;
}

// Get gradient for activity type
function getActivityGradient(type: string, documentType?: string | null): string {
  if (type === 'application') return 'from-purple-400 to-pink-500';
  if (type === 'document') {
    if (documentType === 'sop') return 'from-blue-400 to-indigo-500';
    if (documentType === 'lor') return 'from-violet-400 to-purple-500';
    if (documentType === 'cv' || documentType === 'resume') return 'from-emerald-400 to-teal-500';
    return 'from-blue-400 to-indigo-500';
  }
  return 'from-orange-400 to-red-500';
}

// Get icon for next step
function getStepIcon(step: NextStep) {
  if (step.id.includes('profile')) return Target;
  if (step.id.includes('document') || step.title.toLowerCase().includes('document')) return FileText;
  if (step.id.includes('application') || step.title.toLowerCase().includes('application')) return ClipboardList;
  if (step.title.toLowerCase().includes('research') || step.title.toLowerCase().includes('scholarship')) return Sparkles;
  if (step.title.toLowerCase().includes('test')) return BookOpen;
  return Rocket;
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/signin?redirect=/dashboard');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session, fetchDashboardData]);

  if (isPending) {
    return null;
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  // Use real data or defaults
  const stats = dashboardData?.stats || {
    documentsCreated: 0,
    applicationsTracked: 0,
    chatSessions: 0,
    uploadProgress: 0,
  };

  const statsConfig = [
    {
      title: 'Documents Created',
      value: stats.documentsCreated.toString(),
      icon: FileText,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      iconBg: 'bg-blue-500/10',
      href: '/dashboard/document-builder',
    },
    {
      title: 'Applications Tracked',
      value: stats.applicationsTracked.toString(),
      icon: ClipboardList,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-emerald-500/10',
      href: '/dashboard/application-tracker',
    },
    {
      title: 'Chat Sessions',
      value: stats.chatSessions.toString(),
      icon: MessageSquare,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      iconBg: 'bg-purple-500/10',
      href: '/dashboard/chat',
    },
    {
      title: 'Profile Progress',
      value: `${stats.uploadProgress}%`,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50',
      iconBg: 'bg-orange-500/10',
      progress: stats.uploadProgress,
      href: '/new-dashboard/profile',
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

  // Default activity if no real data
  const defaultActivity = [
    { id: '1', title: 'Get started by uploading documents', time: new Date().toISOString(), type: 'chat' as const, documentType: null },
  ];

  const recentActivity = dashboardData?.recentActivity?.length 
    ? dashboardData.recentActivity 
    : defaultActivity;

  // Default next steps if no real data
  const defaultNextSteps: NextStep[] = [
    { id: 'complete-profile', title: 'Complete your profile', description: 'Add your education, experience, and test scores', priority: 'high', status: 'not_started' },
    { id: 'upload-documents', title: 'Upload supporting documents', description: 'Add transcripts, certificates, and other documents', priority: 'medium', status: 'not_started' },
    { id: 'start-journey', title: 'Start your journey', description: 'Explore the Dream Mode to plan your study abroad path', priority: 'low', status: 'not_started' },
  ];

  const nextSteps = dashboardData?.nextSteps?.length 
    ? dashboardData.nextSteps 
    : defaultNextSteps;

  const roadmap = dashboardData?.roadmap;

  return (
    <ModernDashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Error Display */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/80 backdrop-blur-sm p-4 text-red-700 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchDashboardData}
              className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        )}

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
              
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchDashboardData}
                  disabled={isLoading}
                  className="h-9 w-9 text-gray-500 hover:text-indigo-600"
                  title="Refresh data"
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-gray-500 mb-1">Today&apos;s Date</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Roadmap Progress Banner */}
            {roadmap && roadmap.totalStages > 0 && (
              <Link href="/new-dashboard" className="block mt-4">
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-200/50 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Rocket className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Your Journey Progress</p>
                        <p className="text-xs text-gray-600">
                          {roadmap.completedStages} of {roadmap.totalStages} stages completed
                          {roadmap.currentStage && ` • Currently: ${roadmap.currentStage.title}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block w-32">
                        <div className="h-2 rounded-full bg-white/60">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                            style={{ width: `${(roadmap.completedStages / roadmap.totalStages) * 100}%` }}
                          />
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {statsConfig.map((stat, index) => (
            <Link key={index} href={stat.href}>
              <div
                className={cn(
                  "group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/50 p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer h-full",
                  `bg-gradient-to-br ${stat.bgGradient}`
                )}
              >
                <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  {isLoading ? (
                    <>
                      <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl mb-3" />
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </>
                  ) : (
                    <>
                      <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3", stat.iconBg)}>
                        <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                      
                      {'progress' in stat && typeof stat.progress === 'number' && (
                        <div className="mt-3">
                          <div className="h-1.5 sm:h-2 w-full rounded-full bg-white/60">
                            <div
                              className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", stat.gradient)}
                              style={{ width: `${stat.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Link>
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
              href="/new-dashboard" 
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Go to AI Journey
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href} className="group">
                <div className="relative h-full overflow-hidden rounded-xl sm:rounded-2xl border border-white/50 bg-white/80 backdrop-blur-sm p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1">
                  <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br", action.gradient)} />
                  
                  <div className="relative">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", action.iconBg)}>
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
              {isLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-12 w-12 mx-auto rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">No recent activity</p>
                  <p className="text-xs text-gray-500">Start using the platform to see your activity here</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentActivity.slice(0, 4).map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.type, activity.documentType);
                    const gradient = getActivityGradient(activity.type, activity.documentType);
                    
                    return (
                      <div 
                        key={activity.id} 
                        className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-3 sm:px-4 py-3 hover:border-indigo-100 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className={cn("mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br", gradient)}>
                          <ActivityIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(activity.time)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-white/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-gray-200/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Next Steps</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {roadmap ? 'From your journey roadmap' : 'Recommended actions for you'}
                  </CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-40 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {nextSteps.slice(0, 3).map((step) => {
                      const StepIcon = getStepIcon(step);
                      const isCompleted = step.status === 'completed';
                      const isInProgress = step.status === 'in_progress';
                      
                      return (
                        <Link 
                          key={step.id}
                          href={step.stageId ? '/new-dashboard' : '#'}
                          className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-3 sm:px-4 py-3 hover:border-emerald-100 hover:shadow-sm transition-all cursor-pointer"
                        >
                          <div className={cn(
                            "mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            isCompleted 
                              ? 'bg-gradient-to-br from-emerald-400 to-teal-500' 
                              : isInProgress
                                ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                                : step.priority === 'high' 
                                  ? 'bg-gradient-to-br from-red-400 to-orange-500' 
                                  : step.priority === 'medium' 
                                    ? 'bg-gradient-to-br from-amber-400 to-yellow-500' 
                                    : 'bg-gradient-to-br from-gray-300 to-gray-400'
                          )}>
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-white" />
                            ) : isInProgress ? (
                              <PlayCircle className="h-4 w-4 text-white" />
                            ) : (
                              <StepIcon className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={cn(
                                "text-sm font-medium transition-colors",
                                isCompleted ? 'text-gray-500 line-through' : 'text-gray-900 group-hover:text-emerald-600'
                              )}>
                                {step.title}
                              </p>
                              {!isCompleted && (
                                <span className={cn(
                                  "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full",
                                  isInProgress 
                                    ? 'bg-blue-100 text-blue-700'
                                    : step.priority === 'high' 
                                      ? 'bg-red-100 text-red-700' 
                                      : step.priority === 'medium' 
                                        ? 'bg-amber-100 text-amber-700' 
                                        : 'bg-emerald-100 text-emerald-700'
                                )}>
                                  {isInProgress ? 'In Progress' : step.priority}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                          </div>
                          {!isCompleted && (
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                  
                  <Link href="/new-dashboard">
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 border-dashed border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-600 hover:text-emerald-700 transition-colors"
                    >
                      <Rocket className="h-4 w-4 mr-2" />
                      {roadmap ? 'View Full Roadmap' : 'Start Your Journey'}
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernDashboardLayout>
  );
}
