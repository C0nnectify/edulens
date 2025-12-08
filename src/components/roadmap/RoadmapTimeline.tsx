'use client';

import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';
import type { StageConfig } from '@/types/roadmap';
import { StageNodeMarker } from './StageNodeMarker';
import { RocketIcon } from './RocketIcon';

interface RoadmapTimelineProps {
  stages: StageConfig[];
  currentStageIndex: number;
  completedStages: Set<string>;
  onStageClick: (index: number) => void;
}

export function RoadmapTimeline({
  stages,
  currentStageIndex,
  completedStages,
  onStageClick
}: RoadmapTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentStage = stages[currentStageIndex];

  // Auto-scroll to current stage
  useEffect(() => {
    if (timelineRef.current && currentStageIndex >= 0) {
      const stageElements = timelineRef.current.querySelectorAll('[data-stage]');
      const currentElement = stageElements[currentStageIndex] as HTMLElement;
      
      if (currentElement) {
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentStageIndex]);

  // Calculate rocket position
  const rocketPosition = currentStageIndex * (100 / (stages.length - 1));

  return (
    <div className="relative w-full py-12 bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="container mx-auto px-4">
        
        {/* Progress Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            {currentStage.fullTitle}
          </h2>
          <p className="text-slate-600">
            Stage {currentStageIndex + 1} of {stages.length}
          </p>
          <div className="mt-4 max-w-md mx-auto bg-slate-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStageIndex + 1) / stages.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          
          {/* Scrollable Timeline */}
          <div
            ref={timelineRef}
            className="overflow-x-auto pb-8 hide-scrollbar"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div className="relative min-w-max mx-auto px-8">
              
              {/* Connecting Line */}
              <div className="absolute top-6 md:top-8 left-0 right-0 h-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 rounded-full mx-8" />
              
              {/* Progress Line */}
              <motion.div
                className="absolute top-6 md:top-8 left-0 h-1 rounded-full"
                style={{
                  background: `linear-gradient(to right, ${stages[0].themeColor}, ${currentStage.themeColor})`,
                  marginLeft: '2rem'
                }}
                initial={{ width: 0 }}
                animate={{ width: `calc(${rocketPosition}% - 1rem)` }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />

              {/* Stage Nodes */}
              <div className="relative flex justify-between gap-16 md:gap-24">
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    data-stage={index}
                    className="flex-shrink-0"
                  >
                    <StageNodeMarker
                      stage={stage}
                      isActive={index === currentStageIndex}
                      isCompleted={completedStages.has(stage.id)}
                      onClick={() => onStageClick(index)}
                    />
                  </div>
                ))}
              </div>

              {/* Rocket */}
              <motion.div
                className="absolute top-0 pointer-events-none"
                style={{
                  left: `calc(${rocketPosition}% + 2rem)`,
                  transform: 'translate(-50%, -100%)',
                }}
                animate={{
                  left: `calc(${rocketPosition}% + 2rem)`,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 20,
                  mass: 1
                }}
              >
                <RocketIcon className="w-12 h-12 md:w-16 md:h-16 drop-shadow-2xl" />
              </motion.div>
            </div>
          </div>

          {/* Scroll Hint (Mobile) */}
          <div className="md:hidden text-center mt-4">
            <p className="text-xs text-slate-500">
              ← Swipe to see all stages →
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
