'use client';

import { motion, type Variants } from 'framer-motion';
import { Sparkles, Rocket, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface RoadmapStage {
  order: number;
  title: string;
  description: string;
}

interface DreamTimelineProps {
  reflection?: string;
  stages: RoadmapStage[];
  nextQuestion?: string;
  className?: string;
  sessionId?: string;
  showProceedToReality?: boolean;
}

const stageColors = [
  'from-indigo-500 to-indigo-600',
  'from-violet-500 to-violet-600',
  'from-purple-500 to-purple-600',
  'from-fuchsia-500 to-fuchsia-600',
  'from-pink-500 to-pink-600',
  'from-rose-500 to-rose-600',
  'from-amber-500 to-amber-600',
];

const nodeVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: i * 0.1,
      type: 'spring' as const,
      stiffness: 200,
      damping: 15,
    },
  }),
};

const lineVariants: Variants = {
  hidden: { scaleY: 0, originY: 0 },
  visible: (i: number) => ({
    scaleY: 1,
    transition: {
      delay: i * 0.1 + 0.05,
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  }),
};

const contentVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1 + 0.1,
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  }),
};

export function DreamTimeline({ reflection, stages, nextQuestion, className, sessionId, showProceedToReality = true }: DreamTimelineProps) {
  const router = useRouter();

  const handleProceedToReality = () => {
    // Navigate to signup with dream session context
    const params = new URLSearchParams();
    params.set('from', 'dream');
    if (sessionId) {
      params.set('sessionId', sessionId);
    }
    router.push(`/signup?${params.toString()}`);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Reflection Section */}
      {reflection && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Reflection</h3>
              <p className="text-slate-700 leading-relaxed">{reflection}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Timeline Section */}
      {stages.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-900 text-white rounded-full text-xs font-bold">
                {stages.length}
              </span>
              Your Roadmap Preview
            </h3>
          </div>

          <div className="p-5">
            <div className="relative">
              {stages.map((stage, index) => {
                const colorClass = stageColors[index % stageColors.length];
                const isLast = index === stages.length - 1;

                return (
                  <div key={`${stage.order}-${index}`} className="relative flex gap-4">
                    {/* Timeline Node & Line */}
                    <div className="flex flex-col items-center">
                      {/* Node */}
                      <motion.div
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        variants={nodeVariants}
                        className={cn(
                          'relative z-10 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg',
                          colorClass
                        )}
                      >
                        <span className="text-white font-bold text-sm">{stage.order}</span>
                        {/* Pulse Effect */}
                        <motion.div
                          className={cn(
                            'absolute inset-0 rounded-full bg-gradient-to-br',
                            colorClass
                          )}
                          initial={{ opacity: 0.5, scale: 1 }}
                          animate={{ opacity: 0, scale: 1.5 }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: index * 0.2,
                          }}
                        />
                      </motion.div>

                      {/* Connecting Line */}
                      {!isLast && (
                        <motion.div
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          variants={lineVariants}
                          className="w-0.5 h-16 bg-gradient-to-b from-slate-300 to-slate-200"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <motion.div
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={contentVariants}
                      className={cn(
                        'flex-1 pb-6',
                        isLast && 'pb-0'
                      )}
                    >
                      <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors border border-slate-100">
                        <h4 className="font-semibold text-slate-900 mb-1">{stage.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {stage.description}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Next Question Section */}
      {nextQuestion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: stages.length * 0.1 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">?</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Let&apos;s refine your roadmap</h3>
              <p className="text-slate-700 leading-relaxed">{nextQuestion}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Proceed to Reality CTA */}
      {showProceedToReality && stages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: stages.length * 0.1 + 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 shadow-xl"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Rocket className="w-7 h-7 text-white" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-white mb-1">
                Ready to make it real?
              </h3>
              <p className="text-white/90 text-sm leading-relaxed">
                Sign up to save your roadmap, track progress, and get personalized guidance on your journey.
              </p>
            </div>

            <button
              onClick={handleProceedToReality}
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-100"
            >
              <span>Proceed to Reality</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Animated sparkles */}
          <motion.div
            className="absolute top-4 right-20 text-white/40"
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// Compact variant for chat messages
export function DreamTimelineCompact({ stages, className }: { stages: RoadmapStage[]; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {stages.map((stage, index) => {
        const colorClass = stageColors[index % stageColors.length];
        const isLast = index === stages.length - 1;

        return (
          <div key={`${stage.order}-${index}`} className="relative flex items-start gap-3">
            {/* Timeline Node & Line */}
            <div className="flex flex-col items-center">
              <motion.div
                custom={index}
                initial="hidden"
                animate="visible"
                variants={nodeVariants}
                className={cn(
                  'relative z-10 w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br shadow-md flex-shrink-0',
                  colorClass
                )}
              >
                <span className="text-white font-bold text-xs">{stage.order}</span>
              </motion.div>
              {!isLast && (
                <motion.div
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={lineVariants}
                  className="w-0.5 flex-1 min-h-[24px] bg-gradient-to-b from-slate-300 to-slate-200"
                />
              )}
            </div>

            {/* Content */}
            <motion.div
              custom={index}
              initial="hidden"
              animate="visible"
              variants={contentVariants}
              className="flex-1 pt-0.5 pb-2"
            >
              <div className="text-sm">
                <span className="font-semibold text-slate-900">{stage.title}</span>
                <span className="text-slate-500 mx-1.5">—</span>
                <span className="text-slate-600">{stage.description}</span>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
