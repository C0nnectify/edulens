'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, TrendingUp, Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StageConfig } from '@/types/roadmap';

interface StageDetailSidebarProps {
  stage: StageConfig;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onClose?: () => void;
}

export function StageDetailSidebar({ 
  stage,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  onClose
}: StageDetailSidebarProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-full max-h-full"
      >
        {/* Header with theme color */}
        <div
          className="p-6 text-white flex-shrink-0 relative"
          style={{
            background: `linear-gradient(135deg, ${stage.themeColor} 0%, ${stage.themeColor}dd 100%)`
          }}
        >
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors z-10"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-3 mb-2 pr-8">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-lg font-bold">
              {stage.order}
            </div>
            <h2 className="text-2xl font-bold flex-1">
              {stage.shortLabel}
            </h2>
          </div>
          <h3 className="text-sm opacity-90 font-medium">
            {stage.fullTitle}
          </h3>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          
          {/* Goal Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-bold text-slate-900">Goal</h4>
            </div>
            <p className="text-slate-700 leading-relaxed pl-10">
              {stage.goal}
            </p>
          </div>

          {/* Do's Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <h4 className="font-bold text-slate-900">Do&apos;s</h4>
            </div>
            <ul className="space-y-3">
              {stage.dos.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-3 text-sm text-slate-700 leading-relaxed"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Don'ts Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <h4 className="font-bold text-slate-900">Don&apos;ts</h4>
            </div>
            <ul className="space-y-3">
              {stage.donts.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-3 text-sm text-slate-700 leading-relaxed"
                >
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* EduLens Feature Hook */}
          <div
            className="rounded-xl p-5"
            style={{
              background: `linear-gradient(135deg, ${stage.themeColor}10 0%, ${stage.themeColor}05 100%)`,
              border: `1px solid ${stage.themeColor}30`
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stage.themeColor}20` }}
              >
                <Sparkles className="w-4 h-4" style={{ color: stage.themeColor }} />
              </div>
              <h4 className="font-bold text-slate-900">
                {stage.edulensFeatureHook.title}
              </h4>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pl-10">
              {stage.edulensFeatureHook.body}
            </p>
          </div>

          {/* Meta Info */}
          <div className="flex gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              <span>{stage.meta.durationHint}</span>
            </div>
            <div>
              <span className={`
                px-3 py-1 rounded-full text-xs font-semibold
                ${stage.meta.difficulty === 'easy' ? 'bg-green-100 text-green-700' : ''}
                ${stage.meta.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${stage.meta.difficulty === 'hard' ? 'bg-red-100 text-red-700' : ''}
              `}>
                {stage.meta.difficulty.charAt(0).toUpperCase() + stage.meta.difficulty.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Footer with Navigation */}
        <div className="p-4 border-t bg-slate-50 flex-shrink-0">
          <div className="flex gap-3">
            <Button
              onClick={onPrevious}
              disabled={!hasPrevious}
              variant="outline"
              className="flex-1 gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              onClick={onNext}
              disabled={!hasNext}
              className="flex-1 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
