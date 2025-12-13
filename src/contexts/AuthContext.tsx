'use client';

import React, { createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut, signUp, useSession } from '@/lib/auth-client';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { data: session, isPending: loading } = useSession();

  const user = session?.user ? {
    id: session.user.id,
    name: session.user.name || '',
    email: session.user.email,
  } : null;

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.data) {
        router.push('/new-dashboard');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.data) {
        router.push('/new-dashboard');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/signin');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};