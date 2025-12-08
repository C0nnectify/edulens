'use client';

import { motion } from 'framer-motion';
import { Plane, Cloud, CheckCircle2, Lock } from 'lucide-react';
import { CloudLabel } from './CloudLabel';
import type { StageConfig } from '@/types/roadmap';
import { cn } from '@/lib/utils';

interface PlayfulRoadmapProps {
  stages: StageConfig[];
  currentStageIndex: number;
  completedStages: Set<string>;
  onStageClick: (index: number) => void;
}

export function PlayfulRoadmap({
  stages,
  currentStageIndex,
  completedStages,
  onStageClick
}: PlayfulRoadmapProps) {
  // Configuration for the road (SVG Coordinate System)
  const VIEWBOX_WIDTH = 700;
  const CENTER_X = VIEWBOX_WIDTH / 2;
  const VERTICAL_SPACING = 150;
  const AMPLITUDE = 100; 
  const PADDING_TOP = 40;
  const TOTAL_HEIGHT = stages.length * VERTICAL_SPACING + PADDING_TOP * 2;

  // Generate path points
  const points = stages.map((_, index) => {
    // Invert Y: Start from bottom (Stage 1 at bottom)
    const y = TOTAL_HEIGHT - (PADDING_TOP + index * VERTICAL_SPACING);
    const isEven = index % 2 === 0;
    const x = CENTER_X + (isEven ? -AMPLITUDE : AMPLITUDE);
    return { x, y };
  });

  // Generate SVG Path
  const generatePath = () => {
    if (points.length === 0) return '';
    
    // Start from bottom center
    let path = `M ${CENTER_X} ${TOTAL_HEIGHT - 20}`; 
    
    // Curve to first point (which is at the bottom)
    path += ` C ${CENTER_X} ${points[0].y + 50}, ${points[0].x} ${points[0].y + 50}, ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midY = (current.y + next.y) / 2;
      
      // Cubic bezier for smooth connection
      path += ` C ${current.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y}`;
    }

    return path;
  };

  const pathData = generatePath();
  const currentPoint = points[currentStageIndex] || { x: CENTER_X, y: 0 };

  return (
    <div className="w-full py-8 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg border border-sky-100 mb-4 pointer-events-auto"
          >
            <span className="text-sky-600 font-bold text-base">
              Stage {currentStageIndex + 1}
            </span>
            <span className="text-slate-400 mx-2 text-sm">/</span>
            <span className="text-slate-600 font-medium text-sm">
              {stages.length} Stages
            </span>
          </motion.div>
        </div>

        {/* Road Container */}
        <div className="relative max-w-3xl mx-auto">
          <svg 
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${TOTAL_HEIGHT}`}
            className="w-full h-auto overflow-visible"
            style={{ pointerEvents: 'none' }}
          >
            {/* Flight Path (Dashed) */}
            <path
              d={pathData}
              fill="none"
              stroke="#bae6fd" // sky-200
              strokeWidth="4"
              strokeDasharray="12 12"
              strokeLinecap="round"
              className="drop-shadow-md"
            />
          </svg>

          {/* Plane Animation */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute z-20"
              style={{
                left: `${(currentPoint.x / VIEWBOX_WIDTH) * 100}%`,
                top: `${(currentPoint.y / TOTAL_HEIGHT) * 100}%`,
              }}
              animate={{
                left: `${(currentPoint.x / VIEWBOX_WIDTH) * 100}%`,
                top: `${(currentPoint.y / TOTAL_HEIGHT) * 100}%`,
              }}
              transition={{
                type: "spring",
                stiffness: 50,
                damping: 20,
                mass: 1
              }}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                {/* Plane Icon */}
                <div className="w-14 h-14 bg-white rounded-full shadow-xl border-2 border-sky-400 flex items-center justify-center transform -rotate-45 z-30">
                  <Plane className="w-8 h-8 text-sky-600 transform rotate-45" />
                </div>
              </div>
            </motion.div>

            {/* Stage Nodes */}
            {points.map((point, index) => {
              const stage = stages[index];
              const isActive = index === currentStageIndex;
              const isCompleted = completedStages.has(stage.id) || index < currentStageIndex;
              const isLocked = !isCompleted && !isActive;

              return (
                <motion.div
                  key={stage.id}
                  className="absolute z-10 pointer-events-auto"
                  style={{ 
                    left: `${(point.x / VIEWBOX_WIDTH) * 100}%`, 
                    top: `${(point.y / TOTAL_HEIGHT) * 100}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="relative -translate-x-1/2 -translate-y-1/2 flex items-center group">
                    {/* Cloud Label (Alternating sides) */}
                    <CloudLabel
                      isActive={isActive}
                      isLocked={isLocked}
                      isCompleted={isCompleted}
                      stageNumber={index + 1}
                      label={stage.shortLabel}
                      onClick={() => onStageClick(index)}
                      side={index % 2 === 0 ? 'right' : 'left'}
                    />

                    {/* Node Cloud */}
                    <button
                      onClick={() => onStageClick(index)}
                      className={cn(
                        "relative w-24 h-16 flex items-center justify-center transition-all duration-300 z-20 group-hover:scale-110",
                        isActive ? "scale-110" : ""
                      )}
                    >
                      <Cloud 
                        className={cn(
                          "w-full h-full absolute inset-0 drop-shadow-md transition-colors duration-300",
                          isActive ? "text-sky-500 fill-sky-100" : 
                          isCompleted ? "text-green-500 fill-green-50" : "text-slate-300 fill-slate-50"
                        )} 
                        strokeWidth={1.5}
                      />
                      
                      <div className="relative z-10 flex items-center justify-center">
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : isActive ? (
                          <span className="text-sky-700 font-bold text-xl">{index + 1}</span>
                        ) : (
                          <Lock className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      
                      {/* Pulse effect for active stage */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-sky-400 animate-ping opacity-20 scale-75" />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
