'use client';

import { motion } from 'framer-motion';
import type { StageConfig } from '@/types/roadmap';

interface StageNodeMarkerProps {
  stage: StageConfig;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

export function StageNodeMarker({ stage, isActive, isCompleted, onClick }: StageNodeMarkerProps) {
  return (
    <motion.button
      onClick={onClick}
      className="relative flex flex-col items-center group focus:outline-none"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Node Circle */}
      <motion.div
        className={`
          relative w-12 h-12 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center
          transition-all duration-300 cursor-pointer
          ${isActive
            ? 'border-white shadow-2xl scale-110'
            : isCompleted
            ? 'border-white/80 shadow-lg'
            : 'border-white/50 shadow'
          }
        `}
        style={{
          backgroundColor: isActive || isCompleted ? stage.themeColor : '#e2e8f0'
        }}
        animate={isActive ? {
          boxShadow: [
            `0 0 0 0 ${stage.themeColor}40`,
            `0 0 0 10px ${stage.themeColor}00`,
          ]
        } : {}}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      >
        {/* Stage Number */}
        <span className={`
          text-sm md:text-lg font-bold
          ${isActive || isCompleted ? 'text-white' : 'text-slate-400'}
        `}>
          {stage.order}
        </span>

        {/* Completion Checkmark */}
        {isCompleted && !isActive && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </motion.div>

      {/* Label */}
      <motion.div
        className="mt-2 md:mt-3 text-center"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: stage.order * 0.05 }}
      >
        <span className={`
          text-xs md:text-sm font-semibold block whitespace-nowrap
          ${isActive ? 'text-slate-900' : 'text-slate-600'}
        `}>
          {stage.shortLabel}
        </span>
        {isActive && (
          <motion.div
            className="h-1 rounded-full mt-1"
            style={{ backgroundColor: stage.themeColor }}
            layoutId="activeIndicator"
          />
        )}
      </motion.div>

      {/* Tooltip on Hover */}
      <div className="absolute top-full mt-4 hidden group-hover:block z-50 pointer-events-none">
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl">
          {stage.fullTitle}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900" />
        </div>
      </div>
    </motion.button>
  );
}
