'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { InsightNotification as InsightNotificationType } from '@/types/insights';
import { X, Info, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightNotificationProps {
  notification: InsightNotificationType;
  onDismiss: (id: string) => void;
  onAction?: (notification: InsightNotificationType) => void;
}

export function InsightNotification({
  notification,
  onDismiss,
  onAction,
}: InsightNotificationProps) {
  const iconMap = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle2,
    error: AlertCircle,
  };

  const colorMap = {
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  };

  const textColorMap = {
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
  };

  const Icon = iconMap[notification.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-lg border p-4 shadow-lg',
        colorMap[notification.severity]
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', textColorMap[notification.severity])} />

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {notification.message}
          </p>

          {notification.actionLabel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAction?.(notification)}
              className="mt-2 h-auto p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {notification.actionLabel} →
            </Button>
          )}
        </div>

        <button
          onClick={() => onDismiss(notification.id)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

interface NotificationCenterProps {
  notifications: InsightNotificationType[];
  onDismiss: (id: string) => void;
  onAction?: (notification: InsightNotificationType) => void;
  maxVisible?: number;
}

export function NotificationCenter({
  notifications,
  onDismiss,
  onAction,
  maxVisible = 3,
}: NotificationCenterProps) {
  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div className="fixed top-20 right-4 z-50 w-full max-w-md space-y-2">
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification) => (
          <InsightNotification
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        ))}
      </AnimatePresence>

      {notifications.length > maxVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full"
          >
            {notifications.length - maxVisible} more notifications
          </Button>
        </motion.div>
      )}
    </div>
  );
}
