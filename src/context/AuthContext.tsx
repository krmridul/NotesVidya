import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.js';
import { api } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string; confirmPassword: string }) => Promise<void>;
  setupAdmin: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  setAuthSession: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('dps_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('dps_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.getMe();
        setUser(user);
      } catch (err) {
        console.warn('Session expired or invalid, clearing token', err);
        localStorage.removeItem('dps_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('dps_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: { name: string; email: string; phone: string; password: string; confirmPassword: string }) => {
    const res = await api.register(data);
    localStorage.setItem('dps_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const setupAdmin = async (data: { name: string; email: string; phone: string; password: string }) => {
    const res = await api.setupAdmin(data);
    localStorage.setItem('dps_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const setAuthSession = (authenticatedUser: User, sessionToken: string) => {
    localStorage.setItem('dps_token', sessionToken);
    setToken(sessionToken);
    setUser(authenticatedUser);
  };

  const logout = () => {
    localStorage.removeItem('dps_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin: user?.role === 'admin',
        login,
        register,
        setupAdmin,
        setAuthSession,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
