'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { calculateCountdown, type CountdownResult } from '@/lib/utils/timezone';

interface DeadlineCountdownProps {
  deadline: string | Date;
  showIcon?: boolean;
  showBadge?: boolean;
  compact?: boolean;
  className?: string;
}

export function DeadlineCountdown({
  deadline,
  showIcon = true,
  showBadge = false,
  compact = false,
  className = '',
}: DeadlineCountdownProps) {
  const [countdown, setCountdown] = useState<CountdownResult | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const result = calculateCountdown(deadline);
      setCountdown(result);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline]);

  if (!countdown) {
    return <div className="animate-pulse h-6 w-24 bg-gray-200 rounded"></div>;
  }

  const getIconComponent = () => {
    switch (countdown.urgencyLevel) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getColorClass = () => {
    switch (countdown.urgencyLevel) {
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'urgent':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-700 bg-green-50 border-green-200';
    }
  };

  const getTextColorClass = () => {
    switch (countdown.urgencyLevel) {
      case 'critical':
        return 'text-red-700';
      case 'urgent':
        return 'text-orange-700';
      case 'warning':
        return 'text-yellow-700';
      default:
        return 'text-green-700';
    }
  };

  if (countdown.isExpired) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <AlertCircle className="h-4 w-4 text-gray-400" />}
        <span className="text-sm text-gray-500">Deadline passed</span>
      </div>
    );
  }

  if (showBadge) {
    return (
      <Badge variant="outline" className={`${getColorClass()} ${className}`}>
        <div className="flex items-center gap-1.5">
          {showIcon && getIconComponent()}
          <span className="font-medium">{countdown.displayText}</span>
        </div>
      </Badge>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && getIconComponent()}
        <span className={`text-sm font-medium ${getTextColorClass()}`}>
          {countdown.displayText}
        </span>
      </div>
    );
  }

  // Full display
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && (
        <div className={`p-2 rounded-full ${getColorClass()}`}>
          {getIconComponent()}
        </div>
      )}
      <div>
        <div className={`text-2xl font-bold ${getTextColorClass()}`}>
          {countdown.displayText}
        </div>
        <div className="text-sm text-gray-600">
          {countdown.urgencyLevel === 'critical' && 'Due very soon!'}
          {countdown.urgencyLevel === 'urgent' && 'Due today!'}
          {countdown.urgencyLevel === 'warning' && 'Due soon'}
          {countdown.urgencyLevel === 'safe' && 'Plenty of time'}
        </div>
      </div>
    </div>
  );
}

interface DetailedCountdownProps {
  deadline: string | Date;
  className?: string;
}

export function DetailedCountdown({ deadline, className = '' }: DetailedCountdownProps) {
  const [countdown, setCountdown] = useState<CountdownResult | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const result = calculateCountdown(deadline);
      setCountdown(result);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [deadline]);

  if (!countdown || countdown.isExpired) {
    return null;
  }

  return (
    <div className={`grid grid-cols-4 gap-2 ${className}`}>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{countdown.days}</div>
        <div className="text-xs text-gray-500">Days</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{countdown.hours}</div>
        <div className="text-xs text-gray-500">Hours</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{countdown.minutes}</div>
        <div className="text-xs text-gray-500">Minutes</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{countdown.seconds}</div>
        <div className="text-xs text-gray-500">Seconds</div>
      </div>
    </div>
  );
}
