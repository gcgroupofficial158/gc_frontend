import React, { createContext, useState, useContext, useEffect } from 'react';
import { validateToken, refreshAccessToken, logoutUser } from '../api/authApi';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);

  // Load user data and validate token on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedAuth = localStorage.getItem('isAuthenticated');
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (savedUser && savedAuth === 'true' && accessToken) {
          // Validate the token with the backend
          const isValid = await validateToken();
          
          if (isValid) {
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
            setTokens({
              accessToken,
              refreshToken
            });
          } else {
            // Token is invalid, try to refresh
            if (refreshToken) {
              try {
                const refreshResult = await refreshAccessToken();
                if (refreshResult.success) {
                  setUser(JSON.parse(savedUser));
                  setIsAuthenticated(true);
                  setTokens(refreshResult.tokens);
                } else {
                  // Refresh failed, clear everything
                  clearAuthData();
                }
              } catch (error) {
                // Refresh failed, clear everything
                clearAuthData();
              }
            } else {
              // No refresh token, clear everything
              clearAuthData();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearAuthData = () => {
    setIsAuthenticated(false);
    setUser(null);
    setTokens(null);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const login = async (userData, userTokens = null) => {
    try {
      setIsAuthenticated(true);
      setUser(userData);
      setTokens(userTokens);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      
      if (userTokens) {
        localStorage.setItem('accessToken', userTokens.accessToken);
        localStorage.setItem('refreshToken', userTokens.refreshToken);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout if we have tokens
      if (tokens?.refreshToken) {
        await logoutUser();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local data
      clearAuthData();
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const updateTokens = (newTokens) => {
    setTokens(newTokens);
    if (newTokens) {
      localStorage.setItem('accessToken', newTokens.accessToken);
      localStorage.setItem('refreshToken', newTokens.refreshToken);
    }
  };

  const refreshTokens = async () => {
    try {
      const result = await refreshAccessToken();
      if (result.success) {
        updateTokens(result.tokens);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      loading,
      tokens,
      login, 
      logout, 
      updateUser,
      updateTokens,
      refreshTokens
    }}>
      {children}
    </AuthContext.Provider>
  );
}
