'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CloudLabelProps {
  isActive: boolean;
  isLocked: boolean;
  isCompleted: boolean;
  stageNumber: number;
  label: string;
  onClick: () => void;
  side: 'left' | 'right';
}

export function CloudLabel({
  isActive,
  isLocked,
  isCompleted,
  stageNumber,
  label,
  onClick,
  side
}: CloudLabelProps) {
  return (
    <motion.div
      className={cn(
        "absolute w-72 h-48 flex items-center justify-center cursor-pointer z-30",
        side === 'right' ? "right-[-2rem] md:right-4" : "left-[-2rem] md:left-4",
        isLocked && "opacity-80 grayscale-[0.5]"
      )}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: isActive ? [0, -8, 0] : 0
      }}
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{
        y: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        },
        default: { duration: 0.3 }
      }}
    >
      {/* Cloud SVG Background */}
      <svg viewBox="0 0 240 160" className="absolute inset-0 w-full h-full drop-shadow-xl overflow-visible">
        <defs>
          <linearGradient id={`cloudGradient-${stageNumber}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor={isActive ? "#f0f9ff" : "#f8fafc"} />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Shadow Layer for Depth (offset) */}
        <path
          d="M 65,110 C 45,110 30,95 35,75 C 35,45 65,25 95,30 C 115,15 150,15 170,35 C 195,35 210,55 200,80 C 205,105 185,120 160,120 L 65,120 Z"
          fill={isActive ? "#bae6fd" : "#cbd5e1"}
          className="translate-x-1 translate-y-1 opacity-40"
        />

        {/* Main Fluffy Cloud Shape */}
        <path 
          d="M 60,105 C 40,105 25,90 30,70 C 30,40 60,20 90,25 C 110,10 145,10 165,30 C 190,30 205,50 195,75 C 200,100 180,115 155,115 L 60,115 Z"
          fill={`url(#cloudGradient-${stageNumber})`}
          stroke={isActive ? "#0ea5e9" : isCompleted ? "#22c55e" : "#94a3b8"}
          strokeWidth={isActive ? "2.5" : "1.5"}
          strokeLinejoin="round"
          strokeLinecap="round"
          className={cn(
            "transition-all duration-300",
            isActive && "filter drop-shadow-lg"
          )}
        />
        
        {/* Soft Highlight Curve (Top Left) */}
        <path
          d="M 60,65 Q 75,35 105,35"
          fill="none"
          stroke={isActive ? "#bae6fd" : "#e2e8f0"}
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-60"
        />
        
        {/* Soft Highlight Curve (Top Right) */}
        <path
          d="M 160,40 Q 180,45 185,65"
          fill="none"
          stroke={isActive ? "#bae6fd" : "#e2e8f0"}
          strokeWidth="2"
          strokeLinecap="round"
          className="opacity-50"
        />
      </svg>

      {/* Content */}
      <div className="relative z-10 px-10 text-center pt-4 w-full flex flex-col items-center justify-center">
        <div className={cn(
          "text-[10px] font-bold uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full shadow-sm",
          isActive 
            ? "text-sky-600 bg-white" 
            : isCompleted
            ? "text-green-600 bg-white"
            : "text-slate-400 bg-slate-100"
        )}>
          Stage {stageNumber}
        </div>
        <h3 className={cn(
          "font-bold leading-tight text-base max-w-[140px] drop-shadow-sm",
          isActive ? "text-slate-800" : "text-slate-600"
        )}>
          {label}
        </h3>
      </div>
    </motion.div>
  );
}
