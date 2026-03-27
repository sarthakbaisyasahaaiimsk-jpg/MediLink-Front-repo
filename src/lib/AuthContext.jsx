import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as apiAuth } from '../api/client'; // relative path from src/lib to src/api
import { useNavigate } from 'react-router-dom';

// Create context
const AuthContext = createContext();

// Custom hook
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Save token to localStorage
  const saveToken = (token) => {
    localStorage.setItem('authToken', token);
  };

  // Clear token
  const clearToken = () => {
    localStorage.removeItem('authToken');
  };

  // Fetch current user
  const fetchUser = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoadingAuth(false);
      return null;
    }

    try {
      const userData = await apiAuth.me();
      if (!userData) {
        setIsAuthenticated(false);
        setUser(null);
        clearToken();
        setAuthError({ type: 'auth_required' });
      } else {
        setUser(userData);
        setIsAuthenticated(true);
      }
      setIsLoadingAuth(false);
      return userData;
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
      clearToken();
      setAuthError({ type: 'auth_required', message: err.message });
      setIsLoadingAuth(false);
      return null;
    }
  }, []);

  // Run on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Login function
  const doLogin = async (email, password) => {
    try {
      const res = await apiAuth.login(email, password);
      if (res.token) {
        saveToken(res.token);
        await fetchUser();
      }
      return res;
    } catch (err) {
      return { error: err.message };
    }
  };

  // Register function
  const doRegister = async (userData) => {
    try {
      const res = await apiAuth.register(userData);
      if (res.token) {
        saveToken(res.token);
        await fetchUser();
      }
      return res;
    } catch (err) {
      return { error: err.message };
    }
  };

  // Logout
  const logout = () => {
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authError,
        saveToken,
        fetchUser,
        doLogin,
        doRegister,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};