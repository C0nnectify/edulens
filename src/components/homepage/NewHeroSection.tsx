'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, Target, Award, Globe, FileCheck, Sparkles } from 'lucide-react';
import { motion, useInView, useMotionValue, animate, AnimatePresence } from 'framer-motion';

// --- Utility Components ---

const AnimatedCounter = ({ 
  end, 
  duration = 1.5, 
  prefix = '', 
  suffix = '',
  label = ''
}: { 
  end: number; 
  duration?: number; 
  prefix?: string; 
  suffix?: string;
  label?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, end, {
        duration: duration,
        ease: "circOut",
        onUpdate: (latest) => setDisplayValue(Math.round(latest))
      });
      return controls.stop;
    }
  }, [isInView, end, duration, count]);

  return (
    <span ref={ref} className="tabular-nums font-bold text-slate-900">
      {prefix}{displayValue}{suffix} <span className="text-slate-500 font-medium text-xs uppercase tracking-wide ml-1">{label}</span>
    </span>
  );
};

// --- Enhanced Animated Vector Illustrations ---

// Floating particles component for all vectors
const FloatingParticles = ({ isActive, color = "#4F46E5" }: { isActive: boolean; color?: string }) => (
  <g className={isActive ? 'opacity-100' : 'opacity-0'}>
    {[...Array(8)].map((_, i) => (
      <circle
        key={i}
        cx={50 + i * 60}
        cy={50 + (i % 3) * 80}
        r={3 + (i % 3)}
        fill={color}
        opacity={0.3}
        className={isActive ? `animate-float-particle-${i % 4}` : ''}
      />
    ))}
  </g>
);

