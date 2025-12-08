'use client';

import { motion } from 'framer-motion';

interface RocketIconProps {
  className?: string;
  animated?: boolean;
}

export function RocketIcon({ className = '', animated = true }: RocketIconProps) {
  return (
    <motion.svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={animated ? {
        y: [0, -8, 0],
        rotate: [0, 5, 0, -5, 0],
      } : {}}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Rocket body */}
      <path
        d="M24 4C24 4 32 8 32 20V32C32 32 28 36 24 36C20 36 16 32 16 32V20C16 8 24 4 24 4Z"
        fill="url(#rocket-gradient)"
        stroke="white"
        strokeWidth="2"
      />
      
      {/* Window */}
      <circle cx="24" cy="18" r="4" fill="white" opacity="0.9" />
      <circle cx="24" cy="18" r="2.5" fill="#60A5FA" />
      
      {/* Fins */}
      <path
        d="M16 24L12 32L16 30V24Z"
        fill="#818CF8"
        stroke="white"
        strokeWidth="1.5"
      />
      <path
        d="M32 24L36 32L32 30V24Z"
        fill="#818CF8"
        stroke="white"
        strokeWidth="1.5"
      />
      
      {/* Flame */}
      <motion.g
        animate={animated ? {
          scaleY: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
        } : {}}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <path
          d="M24 36C24 36 20 38 20 42C20 44 22 46 24 46C26 46 28 44 28 42C28 38 24 36 24 36Z"
          fill="url(#flame-gradient)"
        />
      </motion.g>
      
      {/* Gradients */}
      <defs>
        <linearGradient id="rocket-gradient" x1="24" y1="4" x2="24" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818CF8" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="flame-gradient" x1="24" y1="36" x2="24" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FCD34D" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#EF4444" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}
