import React, { createContext, useState, useContext, useEffect } from 'react';
import { validateToken, refreshAccessToken, logoutUser } from '../api/authApi';
import socketService from '../services/socketService';

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
          // Check if this is a testing mode token (dummy token)
          const isTestingMode = accessToken.startsWith('dummy-access-token-');
          
          if (isTestingMode) {
            // For testing mode, always accept the token
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
            setTokens({
              accessToken,
              refreshToken
            });
          } else {
            // Validate the token with the backend
            try {
              const isValid = await validateToken();
              
              if (isValid) {
                setUser(JSON.parse(savedUser));
                setIsAuthenticated(true);
                const userTokens = {
                  accessToken,
                  refreshToken
                };
                setTokens(userTokens);
                
                // Connect to Socket.io for real-time features
                socketService.connect(accessToken);
              } else {
                // Token is invalid, try to refresh
                if (refreshToken) {
                  try {
                    const refreshResult = await refreshAccessToken();
                    if (refreshResult.success) {
                      setUser(JSON.parse(savedUser));
                      setIsAuthenticated(true);
                      setTokens(refreshResult.tokens);
                      
                      // Connect to Socket.io for real-time features
                      socketService.connect(refreshResult.tokens.accessToken);
                    } else {
                      // Refresh failed, clear everything
                      console.warn('Token validation and refresh failed, clearing auth');
                      clearAuthData();
                    }
                  } catch (error) {
                    // Refresh failed, clear everything
                    console.warn('Token refresh error:', error);
                    clearAuthData();
                  }
                } else {
                  // No refresh token, clear everything
                  console.warn('No refresh token available, clearing auth');
                  clearAuthData();
                }
              }
            } catch (error) {
              // If validateToken throws an error (network issue, etc.), 
              // don't immediately clear auth - try refresh first
              console.warn('Token validation error:', error);
              if (refreshToken) {
                try {
                  const refreshResult = await refreshAccessToken();
                  if (refreshResult.success) {
                    setUser(JSON.parse(savedUser));
                    setIsAuthenticated(true);
                    setTokens(refreshResult.tokens);
                    socketService.connect(refreshResult.tokens.accessToken);
                  } else {
                    clearAuthData();
                  }
                } catch (refreshError) {
                  console.warn('Token refresh also failed:', refreshError);
                  clearAuthData();
                }
              } else {
                clearAuthData();
              }
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
        
        // Connect to Socket.io for real-time features
        if (!userTokens.accessToken.startsWith('dummy-access-token-')) {
          socketService.connect(userTokens.accessToken);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Disconnect Socket.io
      socketService.disconnect();
      
      // Call backend logout if we have tokens and it's not testing mode
      if (tokens?.refreshToken && !tokens.refreshToken.startsWith('dummy-refresh-token-')) {
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
      // If in testing mode, don't actually refresh tokens
      if (tokens?.refreshToken?.startsWith('dummy-refresh-token-')) {
        return true; // Always succeed in testing mode
      }
      
      const result = await refreshAccessToken();
      if (result.success) {
        updateTokens(result.tokens);
        // Reconnect Socket.io with new token
        if (result.tokens.accessToken) {
          socketService.disconnect();
          socketService.connect(result.tokens.accessToken);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Only logout if refresh token is actually expired/invalid
      // Don't logout on network errors - let user retry
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        await logout();
      }
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
      refreshTokens,
      socketService
    }}>
      {children}
    </AuthContext.Provider>
  );
}
