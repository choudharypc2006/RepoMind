import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const rawApiUrl =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // true on first load

  // On mount, check if user already has a valid session cookie or stored token
  const checkAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('repomind_token');
      const headers = { 'Content-Type': 'application/json' };
      if (storedToken) {
        headers.Authorization = `Bearer ${storedToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers,
        credentials: 'include', // send HTTP-only cookie
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('repomind_token');
      }
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Register a new user
  const registerUser = async ({ name, email, password }) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    if (data.token) {
      localStorage.setItem('repomind_token', data.token);
    }
    setUser(data.user);
    setIsAuthenticated(true);
    return data.user;
  };

  // Log in an existing user
  const loginUser = async ({ email, password }) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    if (data.token) {
      localStorage.setItem('repomind_token', data.token);
    }
    setUser(data.user);
    setIsAuthenticated(true);
    return data.user;
  };

  // Log out current user
  const logoutUser = async () => {
    try {
      const storedToken = localStorage.getItem('repomind_token');
      const headers = { 'Content-Type': 'application/json' };
      if (storedToken) {
        headers.Authorization = `Bearer ${storedToken}`;
      }

      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
    } catch (err) {
      // Even if the request fails, clear local state
    } finally {
      localStorage.removeItem('repomind_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isAuthLoading, loginUser, registerUser, logoutUser, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy usage in any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
};

export default AuthContext;

