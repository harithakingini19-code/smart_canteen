import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  staffLogin as apiStaffLogin,
  adminLogin as apiAdminLogin,
  getStoredUser,
  isAuthenticated,
  fetchProfile
} from '../services/auth';
import { getErrorMessage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true); // initial auth check

  // On mount: if we have a token, re-fetch profile to ensure it's still valid
  useEffect(() => {
    const init = async () => {
      if (isAuthenticated()) {
        try {
          const freshUser = await fetchProfile();
          setUser(freshUser);
        } catch {
          // Token is invalid — clear everything
          setUser(null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // Listen for auth:logout event dispatched by the Axios interceptor
  useEffect(() => {
    const handleLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (credentials) => {
    const userData = await apiLogin(credentials);
    setUser(userData);
    return userData;
  }, []);

  const staffLoginAction = useCallback(async (credentials) => {
    const userData = await apiStaffLogin(credentials);
    setUser(userData);
    return userData;
  }, []);

  const adminLoginAction = useCallback(async (credentials) => {
    const userData = await apiAdminLogin(credentials);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const result = await apiRegister(formData);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    staffLogin: staffLoginAction,
    adminLogin: adminLoginAction,
    logout,
    register,
    setUser,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
