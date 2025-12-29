"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  PlayCircle,
  Rocket,
  Sparkles,
  Target,
  Clock,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  FileText,
  Search,
  Send,
  BookOpen,
  Building,
  Plane,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchProfile } from '@/lib/services/profile-service';
import type { UserProfile, RoadmapStageProgress } from '@/types/profile';

// Stage icons mapping
const stageIcons: Record<string, typeof Rocket> = {
  'Self-Assessment': Target,
  'Goal Setting': Target,
  'Academic': BookOpen,
  'Test': FileText,
  'Research': Search,
  'Program': GraduationCap,
  'Application': FileText,
  'Materials': FileText,
  'Financial': Building,
  'Visa': Plane,
  'Pre-Departure': Plane,
  'Arrival': Rocket,
};

function getStageIcon(title: string) {
  for (const [key, Icon] of Object.entries(stageIcons)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return Icon;
    }
  }
  return Circle;
}

function StageStatusBadge({ status }: { status: RoadmapStageProgress['status'] }) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          <PlayCircle className="w-3 h-3" />
          In Progress
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
          <Circle className="w-3 h-3" />
          Not Started
        </span>
      );
  }
}

interface FullPageJourneyProps {
  onStartChat?: (context?: string) => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function FullPageJourney({ onStartChat, sidebarOpen, onToggleSidebar }: FullPageJourneyProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchProfile();
        setProfile(data);
        // Auto-expand the current in-progress stage
        if (data?.stagesProgress) {
          const inProgress = data.stagesProgress.find(s => s.status === 'in_progress');
          if (inProgress) {
            setExpandedStage(inProgress.stageId);
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!profile || !profile.stagesProgress || profile.stagesProgress.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your Journey</h2>
          <p className="text-gray-600 mb-6">
            Tell us about your study abroad dream and we&apos;ll create a personalized roadmap for you.
          </p>
          <Link href="/dream">
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              <Sparkles className="w-4 h-4 mr-2" />
              Start Dream Mode
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const stages = profile.stagesProgress;
  const completedCount = stages.filter(s => s.status === 'completed').length;
  const totalCount = stages.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const currentStage = stages.find(s => s.status === 'in_progress');

  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && onToggleSidebar && (
                <button 
                  onClick={onToggleSidebar}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                >
                  <Menu size={20} />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Your Journey</h1>
                  <p className="text-sm text-gray-500">{completedCount} of {totalCount} stages completed</p>
                </div>
              </div>
            </div>
            
            {/* Progress Circle */}
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${progressPercent * 1.51} 151`}
                    className="text-emerald-500 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900">{progressPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dream Summary */}
      {profile.dreamSessionData?.originalDream && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Your Original Dream</p>
                <p className="text-sm text-amber-700 mt-1">
                  &quot;{profile.dreamSessionData.originalDream}&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stages List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const StageIcon = getStageIcon(stage.title);
              const isExpanded = expandedStage === stage.stageId;
              const isActive = stage.status === 'in_progress';
              const isCompleted = stage.status === 'completed';
              
              return (
                <motion.div
                  key={stage.stageId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-xl border transition-all duration-200 ${
                    isActive 
                      ? 'border-blue-200 shadow-lg shadow-blue-100/50 ring-2 ring-blue-100' 
                      : isCompleted
                        ? 'border-emerald-200'
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Stage Header */}
                  <button
                    onClick={() => setExpandedStage(isExpanded ? null : stage.stageId)}
                    className="w-full p-5 flex items-center gap-4 text-left"
                  >
                    {/* Stage Number & Icon */}
                    <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : isActive 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      <StageIcon className="w-6 h-6" />
                      <span className={`absolute -top-1 -left-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-emerald-500 text-white' 
                          : isActive 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-300 text-white'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                    
                    {/* Stage Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`font-semibold ${
                          isCompleted ? 'text-emerald-900' : isActive ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {stage.title}
                        </h3>
                        <StageStatusBadge status={stage.status} />
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{stage.description}</p>
                    </div>
                    
                    {/* Expand Icon */}
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                          {/* Description */}
                          <p className="text-gray-600 mb-4">{stage.description}</p>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3">
                            <Button
                              onClick={() => onStartChat?.(`Help me with stage: ${stage.title}`)}
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Get AI Help
                            </Button>
                            
                            {isActive && (
                              <Button
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Mark Complete
                              </Button>
                            )}
                            
                            {!isActive && !isCompleted && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-gray-600"
                              >
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Start This Stage
                              </Button>
                            )}
                          </div>
                          
                          {/* Timestamps if available */}
                          {(stage.startedAt || stage.completedAt) && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
                              {stage.startedAt && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Started: {new Date(stage.startedAt).toLocaleDateString()}
                                </div>
                              )}
                              {stage.completedAt && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Completed: {new Date(stage.completedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Next:</span> {currentStage?.title || stages[0]?.title}
          </div>
          <Button
            onClick={() => onStartChat?.()}
            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Ask AI for Help
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
