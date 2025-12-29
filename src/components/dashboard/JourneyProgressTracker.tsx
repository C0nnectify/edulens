"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Circle, 
  PlayCircle,
  Rocket,
  Sparkles,
  Loader2
} from 'lucide-react';
import { fetchProfile } from '@/lib/services/profile-service';
import type { UserProfile, RoadmapStageProgress } from '@/types/profile';

interface JourneyProgressTrackerProps {
  defaultExpanded?: boolean;
  onStageClick?: (stageId: string, stageIndex: number) => void;
}

function StageIcon({ status }: { status: RoadmapStageProgress['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case 'in_progress':
      return <PlayCircle className="w-5 h-5 text-blue-500" />;
    default:
      return <Circle className="w-5 h-5 text-gray-300" />;
  }
}

export function JourneyProgressTracker({ 
  defaultExpanded = false,
  onStageClick 
}: JourneyProgressTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchProfile();
        setProfile(data);
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
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile || !profile.stagesProgress || profile.stagesProgress.length === 0) {
    return null; // Don't show if no journey data
  }

  const stages = profile.stagesProgress;
  const completedCount = stages.filter(s => s.status === 'completed').length;
  const totalCount = stages.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const currentStage = stages.find(s => s.status === 'in_progress');

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4 shadow-sm">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Your Journey</span>
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                {completedCount}/{totalCount} stages
              </span>
            </div>
            {currentStage && (
              <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-[300px]">
                Currently: {currentStage.title}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Progress bar mini */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600">{progressPercent}%</span>
          </div>
          
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100">
              {/* Progress bar full */}
              <div className="py-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{progressPercent}% Complete</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Stages list */}
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {stages.map((stage, index) => (
                  <button
                    key={stage.stageId}
                    onClick={() => onStageClick?.(stage.stageId, index)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                      stage.status === 'in_progress' 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <StageIcon status={stage.status} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        stage.status === 'completed' ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {index + 1}. {stage.title}
                      </p>
                    </div>
                    {stage.status === 'in_progress' && (
                      <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Dream info if available */}
              {profile.dreamSessionData?.originalDream && (
                <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-800">Your Original Dream</p>
                      <p className="text-xs text-amber-700 line-clamp-2 mt-0.5">
                        &quot;{profile.dreamSessionData.originalDream}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