// 1. Ignite Your Potential - Enhanced Rocket with Dynamic Elements
const RocketVector = ({ isActive, typingProgress }: { isActive: boolean; typingProgress: number }) => (
  <motion.svg
    viewBox="0 0 500 400"
    className="w-full h-full"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ 
      opacity: isActive ? 1 : 0, 
      scale: isActive ? 1 : 0.8,
      rotateY: isActive ? 0 : -15
    }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  >
    <defs>
      <linearGradient id="rocketBodyEnhanced" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1">
          <animate attributeName="stop-color" values="#6366F1;#8B5CF6;#6366F1" dur="3s" repeatCount="indefinite" />
        </stop>
        <stop offset="100%" stopColor="#4F46E5">
          <animate attributeName="stop-color" values="#4F46E5;#7C3AED;#4F46E5" dur="3s" repeatCount="indefinite" />
        </stop>
      </linearGradient>
      <linearGradient id="rocketFireEnhanced" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
      <filter id="glowEnhanced" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="softGlow">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>

    {/* Animated Background Stars */}
    <g className={isActive ? 'opacity-100' : 'opacity-0'}>
      {[...Array(20)].map((_, i) => (
        <g key={i}>
          <circle
            cx={30 + (i * 47) % 460}
            cy={20 + (i * 31) % 360}
            r={1 + (i % 3)}
            fill="#E0E7FF"
            className={isActive ? `animate-star-twinkle-${i % 5}` : ''}
          />
        </g>
      ))}
    </g>

    {/* Animated Grid Lines - Space Background */}
    <g opacity="0.08">
      {[...Array(6)].map((_, i) => (
        <line
          key={`h-${i}`}
          x1="0"
          y1={i * 80}
          x2="500"
          y2={i * 80}
          stroke="#6366F1"
          strokeWidth="1"
          className={isActive ? 'animate-grid-pulse' : ''}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
      {[...Array(8)].map((_, i) => (
        <line
          key={`v-${i}`}
          x1={i * 70}
          y1="0"
          x2={i * 70}
          y2="400"
          stroke="#6366F1"
          strokeWidth="1"
          className={isActive ? 'animate-grid-pulse' : ''}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </g>

    {/* Planet/Globe with Pulsing Ring */}
    <g className={isActive ? 'animate-planet-float' : 'opacity-0'}>
      <circle cx="400" cy="300" r="50" fill="#1E1B4B" />
      <ellipse cx="400" cy="300" rx="70" ry="15" fill="none" stroke="#818CF8" strokeWidth="2" opacity="0.5" className="animate-ring-rotate" />
      <circle cx="400" cy="300" r="55" fill="none" stroke="#6366F1" strokeWidth="1" className="animate-ring-pulse" />
      <circle cx="385" cy="285" r="15" fill="#4338CA" opacity="0.7" />
      <circle cx="420" cy="310" r="8" fill="#6366F1" opacity="0.5" />
    </g>

    {/* Dynamic Trajectory with Progress */}
    <motion.path
      d="M80 360 Q150 320 200 250 T320 150 T430 60"
      fill="none"
      stroke="url(#rocketBodyEnhanced)"
      strokeWidth="3"
      strokeDasharray="500"
      initial={{ strokeDashoffset: 500 }}
      animate={{ strokeDashoffset: isActive ? 500 - (typingProgress * 500) : 500 }}
      transition={{ duration: 0.1 }}
      filter="url(#softGlow)"
    />

    {/* Trail Particles */}
    <g className={isActive ? 'animate-trail-particles' : 'opacity-0'}>
      {[...Array(6)].map((_, i) => (
        <circle
          key={i}
          cx={100 + i * 50}
          cy={340 - i * 40}
          r={4 - i * 0.5}
          fill="#A5B4FC"
          opacity={0.8 - i * 0.1}
          className={`animate-particle-trail-${i}`}
        />
      ))}
    </g>

    {/* Main Rocket with Enhanced Animation */}
    <motion.g 
      initial={{ x: 50, y: 350, scale: 0.5, rotate: 0 }}
      animate={{ 
        x: isActive ? 350 + (typingProgress * 80) : 50,
        y: isActive ? 100 - (typingProgress * 50) : 350,
        scale: isActive ? 1 : 0.5,
        rotate: isActive ? -45 : 0
      }}
      transition={{ 
        type: "spring",
        stiffness: 50,
        damping: 15,
        duration: 2
      }}
    >
      {/* Rocket Glow Effect */}
      <ellipse cx="0" cy="0" rx="60" ry="60" fill="url(#starGlow)" opacity="0.3" className="animate-rocket-glow" />
      
      {/* Rocket Body */}
      <path d="M0 -50 C-25 -20 -25 30 -25 55 L-30 70 L0 80 L30 70 L25 55 C25 30 25 -20 0 -50 Z" fill="url(#rocketBodyEnhanced)" filter="url(#glowEnhanced)" />
      
      {/* Window */}
      <circle cx="0" cy="5" r="14" fill="#1E1B4B" />
      <circle cx="0" cy="5" r="10" fill="#312E81">
        <animate attributeName="fill" values="#312E81;#4338CA;#312E81" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="-3" cy="2" r="3" fill="#A5B4FC" opacity="0.6" />
      
      {/* Fins with Gradient */}
      <path d="M-25 45 L-45 85 L-25 70 Z" fill="#4338CA" />
      <path d="M25 45 L45 85 L25 70 Z" fill="#4338CA" />
      <path d="M0 55 L0 90 L10 80 L10 60 Z" fill="#3730A3" />
      
      {/* Enhanced Flame with Multiple Layers */}
      <g className="animate-flame-dance">
        <path d="M-15 80 Q0 140 15 80 Z" fill="#EF4444" opacity="0.8" />
        <path d="M-12 80 Q0 130 12 80 Z" fill="#F59E0B" opacity="0.9" />
        <path d="M-8 80 Q0 115 8 80 Z" fill="#FBBF24" />
        <path d="M-4 80 Q0 100 4 80 Z" fill="#FEF3C7" />
      </g>
      
      {/* Smoke Trail */}
      <g className="animate-smoke">
        <ellipse cx="-20" cy="100" rx="8" ry="12" fill="#CBD5E1" opacity="0.4" />
        <ellipse cx="20" cy="105" rx="6" ry="10" fill="#E2E8F0" opacity="0.3" />
        <ellipse cx="0" cy="115" rx="10" ry="15" fill="#F1F5F9" opacity="0.2" />
      </g>
    </motion.g>

    {/* Floating "LAUNCH" Text with Typing Sync */}
    <motion.g
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isActive && typingProgress > 0.5 ? 1 : 0, y: isActive ? 0 : 20 }}
      transition={{ duration: 0.5 }}
    >
      <text x="250" y="380" textAnchor="middle" className="text-2xl font-bold fill-indigo-600" opacity="0.6">
        LAUNCHING YOUR DREAMS
      </text>
    </motion.g>
  </motion.svg>
);

// 2. Crush Every Goal - Enhanced Target with Dynamic Elements
const TargetVector = ({ isActive, typingProgress }: { isActive: boolean; typingProgress: number }) => (
  <motion.svg
    viewBox="0 0 500 400"
    className="w-full h-full"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ 
      opacity: isActive ? 1 : 0, 
      scale: isActive ? 1 : 0.8 
    }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  >
    <defs>
      <linearGradient id="docGradientEnhanced" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F0FDF4" />
      </linearGradient>
      <linearGradient id="targetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEE2E2" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
      <filter id="targetGlow">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="checkGlow">
        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#22C55E" />
      </filter>
    </defs>

    {/* Animated Background Pattern */}
    <g opacity="0.05">
      {[...Array(12)].map((_, i) => (
        <circle
          key={i}
          cx={250}
          cy={200}
          r={30 + i * 30}
          fill="none"
          stroke="#10B981"
          strokeWidth="1"
          className={isActive ? `animate-ripple-${i % 4}` : ''}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </g>

    {/* Enhanced Target Board */}
    <motion.g 
      initial={{ scale: 0, x: 320, y: 200 }}
      animate={{ 
        scale: isActive ? 1 : 0,
        x: 320,
        y: 200
      }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      {/* Outer pulsing rings */}
      <circle r="130" fill="none" stroke="#FEE2E2" strokeWidth="2" className={isActive ? 'animate-target-ring-1' : ''} />
      <circle r="115" fill="none" stroke="#FECACA" strokeWidth="1" className={isActive ? 'animate-target-ring-2' : ''} />
      
      {/* Target circles */}
      <circle r="100" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="3" />
      <circle r="75" fill="#FEE2E2" stroke="#F87171" strokeWidth="2" />
      <circle r="50" fill="#FECACA" stroke="#EF4444" strokeWidth="2" />
      <circle r="25" fill="#FCA5A5" />
      <circle r="12" fill="url(#targetGradient)" filter="url(#targetGlow)">
        <animate attributeName="r" values="12;15;12" dur="1s" repeatCount="indefinite" />
      </circle>
      
      {/* Crosshairs */}
      <line x1="-110" y1="0" x2="110" y2="0" stroke="#DC2626" strokeWidth="1" strokeDasharray="5 5" opacity="0.5" />
      <line x1="0" y1="-110" x2="0" y2="110" stroke="#DC2626" strokeWidth="1" strokeDasharray="5 5" opacity="0.5" />
    </motion.g>

    {/* Documents with Progress Tracking */}
    <g>
      {/* Document 1 - Resume */}
      <motion.g 
        initial={{ x: 30, y: 320, opacity: 0, scale: 0.8 }}
        animate={{ 
          x: isActive && typingProgress > 0.2 ? 60 : 30,
          y: isActive && typingProgress > 0.2 ? 80 : 320,
          opacity: isActive ? 1 : 0,
          scale: isActive ? 1 : 0.8
        }}
        transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.2 }}
      >
        <rect width="70" height="90" rx="6" fill="url(#docGradientEnhanced)" stroke="#D1FAE5" strokeWidth="2" filter="url(#targetGlow)" />
        <rect x="8" y="12" width="54" height="8" rx="2" fill="#6EE7B7" />
        <rect x="8" y="26" width="40" height="4" rx="1" fill="#A7F3D0" />
        <rect x="8" y="36" width="50" height="4" rx="1" fill="#A7F3D0" />
        <rect x="8" y="46" width="35" height="4" rx="1" fill="#A7F3D0" />
        <rect x="8" y="60" width="54" height="20" rx="2" fill="#ECFDF5" stroke="#D1FAE5" strokeWidth="1" />
        
        {/* Animated checkmark */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: isActive && typingProgress > 0.5 ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.5 }}
        >
          <circle cx="60" cy="80" r="14" fill="#22C55E" filter="url(#checkGlow)" />
          <path d="M53 80 L58 85 L67 74" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>
      </motion.g>

      {/* Document 2 - Application */}
      <motion.g 
        initial={{ x: 80, y: 350, opacity: 0, scale: 0.8 }}
        animate={{ 
          x: isActive && typingProgress > 0.4 ? 100 : 80,
          y: isActive && typingProgress > 0.4 ? 190 : 350,
          opacity: isActive && typingProgress > 0.3 ? 1 : 0,
          scale: isActive ? 1 : 0.8
        }}
        transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.4 }}
      >
        <rect width="70" height="90" rx="6" fill="url(#docGradientEnhanced)" stroke="#DBEAFE" strokeWidth="2" filter="url(#targetGlow)" />
        <rect x="8" y="12" width="54" height="8" rx="2" fill="#93C5FD" />
        <rect x="8" y="26" width="45" height="4" rx="1" fill="#BFDBFE" />
        <rect x="8" y="36" width="38" height="4" rx="1" fill="#BFDBFE" />
        <rect x="8" y="46" width="50" height="4" rx="1" fill="#BFDBFE" />
        <circle cx="35" cy="68" r="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
        
        {/* Animated checkmark */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: isActive && typingProgress > 0.7 ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.7 }}
        >
          <circle cx="60" cy="80" r="14" fill="#22C55E" filter="url(#checkGlow)" />
          <path d="M53 80 L58 85 L67 74" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>
      </motion.g>
    </g>

    {/* Animated Arrow/Dart hitting target */}
    <motion.g
      initial={{ x: -100, y: 100, rotate: 45, opacity: 0 }}
      animate={{ 
        x: isActive && typingProgress > 0.8 ? 270 : -100,
        y: isActive && typingProgress > 0.8 ? 200 : 100,
        rotate: 45,
        opacity: isActive && typingProgress > 0.6 ? 1 : 0
      }}
      transition={{ type: "spring", stiffness: 150, damping: 12, delay: 0.3 }}
    >
      {/* Arrow shaft */}
      <rect x="-60" y="-4" width="80" height="8" rx="2" fill="#4F46E5" />
      {/* Arrow head */}
      <path d="M20 -12 L50 0 L20 12 Z" fill="#6366F1" />
      {/* Feathers */}
      <path d="M-60 -4 L-70 -15 L-50 -4 Z" fill="#818CF8" />
      <path d="M-60 4 L-70 15 L-50 4 Z" fill="#818CF8" />
    </motion.g>

    {/* Impact effect */}
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isActive && typingProgress > 0.9 ? [0, 1.5, 1] : 0,
        opacity: isActive && typingProgress > 0.9 ? [0, 1, 0] : 0
      }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <circle cx="320" cy="200" r="30" fill="none" stroke="#22C55E" strokeWidth="3" />
      <circle cx="320" cy="200" r="50" fill="none" stroke="#22C55E" strokeWidth="2" opacity="0.5" />
    </motion.g>

    {/* Progress indicator text */}
    <motion.text
      x="250"
      y="380"
      textAnchor="middle"
      className="text-xl font-bold fill-emerald-600"
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive && typingProgress > 0.5 ? 0.6 : 0 }}
    >
      {Math.round(typingProgress * 100)}% COMPLETE
    </motion.text>
  </motion.svg>
);

