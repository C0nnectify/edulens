'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowRight, Zap, Target, Award, Globe, FileCheck, Sparkles } from 'lucide-react';
import { motion, useInView, useMotionValue, animate } from 'framer-motion';

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

// --- Detailed Vector Illustrations ---

// 1. Ignite Your Potential - Rocket + World Map
const RocketVector = ({ isActive }: { isActive: boolean }) => (
  <svg
    viewBox="0 0 500 400"
    className={`w-full h-full transition-all duration-700 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
  >
    <defs>
      <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
      <linearGradient id="rocketFire" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* World Map Background (Stylized) */}
    <g opacity="0.15" transform="translate(50, 50) scale(0.8)">
      <path 
        d="M50 150 Q80 120 120 130 T200 100 T300 120 T400 80" 
        fill="none" stroke="#4F46E5" strokeWidth="2" strokeDasharray="4 4"
      />
      <path 
        d="M20 200 Q100 250 180 220 T350 240 T450 200" 
        fill="none" stroke="#4F46E5" strokeWidth="2" strokeDasharray="4 4" 
      />
      
      {/* Continents (Abstract blobs) */}
      <path d="M40 100 C60 80 100 80 120 100 C140 120 120 160 100 180 C60 180 40 140 40 100 Z" fill="#94A3B8" />
      <path d="M180 60 C200 40 250 50 270 70 C290 90 280 130 250 140 C210 150 180 100 180 60 Z" fill="#94A3B8" />
      <path d="M320 120 C340 100 380 100 400 120 C420 140 400 180 360 180 C320 170 300 140 320 120 Z" fill="#94A3B8" />
      
      {/* Location Markers */}
      <circle cx="100" cy="120" r="4" fill="#EF4444" className={isActive ? 'animate-ping-slow' : ''} />
      <circle cx="240" cy="90" r="4" fill="#EF4444" className={isActive ? 'animate-ping-slow delay-300' : ''} />
      <circle cx="360" cy="140" r="4" fill="#EF4444" className={isActive ? 'animate-ping-slow delay-700' : ''} />
    </g>

    {/* Trajectory Line */}
    <path
      d="M50 350 Q150 350 200 250 T350 150 T450 50"
      fill="none"
      stroke="#CBD5E1"
      strokeWidth="2"
      strokeDasharray="8 8"
      className={isActive ? 'animate-draw-path' : 'opacity-0'}
    />

    {/* Rocket Group */}
    <g className={isActive ? 'animate-fly-across' : 'opacity-0'}>
      <g transform="rotate(45)">
        {/* Body */}
        <path d="M0 -40 C-20 -10 -20 30 -20 50 L-25 60 L0 65 L25 60 L20 50 C20 30 20 -10 0 -40 Z" fill="url(#rocketBody)" />
        <circle cx="0" cy="10" r="10" fill="white" />
        <circle cx="0" cy="10" r="6" fill="#A5B4FC" />
        {/* Fins */}
        <path d="M-20 40 L-35 70 L-20 60 Z" fill="#4338CA" />
        <path d="M20 40 L35 70 L20 60 Z" fill="#4338CA" />
        {/* Flame */}
        <path d="M-10 65 Q0 100 10 65 Z" fill="url(#rocketFire)" className="animate-flicker" />
      </g>
    </g>

    {/* Clouds passing by */}
    <g className={isActive ? 'animate-clouds-move' : 'opacity-0'}>
      <ellipse cx="100" cy="300" rx="40" ry="15" fill="#F1F5F9" opacity="0.8" />
      <ellipse cx="300" cy="250" rx="30" ry="12" fill="#F1F5F9" opacity="0.6" />
      <ellipse cx="400" cy="320" rx="50" ry="20" fill="#F1F5F9" opacity="0.7" />
    </g>
  </svg>
);

// 2. Crush Every Goal - Target + Automation Docs
const TargetVector = ({ isActive }: { isActive: boolean }) => (
  <svg
    viewBox="0 0 500 400"
    className={`w-full h-full transition-all duration-700 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
  >
    <defs>
      <linearGradient id="docGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F1F5F9" />
      </linearGradient>
      <filter id="scanGlow">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#22C55E" />
      </filter>
    </defs>

    {/* Target Board (Background) */}
    <g transform="translate(350, 200)" className={isActive ? 'animate-target-pulse' : ''}>
      <circle r="100" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
      <circle r="75" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
      <circle r="50" fill="white" stroke="#E2E8F0" strokeWidth="2" />
      <circle r="25" fill="#EF4444" opacity="0.2" />
      <circle r="12" fill="#EF4444" />
    </g>

    {/* Automation Documents */}
    <g>
      {/* Document 1 */}
      <g className={isActive ? 'animate-doc-process delay-0' : 'opacity-0'} transform="translate(50, 100)">
        <rect width="60" height="80" rx="4" fill="url(#docGradient)" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="10" y1="20" x2="50" y2="20" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
        <line x1="10" y1="35" x2="40" y2="35" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
        <line x1="10" y1="50" x2="45" y2="50" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
        {/* Checkmark */}
        <circle cx="50" cy="70" r="12" fill="#22C55E" className={isActive ? 'animate-check-appear delay-1000' : 'opacity-0'} />
        <path d="M46 70 L49 73 L54 67" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? 'animate-check-appear delay-1000' : 'opacity-0'} />
      </g>

      {/* Document 2 */}
      <g className={isActive ? 'animate-doc-process delay-500' : 'opacity-0'} transform="translate(130, 150)">
        <rect width="60" height="80" rx="4" fill="url(#docGradient)" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="10" y1="20" x2="50" y2="20" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
        <line x1="10" y1="35" x2="30" y2="35" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
        <line x1="10" y1="50" x2="50" y2="50" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
         {/* Checkmark */}
         <circle cx="50" cy="70" r="12" fill="#22C55E" className={isActive ? 'animate-check-appear delay-1500' : 'opacity-0'} />
        <path d="M46 70 L49 73 L54 67" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? 'animate-check-appear delay-1500' : 'opacity-0'} />
      </g>
    </g>

    {/* Scanning Laser Beam */}
    <g className={isActive ? 'animate-scanner' : 'opacity-0'}>
      <line x1="40" y1="0" x2="200" y2="0" stroke="#22C55E" strokeWidth="2" filter="url(#scanGlow)" opacity="0.7" />
      <rect x="40" y="0" width="160" height="40" fill="url(#scanGradient)" opacity="0.1" />
    </g>

    {/* The Dart (Hits after docs processed) */}
    <g className={isActive ? 'animate-dart-hit delay-2000' : 'opacity-0'} transform="translate(350, 150)">
      <path d="M0 0 L50 -50" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
      <path d="M-5 5 L10 -10 L15 -5 L0 10 Z" fill="#334155" /> 
      <path d="M40 -40 L70 -70 L80 -60 L50 -30 Z" fill="#4F46E5" />
    </g>
  </svg>
);

