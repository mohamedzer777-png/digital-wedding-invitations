'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, tokens } from './api';
import type { AuthResponse, User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Hydrate the session from a stored token on first load.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!tokens.getAccess()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get<{ user: User }>('/auth/me');
        if (active) setUser(data.user);
      } catch {
        tokens.clear();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const applyAuth = (data: AuthResponse) => {
    tokens.set(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    applyAuth(data);
    router.push('/dashboard');
  };

  const signup = async (name: string, email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/signup', { name, email, password });
    applyAuth(data);
    router.push('/dashboard');
  };

  const logout = async () => {
    const refreshToken = tokens.getRefresh();
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      /* ignore — clear locally regardless */
    }
    tokens.clear();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
