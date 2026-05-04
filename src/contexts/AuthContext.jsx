import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api/authApi';

export const ROLE_HOME = {
  admin:   '/app/dashboard',
  student: '/app/homework',
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const sessionUser = await authApi.getCurrentUser();
        setUser(sessionUser);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const isAuthenticated = !!user;

  /**
   * login(email, password)
   */
  const login = async (email, password) => {
    try {
      const result = await authApi.login(email, password);
      if (result.ok) {
        setUser(result.user);
      }
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { ok: false, error: 'Đã có lỗi xảy ra khi đăng nhập.' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

