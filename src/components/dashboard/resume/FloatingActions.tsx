'use client';

import { motion } from 'framer-motion';
import { Eye, EyeOff, Download, Check, Loader2, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FloatingActionsProps {
  onTogglePreview: () => void;
  onExport: () => void;
  onSave: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  isSaving: boolean;
  showPreview: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function FloatingActions({
  onTogglePreview,
  onExport,
  onSave,
  onUndo,
  onRedo,
  isSaving,
  showPreview,
  canUndo = false,
  canRedo = false,
}: FloatingActionsProps) {
  const buttonVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 },
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-8 right-8 flex flex-col gap-3 z-50"
      >
        {/* Undo Button */}
        {onUndo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                whileHover={canUndo ? "hover" : undefined}
                whileTap={canUndo ? "tap" : undefined}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
              >
                <Button
                  onClick={onUndo}
                  size="icon"
                  disabled={!canUndo}
                  className={cn(
                    "h-12 w-12 rounded-full shadow-lg border-2 border-white transition-all",
                    canUndo
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                >
                  <Undo2 className="h-5 w-5" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="left" className="font-medium">
              Undo
              <div className="text-xs text-gray-400 mt-1">Ctrl+Z</div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Redo Button */}
        {onRedo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                whileHover={canRedo ? "hover" : undefined}
                whileTap={canRedo ? "tap" : undefined}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.15 }}
              >
                <Button
                  onClick={onRedo}
                  size="icon"
                  disabled={!canRedo}
                  className={cn(
                    "h-12 w-12 rounded-full shadow-lg border-2 border-white transition-all",
                    canRedo
                      ? "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                >
                  <Redo2 className="h-5 w-5" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="left" className="font-medium">
              Redo
              <div className="text-xs text-gray-400 mt-1">Ctrl+Shift+Z</div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Separator */}
        {(onUndo || onRedo) && (
          <div className="h-px bg-gray-300 mx-4" />
        )}

        {/* Toggle Preview Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
            >
              <Button
                onClick={onTogglePreview}
                size="icon"
                className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-4 border-white"
              >
                {showPreview ? (
                  <EyeOff className="h-6 w-6" />
                ) : (
                  <Eye className="h-6 w-6" />
                )}
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-medium">
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </TooltipContent>
        </Tooltip>

        {/* Export Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.25 }}
            >
              <Button
                onClick={onExport}
                size="icon"
                className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-4 border-white"
              >
                <Download className="h-6 w-6" />
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-medium">
            Export as PDF
            <div className="text-xs text-gray-400 mt-1">Ctrl+P</div>
          </TooltipContent>
        </Tooltip>

        {/* Save Button with Auto-save Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
            >
              <Button
                onClick={onSave}
                size="icon"
                disabled={isSaving}
                className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-4 border-white disabled:opacity-100 relative"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-white border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </>
                ) : (
                  <Check className="h-6 w-6" />
                )}
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-medium">
            {isSaving ? 'Saving...' : 'Save Resume'}
            <div className="text-xs text-gray-400 mt-1">
              {isSaving ? 'Please wait' : 'Auto-saves every 3 seconds'}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Ripple Effect Background */}
        {isSaving && (
          <motion.div
            className="absolute bottom-0 right-0 h-14 w-14 rounded-full bg-green-400/30"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.div>
    </TooltipProvider>
  );
}
