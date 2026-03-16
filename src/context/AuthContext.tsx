import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, lang: 'en' | 'bn') => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  logout: () => void;
  setLanguage: (lang: 'en' | 'bn') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { user } = await api.auth.me();
          setUser(user);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const { token, user } = await api.auth.login(email, pass);
    localStorage.setItem('token', token);
    setUser(user);
  };

  const register = async (name: string, email: string, pass: string, lang: 'en' | 'bn') => {
    const { token, user } = await api.auth.register(name, email, pass, lang);
    localStorage.setItem('token', token);
    setUser(user);
  };

  const updateProfile = async (profileData: any) => {
    const { user: updatedUser } = await api.auth.updateProfile(profileData);
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const setLanguage = (lang: 'en' | 'bn') => {
    if (user) {
      setUser({ ...user, language: lang });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, updateProfile, logout, setLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
