'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import WaitlistModal from '@/components/WaitlistModal';

interface WaitlistContextType {
  openWaitlistModal: (source?: string) => void;
  closeWaitlistModal: () => void;
  isWaitlistModalOpen: boolean;
}

const WaitlistContext = createContext<WaitlistContextType | undefined>(undefined);

export const useWaitlist = () => {
  const context = useContext(WaitlistContext);
  if (context === undefined) {
    throw new Error('useWaitlist must be used within a WaitlistProvider');
  }
  return context;
};

interface WaitlistProviderProps {
  children: ReactNode;
}

export const WaitlistProvider: React.FC<WaitlistProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerSource, setTriggerSource] = useState('general');

  const openWaitlistModal = (source: string = 'general') => {
    setTriggerSource(source);
    setIsOpen(true);
  };

  const closeWaitlistModal = () => {
    setIsOpen(false);
  };

  const value: WaitlistContextType = {
    openWaitlistModal,
    closeWaitlistModal,
    isWaitlistModalOpen: isOpen,
  };

  return (
    <WaitlistContext.Provider value={value}>
      {children}
      <WaitlistModal
        open={isOpen}
        onOpenChange={setIsOpen}
        triggerSource={triggerSource}
      />
    </WaitlistContext.Provider>
  );
}; 