// 3. Secure Your Legacy - Enhanced Trophy with Celebration
const TrophyVector = ({ isActive, typingProgress }: { isActive: boolean; typingProgress: number }) => (
  <motion.svg
    viewBox="0 0 500 400"
    className="w-full h-full"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ 
      opacity: isActive ? 1 : 0, 
      scale: isActive ? 1 : 0.8 
    }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  >
    <defs>
      <linearGradient id="goldGradientEnhanced" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A">
          <animate attributeName="stop-color" values="#FDE68A;#FBBF24;#FDE68A" dur="2s" repeatCount="indefinite" />
        </stop>
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.8" />
        <stop offset="50%" stopColor="white" stopOpacity="0" />
        <stop offset="100%" stopColor="white" stopOpacity="0.3" />
      </linearGradient>
      <filter id="trophyGlow">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="starFilter">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Radiating light background */}
    <motion.g
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: isActive ? 0.3 : 0,
        scale: isActive ? 1 : 0.5
      }}
      transition={{ duration: 1.5 }}
    >
      {[...Array(12)].map((_, i) => (
        <line
          key={i}
          x1="250"
          y1="200"
          x2={250 + Math.cos((i * 30 * Math.PI) / 180) * 250}
          y2={200 + Math.sin((i * 30 * Math.PI) / 180) * 250}
          stroke="#FBBF24"
          strokeWidth="2"
          opacity={0.2}
          className={isActive ? `animate-ray-${i % 3}` : ''}
        />
      ))}
    </motion.g>

    {/* Enhanced Confetti */}
    <g className={isActive && typingProgress > 0.3 ? 'opacity-100' : 'opacity-0'}>
      {[...Array(30)].map((_, i) => {
        const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
        const shapes = ['rect', 'circle', 'triangle'];
        const shape = shapes[i % 3];
        const x = 50 + (i * 37) % 400;
        const delay = (i * 0.1) % 2;
        
        return (
          <g key={i} className={`animate-confetti-${i % 6}`} style={{ animationDelay: `${delay}s` }}>
            {shape === 'rect' && (
              <rect
                x={x}
                y={-20 - (i * 10) % 50}
                width={6 + (i % 4)}
                height={10 + (i % 6)}
                fill={colors[i % colors.length]}
                transform={`rotate(${(i * 45) % 360} ${x + 3} ${-10})`}
              />
            )}
            {shape === 'circle' && (
              <circle
                cx={x}
                cy={-20 - (i * 10) % 50}
                r={3 + (i % 3)}
                fill={colors[i % colors.length]}
              />
            )}
            {shape === 'triangle' && (
              <polygon
                points={`${x},${-25 - (i * 10) % 50} ${x - 5},${-15 - (i * 10) % 50} ${x + 5},${-15 - (i * 10) % 50}`}
                fill={colors[i % colors.length]}
              />
            )}
          </g>
        );
      })}
    </g>

    {/* Floating Stars */}
    {[...Array(8)].map((_, i) => (
      <motion.g
        key={i}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: isActive && typingProgress > 0.4 ? 1 : 0,
          scale: isActive && typingProgress > 0.4 ? 1 : 0,
          y: isActive ? [0, -10, 0] : 0
        }}
        transition={{ 
          duration: 2,
          delay: i * 0.2,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      >
        <path
          d={`M${80 + (i * 55) % 380} ${60 + (i * 40) % 100} l3 6 6 1 -5 4 1 7 -5 -3 -5 3 1 -7 -5 -4 6 -1z`}
          fill="#FBBF24"
          filter="url(#starFilter)"
        />
      </motion.g>
    ))}

    {/* Main Trophy */}
    <motion.g
      initial={{ y: 200, scale: 0.5, opacity: 0 }}
      animate={{ 
        y: isActive ? 0 : 200,
        scale: isActive ? 1 : 0.5,
        opacity: isActive ? 1 : 0
      }}
      transition={{ type: "spring", stiffness: 80, damping: 12, delay: 0.3 }}
    >
      {/* Trophy Base */}
      <g transform="translate(250, 220)">
        {/* Pedestal */}
        <rect x="-50" y="100" width="100" height="15" rx="3" fill="#92400E" />
        <rect x="-60" y="115" width="120" height="20" rx="4" fill="#78350F" />
        <rect x="-45" y="85" width="90" height="20" rx="3" fill="#B45309" />
        
        {/* Trophy body */}
        <path 
          d="M-65 -110 L-45 25 C-45 60 -25 80 0 80 C25 80 45 60 45 25 L65 -110 Z" 
          fill="url(#goldGradientEnhanced)" 
          filter="url(#trophyGlow)"
        />
        
        {/* Shine effect */}
        <path 
          d="M-55 -100 L-40 15 C-40 45 -20 60 0 60 C5 60 10 59 15 57 L15 -100 Z" 
          fill="url(#shineGradient)"
          opacity="0.5"
        />
        
        {/* Handles */}
        <path d="M65 -90 C100 -90 100 -40 45 -15" fill="none" stroke="url(#goldGradientEnhanced)" strokeWidth="12" strokeLinecap="round" />
        <path d="M-65 -90 C-100 -90 -100 -40 -45 -15" fill="none" stroke="url(#goldGradientEnhanced)" strokeWidth="12" strokeLinecap="round" />
        
        {/* Stem */}
        <rect x="-20" y="80" width="40" height="25" rx="4" fill="#92400E" />
        
        {/* Star decoration on trophy */}
        <g className={isActive ? 'animate-star-spin' : ''}>
          <path d="M0 -60 l8 16 18 3 -13 13 3 18 -16 -8 -16 8 3 -18 -13 -13 18 -3z" fill="#FEF3C7" />
          <path d="M0 -55 l5 10 11 2 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -2z" fill="#FBBF24" />
        </g>
      </g>
    </motion.g>

    {/* Floating Certificate */}
    <motion.g
      initial={{ x: 50, y: 280, rotate: -20, opacity: 0 }}
      animate={{ 
        x: isActive && typingProgress > 0.5 ? 80 : 50,
        y: isActive && typingProgress > 0.5 ? 180 : 280,
        rotate: isActive ? -10 : -20,
        opacity: isActive && typingProgress > 0.4 ? 1 : 0
      }}
      transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.6 }}
    >
      <rect width="110" height="85" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="2" filter="url(#trophyGlow)" />
      <rect x="8" y="8" width="94" height="69" fill="none" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3 3" />
      <text x="55" y="30" textAnchor="middle" className="text-xs font-bold fill-slate-800">CERTIFICATE</text>
      <line x1="15" y1="45" x2="95" y2="45" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <line x1="25" y1="55" x2="85" y2="55" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" />
      
      {/* Ribbon seal */}
      <g transform="translate(85, 65)">
        <circle r="12" fill="#DC2626" />
        <circle r="8" fill="#EF4444" />
        <path d="M0 12 L-6 30 L0 25 L6 30 Z" fill="#DC2626" />
        <circle r="4" fill="#FCA5A5" />
      </g>
    </motion.g>

    {/* Medal */}
    <motion.g
      initial={{ x: 380, y: 250, rotate: 15, opacity: 0 }}
      animate={{ 
        x: isActive && typingProgress > 0.6 ? 370 : 380,
        y: isActive && typingProgress > 0.6 ? 200 : 250,
        rotate: isActive ? 10 : 15,
        opacity: isActive && typingProgress > 0.5 ? 1 : 0
      }}
      transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.8 }}
    >
      {/* Ribbon */}
      <path d="M0 -30 L-15 -60 L-25 -60 L-10 -20 Z" fill="#3B82F6" />
      <path d="M0 -30 L15 -60 L25 -60 L10 -20 Z" fill="#2563EB" />
      
      {/* Medal */}
      <circle r="30" fill="#F59E0B" filter="url(#trophyGlow)" />
      <circle r="25" fill="#FBBF24" />
      <circle r="20" fill="none" stroke="#FDE68A" strokeWidth="2" />
      <text y="6" textAnchor="middle" className="text-lg font-bold fill-amber-800">★</text>
    </motion.g>

    {/* Success text */}
    <motion.text
      x="250"
      y="380"
      textAnchor="middle"
      className="text-xl font-bold fill-amber-600"
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: isActive && typingProgress > 0.7 ? 0.7 : 0,
        y: isActive ? 0 : 10
      }}
      transition={{ duration: 0.5 }}
    >
      🎉 ACHIEVEMENT UNLOCKED 🎉
    </motion.text>
  </motion.svg>
);

