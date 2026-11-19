import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getAdminProfile, signInAdmin, signOutAdmin } from '../services/authService';

interface AuthContextType {
  user: AdminProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isDevMockMode: boolean;
  setDevMockLogin: (enable: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_MOCK_ADMIN: AdminProfile = {
  id: 'dev-admin-001',
  email: 'admin@knrenterprises.in',
  fullName: 'K. Narendar Reddy (Managing Partner)',
  role: 'super_admin',
  phone: '+91 8886175855',
  lastLogin: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDevMockMode, setIsDevMockMode] = useState<boolean>(() => {
    // If Supabase is not configured, enable local dev preview mode so admin dashboard can be tested
    return !isSupabaseConfigured();
  });

  const refreshProfile = async () => {
    if (!isSupabaseConfigured()) {
      const savedMock = localStorage.getItem('knr_dev_mock_session');
      if (savedMock === 'true') {
        setUser(DEV_MOCK_ADMIN);
      }
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getAdminProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();

    if (isSupabaseConfigured()) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const profile = await getAdminProfile(session.user.id);
            setUser(profile);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    if (isSupabaseConfigured()) {
      const result = await signInAdmin(email, password);
      setIsLoading(false);
      if (result.user) {
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.error || 'Authentication failed');
        return { success: false, error: result.error || 'Authentication failed' };
      }
    }

    // Dev preview mode: if Supabase credentials are not yet added to .env
    // Allow admin testing with prompt feedback
    setIsLoading(false);
    if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('knr')) {
      setUser(DEV_MOCK_ADMIN);
      localStorage.setItem('knr_dev_mock_session', 'true');
      return { success: true };
    }

    const err = 'Invalid administrator credentials. For dev testing use: admin@knrenterprises.in';
    setError(err);
    return { success: false, error: err };
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    await signOutAdmin();
    localStorage.removeItem('knr_dev_mock_session');
    setUser(null);
    setIsLoading(false);
  };

  const setDevMockLogin = (enable: boolean) => {
    if (enable) {
      setUser(DEV_MOCK_ADMIN);
      localStorage.setItem('knr_dev_mock_session', 'true');
    } else {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        refreshProfile,
        isDevMockMode,
        setDevMockLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

