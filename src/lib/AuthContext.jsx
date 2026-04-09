import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as apiAuth } from '../api/client';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);

  const saveToken = (token) => {
    localStorage.setItem('authToken', token);
  };

  const clearToken = () => {
    localStorage.removeItem('authToken');
  };

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
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      return userData;
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);

      // ✅ Only wipe the token on a real 401 — not on network hiccups
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        clearToken();
        setAuthError({ type: 'auth_required', message: err.message });
      }
      // ✅ On network errors, keep the token so user isn't logged out
      setIsLoadingAuth(false);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const doLogin = async (email, password) => {
    try {
      const res = await apiAuth.login(email, password);
      if (res.token || res.access_token) {
        saveToken(res.token || res.access_token);
        await fetchUser();
      } else {
        return { error: 'No token received from server' };
      }
      return res;
    } catch (err) {
      return { error: err.message };
    }
  };

  const doRegister = async (userData) => {
    try {
      const res = await apiAuth.register(userData);
      if (res.token || res.access_token) {
        saveToken(res.token || res.access_token);
        await fetchUser();
      } else {
        return { error: 'No token received from server' };
      }
      return res;
    } catch (err) {
      return { error: err.message };
    }
  };

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
        isLoadingPublicSettings: false,
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