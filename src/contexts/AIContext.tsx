'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AIInteraction {
  id: string;
  type: 'chat' | 'search' | 'scheduling' | 'recommendation';
  timestamp: Date;
  query: string;
  response?: string;
  status: 'pending' | 'completed' | 'error';
}

interface AIContextType {
  interactions: AIInteraction[];
  addInteraction: (interaction: Omit<AIInteraction, 'id' | 'timestamp'>) => void;
  updateInteraction: (id: string, updates: Partial<AIInteraction>) => void;
  clearInteractions: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

interface AIProviderProps {
  children: ReactNode;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [interactions, setInteractions] = useState<AIInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addInteraction = (interaction: Omit<AIInteraction, 'id' | 'timestamp'>) => {
    const newInteraction: AIInteraction = {
      ...interaction,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setInteractions(prev => [...prev, newInteraction]);
  };

  const updateInteraction = (id: string, updates: Partial<AIInteraction>) => {
    setInteractions(prev => 
      prev.map(interaction => 
        interaction.id === id 
          ? { ...interaction, ...updates }
          : interaction
      )
    );
  };

  const clearInteractions = () => {
    setInteractions([]);
  };

  const value: AIContextType = {
    interactions,
    addInteraction,
    updateInteraction,
    clearInteractions,
    isLoading,
    setIsLoading,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};
