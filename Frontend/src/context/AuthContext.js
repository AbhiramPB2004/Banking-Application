// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until initial auth check
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  const isLoggedIn = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

  /**
   * Show a toast notification
   */
  const showToast = useCallback((type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 5000);
  }, []);

  /**
   * Check if user is already authenticated (cookie still valid)
   */
  const checkAuth = useCallback(async () => {
    try {
      const res = await userAPI.getProfile();
      if (res.success && res.data) {
        setCurrentUser(res.data);
      }
    } catch {
      // Not authenticated — that's fine
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Listen for forced logout events dispatched by api.js
   * when the refresh token itself is expired/invalid.
   */
  useEffect(() => {
    const handleForcedLogout = () => {
      setCurrentUser(null);
      showToast('error', 'Your session has expired. Please log in again.');
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [showToast]);

  /**
   * Register a new user
   */
  const register = async (payload) => {
    const res = await authAPI.register(payload);
    if (res.success) {
      showToast('success', res.message || 'Verification OTP sent to your email.');
    }
    return res;
  };

  const verifyEmail = async (email, otp) => {
    const res = await authAPI.verifyEmail(email, otp);
    if (res.success) {
      await checkAuth();
      showToast('success', 'Email verified. Your account is active now.');
    }
    return res;
  };

  const resendVerificationOtp = async (email) => {
    const res = await authAPI.resendVerificationOtp(email);
    if (res.success) {
      showToast('success', 'Verification OTP sent again.');
    }
    return res;
  };

  const forgotPassword = async (email) => {
    const res = await authAPI.forgotPassword(email);
    if (res.success) {
      showToast('success', res.message || 'Password reset OTP sent.');
    }
    return res;
  };

  const resetPassword = async (email, otp, newPassword) => {
    const res = await authAPI.resetPassword(email, otp, newPassword);
    if (res.success) {
      showToast('success', 'Password reset successfully. Please log in.');
    }
    return res;
  };

  /**
   * Login
   */
  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    if (res.success) {
      await checkAuth();
      showToast('success', `Welcome back, ${res.user?.full_name || 'User'}!`);
    }
    return res;
  };

  /**
   * Logout — calls server-side endpoint to clear httpOnly cookies and revoke DB session.
   * Client-side cookie manipulation won't work for httpOnly cookies.
   */
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // best-effort — even if server fails, clear local state
    }
    setCurrentUser(null);
    showToast('info', 'You have been logged out safely.');
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    try {
      const res = await userAPI.getProfile();
      if (res.success) {
        setCurrentUser(res.data);
      }
    } catch {
      // ignore
    }
  };

  const value = {
    currentUser,
    isLoggedIn,
    isAdmin,
    isLoading,
    toast,
    showToast,
    register,
    verifyEmail,
    resendVerificationOtp,
    forgotPassword,
    resetPassword,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
