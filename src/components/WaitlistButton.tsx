'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useWaitlist } from '@/contexts/WaitlistContext';
import { cn } from '@/lib/utils';

interface WaitlistButtonProps {
  children?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  source?: string;
  disabled?: boolean;
}

const WaitlistButton: React.FC<WaitlistButtonProps> = ({
  children = 'Join Waitlist',
  variant = 'default',
  size = 'default',
  className,
  source = 'button',
  disabled = false,
}) => {
  const { openWaitlistModal } = useWaitlist();

  const handleClick = () => {
    openWaitlistModal(source);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        variant === 'default' && 'bg-blue-600 hover:bg-blue-700',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

export default WaitlistButton; 