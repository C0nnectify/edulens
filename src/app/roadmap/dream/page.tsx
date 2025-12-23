'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DreamModeHero } from '@/components/roadmap/DreamModeHero';
import { PlayfulRoadmap } from '@/components/roadmap/PlayfulRoadmap';
import { StageDetailSidebar } from '@/components/roadmap/StageDetailSidebar';
import { StageDetailBottomSheet } from '@/components/roadmap/StageDetailBottomSheet';
import { CompletionModal } from '@/components/roadmap/CompletionModal';
import { roadmapClient } from '@/lib/api/roadmap-client';
import type { StageConfig } from '@/types/roadmap';

export default function DreamModePage() {
  const router = useRouter();
  const [showHero, setShowHero] = useState(false);
  const [stages, setStages] = useState<StageConfig[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      return crypto.randomUUID();
    }
    return '';
  });
  const [showCompletion, setShowCompletion] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false); // Add state for bottom sheet
  const [showSidebar, setShowSidebar] = useState(true); // State for desktop sidebar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const roadmapContainerRef = useRef<HTMLDivElement>(null);

  // Load stages on mount
  useEffect(() => {
    const loadStages = async () => {
      try {
        const response = await roadmapClient.fetchStages();
        setStages(response.stages);
        setLoading(false);

        // Track roadmap opened
        await roadmapClient.trackAnalytics({
          event_type: 'roadmap_opened',
          session_id: sessionId,
        });
      } catch (err) {
        console.error('Failed to load stages:', err);
        setError('Failed to load roadmap. Please refresh the page.');
        setLoading(false);
      }
    };

    loadStages();
  }, [sessionId]);

  // Track when Dream Mode actually starts
  const handleStartDreaming = useCallback(async () => {
    setShowHero(false);
    setShowBottomSheet(true); // Open bottom sheet when starting
    await roadmapClient.trackAnalytics({
      event_type: 'dream_mode_started',
      session_id: sessionId,
    });
  }, [sessionId]);

  // Scroll to bottom when Dream Mode starts (to show Stage 1)
  useEffect(() => {
    if (!showHero) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showHero]);

  // Track stage views
  useEffect(() => {
    if (stages.length > 0 && !showHero) {
      const currentStage = stages[currentStageIndex];
      
      // Add to completed set
      setCompletedStages(prev => new Set([...prev, currentStage.id]));

      // Track analytics with debounce
      const timer = setTimeout(async () => {
        await roadmapClient.trackAnalytics({
          event_type: 'dream_stage_viewed',
          stage_id: currentStage.id,
          session_id: sessionId,
          metadata: {
            stage_order: currentStage.order,
            stage_label: currentStage.shortLabel,
          },
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentStageIndex, stages, showHero, sessionId]);

  // Check for completion
  useEffect(() => {
    if (stages.length > 0 && currentStageIndex === stages.length - 1 && completedStages.size === stages.length) {
      // User reached the last stage and has viewed all stages
      const timer = setTimeout(async () => {
        setShowCompletion(true);
        await roadmapClient.trackAnalytics({
          event_type: 'dream_mode_completed',
          session_id: sessionId,
          metadata: {
            total_stages: stages.length,
          },
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentStageIndex, completedStages, stages, sessionId]);

  // Navigation handlers
  const handlePrevious = () => {
    if (currentStageIndex > 0) {
      setCurrentStageIndex(currentStageIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStageIndex < stages.length - 1) {
      const newIndex = currentStageIndex + 1;
      setCurrentStageIndex(newIndex);
      
      // Scroll to make the new stage visible
      setTimeout(() => {
        scrollToStage(newIndex);
      }, 100);
    }
  };

  const handlePreviousWithScroll = () => {
    if (currentStageIndex > 0) {
      const newIndex = currentStageIndex - 1;
      setCurrentStageIndex(newIndex);
      
      // Scroll to make the new stage visible
      setTimeout(() => {
        scrollToStage(newIndex);
      }, 100);
    }
  };

  // Function to scroll to a specific stage
  const scrollToStage = (stageIndex: number) => {
    const totalStages = stages.length;
    const VERTICAL_SPACING = 150;
    const PADDING_TOP = 40;
    const TOTAL_HEIGHT = totalStages * VERTICAL_SPACING + PADDING_TOP * 2;
    
    // Calculate the Y position of the stage (inverted as stages go from bottom to top)
    const stageY = TOTAL_HEIGHT - (PADDING_TOP + stageIndex * VERTICAL_SPACING);
    
    // Calculate scroll position relative to the roadmap container
    if (roadmapContainerRef.current) {
      const containerRect = roadmapContainerRef.current.getBoundingClientRect();
      const containerHeight = roadmapContainerRef.current.scrollHeight;
      
      // Calculate the actual pixel position on the page
      const scrollRatio = stageY / TOTAL_HEIGHT;
      const targetScrollTop = containerRect.top + window.scrollY + (containerHeight * scrollRatio) - (window.innerHeight / 2);
      
      window.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    }
  };

  const handleStageClick = (index: number) => {
    setCurrentStageIndex(index);
    setShowBottomSheet(true); // Open bottom sheet on mobile
    setShowSidebar(true); // Open sidebar on desktop
    
    // Scroll to the clicked stage
    setTimeout(() => {
      scrollToStage(index);
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center max-w-md px-4">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  if (showHero) {
    return <DreamModeHero onStart={handleStartDreaming} />;
  }

  const currentStage = stages[currentStageIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/roadmap')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Roadmap</span>
          </Button>

          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Dream Mode
            </h1>
          </div>

          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 relative min-h-[calc(100vh-80px)]">
        <div className="flex justify-center">
          
          {/* Left: Playful Roadmap */}
          <div ref={roadmapContainerRef} className={`w-full transition-all duration-500 ease-in-out ${showSidebar ? 'lg:mr-[420px]' : ''}`}>
            <PlayfulRoadmap
              stages={stages}
              currentStageIndex={currentStageIndex}
              completedStages={completedStages}
              onStageClick={handleStageClick}
            />
          </div>

          {/* Right: Stage Details Sidebar (Desktop) */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="hidden lg:block fixed top-24 right-6 bottom-6 w-[400px] z-30"
              >
                <StageDetailSidebar 
                  stage={currentStage}
                  onNext={handleNext}
                  onPrevious={handlePreviousWithScroll}
                  hasNext={currentStageIndex < stages.length - 1}
                  hasPrevious={currentStageIndex > 0}
                  onClose={() => setShowSidebar(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile: Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
        <div className="flex gap-3">
          <Button
            onClick={handlePreviousWithScroll}
            disabled={currentStageIndex === 0}
            variant="outline"
            className="flex-1"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={currentStageIndex === stages.length - 1}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Mobile: Bottom Sheet */}
      <StageDetailBottomSheet 
        stage={currentStage} 
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
      />

      {/* Completion Modal */}
      <CompletionModal
        isOpen={showCompletion}
        onClose={() => setShowCompletion(false)}
      />

      {/* Mobile bottom padding */}
      <div className="lg:hidden h-24" />
    </div>
  );
}