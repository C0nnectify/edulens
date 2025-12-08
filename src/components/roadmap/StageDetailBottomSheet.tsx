'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, TrendingUp, Sparkles, ChevronDown } from 'lucide-react';
import { Drawer } from 'vaul';
import type { StageConfig } from '@/types/roadmap';

interface StageDetailBottomSheetProps {
  stage: StageConfig;
  isOpen: boolean;
  onClose: () => void;
}

export function StageDetailBottomSheet({ stage, isOpen, onClose }: StageDetailBottomSheetProps) {
  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
      <Drawer.Portal>
        <Drawer.Overlay 
          className="fixed inset-0 bg-black/40 md:hidden" 
          onClick={onClose}
        />
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl md:hidden"
          aria-labelledby="drawer-title"
          aria-describedby="drawer-description"
        >
          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 mt-4 mb-2" />
          
          <div className="flex items-center justify-center gap-2 py-2 text-slate-400 text-sm">
            <ChevronDown className="w-4 h-4" />
            <span>Swipe down to minimize</span>
          </div>

          {/* Header with theme color */}
          <div
            className="px-6 py-5 text-white"
            style={{
              background: `linear-gradient(135deg, ${stage.themeColor} 0%, ${stage.themeColor}dd 100%)`
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-lg font-bold">
                {stage.order}
              </div>
              <Drawer.Title className="text-xl font-bold flex-1">
                {stage.shortLabel}
              </Drawer.Title>
            </div>
            <Drawer.Description className="text-sm opacity-90 font-medium">
              {stage.fullTitle}
            </Drawer.Description>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-10rem)] p-6 space-y-6">
            
            {/* Goal Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-bold text-slate-900">Goal</h4>
              </div>
              <p className="text-slate-700 leading-relaxed text-sm">
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
                <h4 className="font-bold text-slate-900 text-sm">
                  {stage.edulensFeatureHook.title}
                </h4>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {stage.edulensFeatureHook.body}
              </p>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 pt-4 border-t">
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

            {/* Bottom padding for safe area */}
            <div className="h-8" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}