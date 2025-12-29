'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProfile } from '@/lib/services/profile-service';
import type { UserProfile } from '@/types/profile';
import { 
  Loader2, 
  Rocket, 
  Sparkles, 
  Target, 
  GraduationCap, 
  Calendar,
  CheckCircle2,
  Circle,
  PlayCircle,
  ArrowRight,
  Plus,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Reality! 🎉</h2>
          <p className="text-white/90">Your journey from dream to achievement starts now</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Your roadmap is saved</h4>
              <p className="text-sm text-slate-600">Track your progress through each stage</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Set your goals</h4>
              <p className="text-sm text-slate-600">Add target schools, test scores, and deadlines</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Get personalized guidance</h4>
              <p className="text-sm text-slate-600">AI-powered advice tailored to your journey</p>
            </div>
          </div>

          <Button 
            onClick={onClose}
            className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            Let&apos;s Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StageProgressCard({ profile }: { profile: UserProfile }) {
  const stages = profile.stagesProgress;
  const completedCount = stages.filter(s => s.status === 'completed').length;
  const inProgressStage = stages.find(s => s.status === 'in_progress');
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-600" />
              Your Journey Progress
            </CardTitle>
            <CardDescription>
              {completedCount} of {stages.length} stages completed
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-600">{profile.overallProgress}%</div>
            <div className="text-xs text-slate-500">Complete</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${profile.overallProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {/* Current stage highlight */}
        {inProgressStage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 mb-2">
              <PlayCircle className="w-4 h-4" />
              Currently Working On
            </div>
            <h4 className="font-semibold text-slate-900">{inProgressStage.title}</h4>
            <p className="text-sm text-slate-600 mt-1">{inProgressStage.description}</p>
          </div>
        )}

        {/* Stage list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {stages.map((stage) => (
            <div 
              key={stage.stageId}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                stage.status === 'in_progress' 
                  ? 'bg-emerald-50 border border-emerald-200' 
                  : stage.status === 'completed'
                  ? 'bg-slate-50'
                  : 'bg-white border border-slate-100'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                stage.status === 'completed' 
                  ? 'bg-emerald-500 text-white'
                  : stage.status === 'in_progress'
                  ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {stage.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : stage.status === 'in_progress' ? (
                  <PlayCircle className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${
                  stage.status === 'not_started' ? 'text-slate-400' : 'text-slate-900'
                }`}>
                  {stage.order}. {stage.title}
                </div>
              </div>
              {stage.status === 'completed' && stage.completedAt && (
                <div className="text-xs text-slate-500">
                  {new Date(stage.completedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GoalsCard({ profile }: { profile: UserProfile }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Your Goals
            </CardTitle>
            <CardDescription>
              Track your targets and milestones
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {profile.goals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-blue-400" />
            </div>
            <h4 className="font-medium text-slate-900 mb-1">No goals yet</h4>
            <p className="text-sm text-slate-500 mb-4">
              Set goals like target GRE score, schools to apply, or deadlines
            </p>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Your First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.goals.map(goal => (
              <div key={goal.id} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{goal.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    goal.status === 'achieved' 
                      ? 'bg-emerald-100 text-emerald-700'
                      : goal.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {goal.status.replace('_', ' ')}
                  </span>
                </div>
                {goal.targetValue && (
                  <div className="text-xs text-slate-500 mt-1">
                    Target: {goal.targetValue}
                    {goal.currentValue && ` • Current: ${goal.currentValue}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TargetProgramsCard({ profile }: { profile: UserProfile }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              Target Programs
            </CardTitle>
            <CardDescription>
              Schools you&apos;re aiming for
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add School
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {profile.targetPrograms.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-purple-400" />
            </div>
            <h4 className="font-medium text-slate-900 mb-1">No programs added</h4>
            <p className="text-sm text-slate-500 mb-4">
              Add universities and programs you want to apply to
            </p>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Target School
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.targetPrograms.map(program => (
              <div key={program.id} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{program.universityName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    program.priority === 'dream' 
                      ? 'bg-purple-100 text-purple-700'
                      : program.priority === 'target'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {program.priority}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {program.programName} • {program.degree.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DreamOriginCard({ profile }: { profile: UserProfile }) {
  if (!profile.dreamSessionData) return null;
  
  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Your Original Dream
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 italic">
          &quot;{profile.dreamSessionData.originalDream}&quot;
        </p>
        <div className="mt-3 text-xs text-slate-500">
          Started on {new Date(profile.dreamSessionData.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';
  
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      try {
        const data = await fetchProfile();
        setProfile(data);
        
        // Show welcome modal if coming from dream migration
        if (isWelcome && data?.createdFromDream) {
          setShowWelcome(true);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      if (!user) {
        router.push('/auth/signin');
      } else {
        loadProfile();
      }
    }
  }, [user, authLoading, router, isWelcome]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Not Found</h2>
            <p className="text-slate-600 mb-4">
              Start your journey by sharing your dream with us.
            </p>
            <Button asChild>
              <Link href="/dream">
                <Sparkles className="w-4 h-4 mr-2" />
                Start with Dream Mode
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AnimatePresence>
        {showWelcome && (
          <WelcomeModal 
            onClose={() => setShowWelcome(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/new-dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">EduLens</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user?.name}</span>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Your Journey Dashboard</h1>
          <p className="text-slate-600">Track your progress towards your study abroad goals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column - Progress */}
          <div className="lg:col-span-2 space-y-6">
            <StageProgressCard profile={profile} />
            <GoalsCard profile={profile} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TargetProgramsCard profile={profile} />
            {profile.createdFromDream && <DreamOriginCard profile={profile} />}
            
            {/* Application Season Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  Target Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.applicationSeason ? (
                  <div className="text-lg font-semibold text-slate-900">
                    {profile.applicationSeason}
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full">
                    Set Your Timeline
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