const DynamicHeroSection = () => {
  const router = useRouter();
  const slides = useMemo(() => [
    { 
      text: 'Ignite Your Potential', 
      Vector: RocketVector,
      sub: "Don't just dream. Launch your career with AI-powered precision.",
      gradient: 'from-indigo-600 via-purple-600 to-pink-600'
    },
    { 
      text: 'Crush Every Goal', 
      Vector: TargetVector, 
      sub: "Hit the bullseye on your applications with automated document verification.",
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600'
    },
    { 
      text: 'Secure Your Legacy', 
      Vector: TrophyVector,
      sub: "Join the top 1% of applicants who let nothing stand in their way.",
      gradient: 'from-amber-500 via-orange-500 to-red-500'
    },
  ], []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingProgress, setTypingProgress] = useState(0);

  const [dreamPrompt, setDreamPrompt] = useState('');

  const typeSpeed = 50; 
  const deleteSpeed = 20;
  const pauseTime = 4000;

  // Calculate typing progress (0 to 1)
  useEffect(() => {
    const currentText = slides[currentIndex].text;
    const progress = currentText.length > 0 ? displayedText.length / currentText.length : 0;
    setTypingProgress(isDeleting ? 1 - progress : progress);
  }, [displayedText, currentIndex, slides, isDeleting]);

  const handleTyping = useCallback(() => {
    const currentText = slides[currentIndex].text;

    if (isTyping && !isDeleting) {
      if (displayedText.length < currentText.length) {
        setDisplayedText(currentText.slice(0, displayedText.length + 1));
      } else {
        setIsTyping(false);
        setTimeout(() => setIsDeleting(true), pauseTime);
      }
    } else if (isDeleting) {
      if (displayedText.length > 0) {
        setDisplayedText(displayedText.slice(0, -1));
      } else {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        setIsTyping(true);
      }
    }
  }, [currentIndex, displayedText, isDeleting, isTyping, slides]);

  useEffect(() => {
    const timer = setTimeout(handleTyping, isDeleting ? deleteSpeed : typeSpeed);
    return () => clearTimeout(timer);
  }, [handleTyping, isDeleting]);

  const trustBadges = useMemo(() => [
    { icon: Target, value: 99, prefix: '', suffix: '%', label: 'Success Rate' },
    { icon: Zap, value: 10, prefix: '', suffix: 'x', label: 'Faster Apply' },
    { icon: Award, value: 50, prefix: '$', suffix: 'k+', label: 'Scholarships' },
  ], []);

  const handleDreamSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = dreamPrompt.trim();
    if (!trimmed) return;
    router.push(`/dream?q=${encodeURIComponent(trimmed)}`);
  }, [dreamPrompt, router]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white pt-24 pb-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[700px] h-[700px] bg-gradient-to-br from-indigo-100/40 via-purple-100/30 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/40 via-cyan-100/20 to-transparent rounded-full blur-3xl"></div>
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#4F46E5 1px, transparent 1px), linear-gradient(90deg, #4F46E5 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start z-20">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white shadow-lg shadow-indigo-500/20"
            >
              <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold tracking-wide uppercase">The #1 AI Advantage</span>
            </motion.div>

            {/* FIXED: Replaced fixed height with min-height and added flex-wrap logic */}
            <div className="min-h-[160px] lg:min-h-[200px] mb-4 flex flex-col justify-center lg:justify-start w-full relative">
              <span className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-tight mb-2">
                Ready To
              </span>
              <div className="relative block">
                <motion.span 
                  key={currentIndex}
                  className={`text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter bg-gradient-to-r ${slides[currentIndex].gradient} bg-clip-text text-transparent break-words leading-tight`}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {displayedText}
                </motion.span>
                <motion.span 
                  className={`inline-block w-[6px] h-[40px] sm:h-[60px] lg:h-[80px] ml-2 align-baseline bg-gradient-to-b ${slides[currentIndex].gradient.replace('bg-gradient-to-r ', '')}`}
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  style={{ 
                    background: currentIndex === 0 ? 'linear-gradient(to bottom, #4F46E5, #7C3AED)' : 
                               currentIndex === 1 ? 'linear-gradient(to bottom, #10B981, #06B6D4)' : 
                               'linear-gradient(to bottom, #F59E0B, #EF4444)'
                  }}
                />
              </div>
            </div>

            <motion.p 
              key={currentIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-lg sm:text-xl text-slate-600 mb-10 max-w-xl font-medium leading-relaxed min-h-[60px]"
            >
              {slides[currentIndex].sub}
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12 w-full sm:w-auto">
              <a 
                href="/signup"
                className="group relative px-8 py-4 bg-slate-900 rounded-xl overflow-hidden shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_auto] animate-gradient-x" />
                <span className="relative z-10 text-white font-bold text-lg flex items-center justify-center gap-2">
                  Get Started Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </a>
              
              <a 
                href="/roadmap/dream"
                className="px-8 py-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-colors duration-300 flex items-center justify-center"
              >
                View Roadmap
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-8 w-full border-t border-slate-100 pt-8">
              {trustBadges.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div key={idx} className="flex flex-col items-center lg:items-start">
                    <div className="flex items-center gap-2 mb-1 text-indigo-600">
                      <Icon className="w-5 h-5" />
                      <span className="font-bold text-xs uppercase tracking-wider text-indigo-900/60">{badge.label}</span>
                    </div>
                    <div className="text-2xl sm:text-3xl">
                      <AnimatedCounter 
                        end={badge.value} 
                        prefix={badge.prefix} 
                        suffix={badge.suffix} 
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="relative h-[400px] lg:h-[600px] flex items-center justify-center z-10">
             {/* Animated background glow that changes with slides */}
             <motion.div 
               className="absolute w-[90%] h-[90%] rounded-full blur-3xl"
               animate={{ 
                 background: currentIndex === 0 
                   ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))'
                   : currentIndex === 1 
                   ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15))'
                   : 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(239, 68, 68, 0.15))',
                 scale: [1, 1.05, 1]
               }}
               transition={{ 
                 background: { duration: 0.8 },
                 scale: { duration: 3, repeat: Infinity, repeatType: "reverse" }
               }}
             />
             
             {/* Orbiting particles */}
             <div className="absolute w-full h-full">
               {[...Array(6)].map((_, i) => (
                 <motion.div
                   key={i}
                   className="absolute w-3 h-3 rounded-full"
                   style={{
                     background: currentIndex === 0 ? '#6366F1' : currentIndex === 1 ? '#10B981' : '#F59E0B',
                     top: '50%',
                     left: '50%',
                   }}
                   animate={{
                     x: [
                       Math.cos((i * 60 * Math.PI) / 180) * 150,
                       Math.cos(((i * 60 + 180) * Math.PI) / 180) * 150,
                       Math.cos((i * 60 * Math.PI) / 180) * 150,
                     ],
                     y: [
                       Math.sin((i * 60 * Math.PI) / 180) * 150,
                       Math.sin(((i * 60 + 180) * Math.PI) / 180) * 150,
                       Math.sin((i * 60 * Math.PI) / 180) * 150,
                     ],
                     opacity: [0.3, 0.7, 0.3],
                     scale: [0.8, 1.2, 0.8],
                   }}
                   transition={{
                     duration: 8,
                     delay: i * 0.5,
                     repeat: Infinity,
                     ease: "easeInOut",
                   }}
                 />
               ))}
             </div>
             
             {/* Vector illustrations with AnimatePresence for smooth transitions */}
             <AnimatePresence mode="wait">
               {slides.map((slide, index) => (
                 currentIndex === index && (
                   <motion.div 
                     key={index} 
                     className="absolute inset-0 flex items-center justify-center p-4 sm:p-8"
                     initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                     animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                     exit={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                     transition={{ duration: 0.6, ease: "easeOut" }}
                   >
                     <slide.Vector isActive={true} typingProgress={typingProgress} />
                   </motion.div>
                 )
               ))}
             </AnimatePresence>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* --- General Animations --- */
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x { animation: gradient-x 3s ease infinite; }
        
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .animate-pulse-slow { animation: pulse-slow 6s infinite; }

        /* --- Star Twinkle Animations --- */
        @keyframes star-twinkle-0 {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes star-twinkle-1 {
          0%, 100% { opacity: 0.5; transform: scale(1.1); }
          50% { opacity: 0.2; transform: scale(0.9); }
        }
        @keyframes star-twinkle-2 {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes star-twinkle-3 {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
        @keyframes star-twinkle-4 {
          0%, 100% { opacity: 0.4; transform: scale(1.05); }
          50% { opacity: 0.9; transform: scale(0.95); }
        }
        .animate-star-twinkle-0 { animation: star-twinkle-0 2s ease-in-out infinite; }
        .animate-star-twinkle-1 { animation: star-twinkle-1 2.5s ease-in-out infinite; }
        .animate-star-twinkle-2 { animation: star-twinkle-2 3s ease-in-out infinite; }
        .animate-star-twinkle-3 { animation: star-twinkle-3 2.2s ease-in-out infinite; }
        .animate-star-twinkle-4 { animation: star-twinkle-4 2.8s ease-in-out infinite; }

        /* --- Grid Pulse --- */
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }
        .animate-grid-pulse { animation: grid-pulse 4s ease-in-out infinite; }

        /* --- Planet Animations --- */
        @keyframes planet-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-planet-float { animation: planet-float 4s ease-in-out infinite; }

        @keyframes ring-rotate {
          from { transform: rotateX(70deg) rotateZ(0deg); }
          to { transform: rotateX(70deg) rotateZ(360deg); }
        }
        .animate-ring-rotate { 
          animation: ring-rotate 10s linear infinite; 
          transform-origin: center;
        }

        @keyframes ring-pulse {
          0%, 100% { opacity: 0.3; r: 55; }
          50% { opacity: 0.7; r: 60; }
        }
        .animate-ring-pulse { animation: ring-pulse 2s ease-in-out infinite; }

        /* --- Flame Animation --- */
        @keyframes flame-dance {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          25% { transform: scaleY(1.1) scaleX(0.9); }
          50% { transform: scaleY(0.95) scaleX(1.05); }
          75% { transform: scaleY(1.08) scaleX(0.92); }
        }
        .animate-flame-dance { 
          animation: flame-dance 0.3s ease-in-out infinite; 
          transform-origin: center top;
        }

        /* --- Smoke Animation --- */
        @keyframes smoke {
          0% { opacity: 0.4; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(30px) scale(1.5); }
        }
        .animate-smoke ellipse { animation: smoke 1.5s ease-out infinite; }
        .animate-smoke ellipse:nth-child(2) { animation-delay: 0.3s; }
        .animate-smoke ellipse:nth-child(3) { animation-delay: 0.6s; }

        /* --- Rocket Glow --- */
        @keyframes rocket-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .animate-rocket-glow { animation: rocket-glow 2s ease-in-out infinite; }

        /* --- Target Ring Animations --- */
        @keyframes target-ring-1 {
          0%, 100% { r: 130; opacity: 0.3; }
          50% { r: 140; opacity: 0.5; }
        }
        @keyframes target-ring-2 {
          0%, 100% { r: 115; opacity: 0.2; }
          50% { r: 125; opacity: 0.4; }
        }
        .animate-target-ring-1 { animation: target-ring-1 3s ease-in-out infinite; }
        .animate-target-ring-2 { animation: target-ring-2 3s ease-in-out infinite 0.5s; }

        /* --- Ripple Animations --- */
        @keyframes ripple-0 { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.2; } }
        @keyframes ripple-1 { 0%, 100% { opacity: 0.08; } 50% { opacity: 0.15; } }
        @keyframes ripple-2 { 0%, 100% { opacity: 0.06; } 50% { opacity: 0.12; } }
        @keyframes ripple-3 { 0%, 100% { opacity: 0.04; } 50% { opacity: 0.1; } }
        .animate-ripple-0 { animation: ripple-0 2s ease-in-out infinite; }
        .animate-ripple-1 { animation: ripple-1 2.5s ease-in-out infinite; }
        .animate-ripple-2 { animation: ripple-2 3s ease-in-out infinite; }
        .animate-ripple-3 { animation: ripple-3 3.5s ease-in-out infinite; }

        /* --- Confetti Animations --- */
        @keyframes confetti-0 {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(450px) rotate(720deg); opacity: 0; }
        }
        @keyframes confetti-1 {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(430px) rotate(-540deg); opacity: 0; }
        }
        @keyframes confetti-2 {
          0% { transform: translateY(-40px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(440px) rotate(360deg); opacity: 0; }
        }
        @keyframes confetti-3 {
          0% { transform: translateY(-60px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(460px) rotate(-720deg); opacity: 0; }
        }
        @keyframes confetti-4 {
          0% { transform: translateY(-25px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(425px) rotate(540deg); opacity: 0; }
        }
        @keyframes confetti-5 {
          0% { transform: translateY(-45px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(445px) rotate(-360deg); opacity: 0; }
        }
        .animate-confetti-0 { animation: confetti-0 3s linear infinite; }
        .animate-confetti-1 { animation: confetti-1 3.5s linear infinite; }
        .animate-confetti-2 { animation: confetti-2 2.8s linear infinite; }
        .animate-confetti-3 { animation: confetti-3 3.2s linear infinite; }
        .animate-confetti-4 { animation: confetti-4 2.6s linear infinite; }
        .animate-confetti-5 { animation: confetti-5 3.8s linear infinite; }

        /* --- Ray Animations --- */
        @keyframes ray-0 {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        @keyframes ray-1 {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        @keyframes ray-2 {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.2; }
        }
        .animate-ray-0 { animation: ray-0 2s ease-in-out infinite; }
        .animate-ray-1 { animation: ray-1 2.5s ease-in-out infinite; }
        .animate-ray-2 { animation: ray-2 3s ease-in-out infinite; }

        /* --- Star Spin --- */
        @keyframes star-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-star-spin { animation: star-spin 20s linear infinite; }

        /* --- Floating Particle Animations --- */
        @keyframes float-particle-0 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
        @keyframes float-particle-1 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          50% { transform: translateY(-15px) translateX(-8px); opacity: 0.7; }
        }
        @keyframes float-particle-2 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-25px) translateX(5px); opacity: 0.5; }
        }
        @keyframes float-particle-3 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.35; }
          50% { transform: translateY(-18px) translateX(-12px); opacity: 0.65; }
        }
        .animate-float-particle-0 { animation: float-particle-0 4s ease-in-out infinite; }
        .animate-float-particle-1 { animation: float-particle-1 5s ease-in-out infinite; }
        .animate-float-particle-2 { animation: float-particle-2 4.5s ease-in-out infinite; }
        .animate-float-particle-3 { animation: float-particle-3 5.5s ease-in-out infinite; }
      `}</style>

      {/* Anonymous Dream chat entry (floating, center-bottom) */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 z-50 w-[calc(100%-2rem)] max-w-2xl">
        <form onSubmit={handleDreamSubmit} aria-label="Dream chat entry" className="w-full">
          <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <input
                value={dreamPrompt}
                onChange={(e) => setDreamPrompt(e.target.value)}
                placeholder="Ask anything…"
                className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500 text-center">
            No signup required. We’ll keep the last 4 messages here.
          </p>
        </form>
      </div>
    </section>
  );
};

export default DynamicHeroSection;