// 3. Secure Your Legacy - Trophy + Certificate
const TrophyVector = ({ isActive }: { isActive: boolean }) => (
  <svg
    viewBox="0 0 500 400"
    className={`w-full h-full transition-all duration-700 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
  >
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2" />
      </filter>
    </defs>

    {/* Confetti Background */}
    <g className={isActive ? 'animate-confetti-rain' : 'opacity-0'}>
      <rect x="100" y="-10" width="6" height="10" fill="#EF4444" />
      <rect x="200" y="-20" width="6" height="10" fill="#3B82F6" />
      <rect x="300" y="-15" width="6" height="10" fill="#10B981" />
      <rect x="400" y="-30" width="6" height="10" fill="#F59E0B" />
      <circle cx="150" cy="-40" r="4" fill="#8B5CF6" />
      <circle cx="350" cy="-25" r="4" fill="#EC4899" />
    </g>

    {/* Trophy */}
    <g transform="translate(250, 220)" className={isActive ? 'animate-trophy-rise' : 'opacity-0'}>
      <path d="M-60 -100 L-40 20 C-40 50 -20 70 0 70 C20 70 40 50 40 20 L60 -100 Z" fill="url(#goldGradient)" filter="url(#shadow)" />
      <path d="M60 -80 C90 -80 90 -40 40 -20" fill="none" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
      <path d="M-60 -80 C-90 -80 -90 -40 -40 -20" fill="none" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
      <rect x="-20" y="70" width="40" height="20" fill="#B45309" />
      <rect x="-40" y="90" width="80" height="10" fill="#F59E0B" rx="2" />
    </g>

    {/* Floating Certificate (New Detail) */}
    <g transform="translate(120, 180) rotate(-10)" className={isActive ? 'animate-cert-float' : 'opacity-0'}>
      <rect width="100" height="80" rx="2" fill="white" stroke="#E2E8F0" strokeWidth="1" filter="url(#shadow)" />
      <rect x="10" y="10" width="80" height="60" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="20" y1="25" x2="80" y2="25" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="40" x2="60" y2="40" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      {/* Ribbon Seal */}
      <circle cx="70" cy="55" r="10" fill="#EF4444" />
      <path d="M70 55 L65 75 L70 70 L75 75 Z" fill="#EF4444" />
    </g>
  </svg>
);

const DynamicHeroSection = () => {
  const slides = useMemo(() => [
    { 
      text: 'Ignite Your Potential', 
      Vector: RocketVector,
      sub: "Don't just dream. Launch your career with AI-powered precision."
    },
    { 
      text: 'Crush Every Goal', 
      Vector: TargetVector, 
      sub: "Hit the bullseye on your applications with automated document verification."
    },
    { 
      text: 'Secure Your Legacy', 
      Vector: TrophyVector,
      sub: "Join the top 1% of applicants who let nothing stand in their way."
    },
  ], []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const typeSpeed = 50; 
  const deleteSpeed = 20;
  const pauseTime = 4000; // Increased pause time to let animations finish

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
                <span className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent break-words leading-tight">
                  {displayedText}
                </span>
                <motion.span 
                  className="inline-block w-[6px] h-[40px] sm:h-[60px] lg:h-[80px] bg-indigo-600 ml-2 align-baseline"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
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
                href="/roadmap"
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
             <div className="absolute w-[80%] h-[80%] bg-gradient-to-tr from-indigo-50 to-purple-50 rounded-full blur-3xl animate-pulse-slow" />
             {slides.map((slide, index) => (
                <div key={index} className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
                  <slide.Vector isActive={currentIndex === index} />
                </div>
             ))}
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

        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; transform-box: fill-box; transform-origin: center; }

        /* --- Rocket Animations --- */
        @keyframes draw-path {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        .animate-draw-path { animation: draw-path 3s ease-out forwards; }

        @keyframes fly-across {
          0% { transform: translate(50px, 350px) scale(0.5) rotate(-20deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(450px, 50px) scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-fly-across { animation: fly-across 3s ease-in-out forwards; }

        @keyframes flicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.9); }
        }
        .animate-flicker { animation: flicker 0.2s infinite; }

        @keyframes clouds-move {
          from { transform: translateX(0); opacity: 0; }
          20% { opacity: 0.8; }
          to { transform: translateX(-50px); opacity: 0; }
        }
        .animate-clouds-move { animation: clouds-move 4s linear infinite; }

        /* --- Target + Automation Animations --- */
        @keyframes doc-process {
          0% { transform: translate(var(--sx, 0), 300px) scale(0.5); opacity: 0; }
          30% { transform: translate(var(--sx, 0), 100px) scale(1); opacity: 1; }
          70% { transform: translate(var(--sx, 0), 100px) scale(1); opacity: 1; }
          100% { transform: translate(350px, 200px) scale(0); opacity: 0; }
        }
        .animate-doc-process { 
          animation: doc-process 2s cubic-bezier(0.4, 0, 0.2, 1) forwards; 
        }
        .animate-doc-process:nth-child(2) { --sx: 80px; }

        @keyframes scanner-move {
          0% { transform: translateY(100px); opacity: 1; }
          50% { transform: translateY(180px); opacity: 1; }
          100% { transform: translateY(100px); opacity: 1; }
        }
        .animate-scanner { animation: scanner-move 1.5s ease-in-out infinite; animation-delay: 0.5s; }

        @keyframes check-appear {
          0% { transform: scale(0); }
          80% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-check-appear { animation: check-appear 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; transform-box: fill-box; transform-origin: center; }

        @keyframes dart-hit {
          0% { transform: translate(500px, 0) scale(1.5); opacity: 0; }
          100% { transform: translate(350px, 150px) scale(1); opacity: 1; }
        }
        .animate-dart-hit { animation: dart-hit 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

        @keyframes target-pulse {
          0% { transform: translate(350px, 200px) scale(1); }
          50% { transform: translate(350px, 200px) scale(1.05); }
          100% { transform: translate(350px, 200px) scale(1); }
        }
        .animate-target-pulse { animation: target-pulse 2s ease-in-out infinite; }

        /* --- Trophy Animations --- */
        @keyframes trophy-rise {
          0% { transform: translate(250px, 400px); opacity: 0; }
          100% { transform: translate(250px, 220px); opacity: 1; }
        }
        .animate-trophy-rise { animation: trophy-rise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes cert-float {
          0% { transform: translate(80px, 200px) rotate(-20deg); opacity: 0; }
          100% { transform: translate(120px, 180px) rotate(-10deg); opacity: 1; }
        }
        .animate-cert-float { animation: cert-float 1s ease-out forwards; animation-delay: 0.5s; }

        @keyframes confetti-rain {
          0% { transform: translateY(-50px); opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        .animate-confetti-rain rect, .animate-confetti-rain circle {
          animation: confetti-rain 3s linear infinite;
        }
        .animate-confetti-rain rect:nth-child(2n) { animation-duration: 2.5s; animation-delay: 0.2s; }
        .animate-confetti-rain rect:nth-child(3n) { animation-duration: 3.5s; animation-delay: 0.5s; }
      `}</style>
    </section>
  );
};

export default DynamicHeroSection;