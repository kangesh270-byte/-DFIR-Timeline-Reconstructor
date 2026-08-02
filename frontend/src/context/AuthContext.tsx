import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchUserProfile } from '../api/api';

interface AuthContextValue {
  user: { username: string; title: string; xp: number; level: number; labsCompleted: number; averageAccuracy: number; totalTimeSpentMinutes: number } | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, full_name?: string, title?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_TOKEN_KEY = 'access_token';
const DEMO_PROFILE_KEY = 'dfir-auth-profile';

function createDemoToken(email: string) {
  return `demo-${window.btoa(`${email}:${Date.now()}`)}`;
}

function createDemoProfile(email: string, username?: string) {
  return {
    username: username ?? email.split('@')[0] ?? 'demo_user',
    title: 'DFIR Demo Analyst',
    xp: 1200,
    level: 3,
    labsCompleted: 2,
    averageAccuracy: 84,
    totalTimeSpentMinutes: 58,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user'] | null>(() => {
    const stored = localStorage.getItem(DEMO_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem(DEMO_TOKEN_KEY);
    if (!token) return;

    fetchUserProfile()
      .then((profile) => setUser(profile))
      .catch(() => {
        const stored = localStorage.getItem(DEMO_PROFILE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      });
  }, []);

  const login = async (email: string, password: string) => {
    const demoToken = createDemoToken(email);
    localStorage.setItem(DEMO_TOKEN_KEY, demoToken);
    const profile = createDemoProfile(email);
    localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
    setUser(profile);

    // TODO: Restore real authentication by calling backend login endpoint instead of generating a demo token.
  };

  const register = async (email: string, password: string, username: string, full_name?: string, title?: string) => {
    const demoToken = createDemoToken(email);
    localStorage.setItem(DEMO_TOKEN_KEY, demoToken);
    const profile = createDemoProfile(email, username);
    localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
    setUser(profile);

    // TODO: Restore real registration by calling backend register endpoint instead of generating a demo token.
  };

  const logout = () => {
    localStorage.removeItem(DEMO_TOKEN_KEY);
    localStorage.removeItem('refresh_token');
    localStorage.removeItem(DEMO_PROFILE_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), login, register, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
