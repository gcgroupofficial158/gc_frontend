// src/api/authApi.js

// Backend API configuration
import { API_CONFIG, ENV_INFO } from '../config/environment.js';

const API_BASE_URL = API_CONFIG.baseURL;

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error; // Don't fallback automatically - let the calling function handle it
  }
}

// Fallback function for when backend is not available
async function handleFallbackRequest(endpoint, options) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock responses based on endpoint
  if (endpoint === '/auth/login') {
    // Parse the request body to get email and password
    let email = '';
    let password = '';
    
    try {
      const body = JSON.parse(options.body || '{}');
      email = body.email || '';
      password = body.password || '';
    } catch (e) {
      // If we can't parse the body, use defaults
    }
    
    // Simulate different login scenarios based on email/password
    if (!email || !password) {
      return {
        success: false,
        message: 'Email and password are required',
        statusCode: 400
      };
    }
    
    // Simulate invalid credentials for specific test cases
    if (email === 'wrong@example.com' || password === 'wrongpassword') {
      return {
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
        statusCode: 401
      };
    }
    
    if (email === 'notfound@example.com') {
      return {
        success: false,
        message: 'User not found. Please check your email address.',
        statusCode: 404
      };
    }
    
    // For any other email/password combination, simulate successful login
    return {
      success: true,
      message: 'Login successful (fallback mode)',
      data: {
        user: {
          id: 'fallback-user-123',
          firstName: 'Test',
          lastName: 'User',
          email: email,
          emailVerified: true,
          provider: 'email',
          role: 'user'
        },
        tokens: {
          accessToken: 'fallback-access-token-' + Date.now(),
          refreshToken: 'fallback-refresh-token-' + Date.now()
        }
      }
    };
  }
  
  if (endpoint === '/auth/register') {
    return {
      success: true,
      message: 'Registration successful (fallback mode)',
      data: {
        user: {
          id: 'fallback-user-' + Date.now(),
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@example.com',
          emailVerified: true,
          provider: 'email',
          role: 'user'
        },
        tokens: {
          accessToken: 'fallback-access-token-' + Date.now(),
          refreshToken: 'fallback-refresh-token-' + Date.now()
        }
      }
    };
  }
  
  if (endpoint === '/auth/google') {
    return {
      success: true,
      message: 'Google authentication successful (fallback mode)',
      data: {
        user: {
          id: 'google-fallback-user-123',
          firstName: 'Google',
          lastName: 'User',
          email: 'google@example.com',
          emailVerified: true,
          provider: 'google',
          profilePicture: 'https://via.placeholder.com/150',
          role: 'user'
        },
        tokens: {
          accessToken: 'fallback-google-access-token-' + Date.now(),
          refreshToken: 'fallback-google-refresh-token-' + Date.now()
        }
      }
    };
  }
  
  // Default fallback response
  return {
    success: true,
    message: 'Request successful (fallback mode)',
    data: {}
  };
}

// Traditional email/password login
export async function loginUser(email, password, rememberMe = false) {
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        rememberMe
      })
    });

    if (response.success) {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      
      return {
        success: true,
        user: {
          id: response.data.user.id,
          email: response.data.user.email,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          name: `${response.data.user.firstName} ${response.data.user.lastName}`,
          provider: 'email',
          email_verified: response.data.user.emailVerified || false,
          role: response.data.user.role || 'user'
        },
        tokens: response.data.tokens
      };
    } else {
      throw new Error(response.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login API error:', error);
    
    // Check if it's a network error (backend not available)
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('aborted')) {
      throw new Error('Backend server is not running. Please start the backend server or enable testing mode.');
    }
    
    // Check for specific HTTP status codes
    if (error.message.includes('401')) {
      throw new Error('Invalid email or password. Please check your credentials.');
    }
    
    if (error.message.includes('404')) {
      throw new Error('User not found. Please check your email address.');
    }
    
    if (error.message.includes('400')) {
      throw new Error('Invalid request. Please check your input.');
    }
    
    if (error.message.includes('500')) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw new Error(error.message || 'Login failed. Please try again.');
  }
}

// Register new user
export async function registerUser(userData) {
  try {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        role: userData.role || 'user'
      })
    });

    if (response.success) {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      
      return {
        success: true,
        user: {
          id: response.data.user.id,
          email: response.data.user.email,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          name: `${response.data.user.firstName} ${response.data.user.lastName}`,
          provider: 'email',
          email_verified: response.data.user.emailVerified || false,
          role: response.data.user.role || 'user'
        },
        tokens: response.data.tokens
      };
    } else {
      throw new Error(response.message || 'Registration failed');
    }
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
}

// Logout user
export async function logoutUser() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
    }
    
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    return { success: true };
  } catch (error) {
    // Even if the API call fails, clear local tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    console.error('Logout error:', error);
    return { success: true };
  }
}

// Refresh access token
export async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiRequest('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });

    if (response.success) {
      // Update tokens in localStorage
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return {
        success: true,
        tokens: response.data
      };
    } else {
      throw new Error(response.message || 'Token refresh failed');
    }
  } catch (error) {
    // If refresh fails, clear tokens and redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    throw error;
  }
}

// Get user profile
export async function getUserProfile() {
  try {
    const response = await apiRequest('/auth/profile');
    
    if (response.success) {
      return {
        success: true,
        user: response.data
      };
    } else {
      throw new Error(response.message || 'Failed to get profile');
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to get profile');
  }
}

// Update user profile
export async function updateUserProfile(profileData) {
  try {
    const response = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    
    if (response.success) {
      return {
        success: true,
        user: response.data
      };
    } else {
      throw new Error(response.message || 'Failed to update profile');
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to update profile');
  }
}

// Change password
export async function changePassword(currentPassword, newPassword) {
  try {
    const response = await apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    
    if (response.success) {
      return { success: true };
    } else {
      throw new Error(response.message || 'Failed to change password');
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to change password');
  }
}

// Send password reset email
export async function sendPasswordReset(email) {
  try {
    const response = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    
    if (response.success) {
      return { success: true };
    } else {
      throw new Error(response.message || 'Failed to send password reset email');
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to send password reset email');
  }
}

// Reset password with token
export async function resetPassword(token, password) {
  try {
    const response = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
    
    if (response.success) {
      return { success: true };
    } else {
      throw new Error(response.message || 'Failed to reset password');
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to reset password');
  }
}

// Validate token
export async function validateToken() {
  try {
    const response = await apiRequest('/auth/validate-token');
    return response.success;
  } catch (error) {
    return false;
  }
}

// Get active sessions
export async function getActiveSessions() {
  try {
    const response = await apiRequest('/auth/sessions');
    
    if (response.success) {
      return {
        success: true,
        sessions: response.data.sessions
      };
    } else {
      throw new Error(response.message || 'Failed to get sessions');
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to get sessions');
  }
}

// Deactivate session
export async function deactivateSession(sessionId) {
  try {
    const response = await apiRequest(`/auth/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    
    if (response.success) {
      return { success: true };
    } else {
      throw new Error(response.message || 'Failed to deactivate session');
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to deactivate session');
  }
}

// Deactivate all sessions
export async function deactivateAllSessions() {
  try {
    const response = await apiRequest('/auth/sessions', {
      method: 'DELETE'
    });
    
    if (response.success) {
      return { success: true };
    } else {
      throw new Error(response.message || 'Failed to deactivate sessions');
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to deactivate sessions');
  }
}

// Google OAuth authentication
export async function googleAuth(idToken) {
  try {
    const response = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    });
    
    if (response.success) {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      
      return {
        success: true,
        user: response.data.user,
        tokens: response.data.tokens
      };
    } else {
      throw new Error(response.message || 'Google authentication failed');
    }
  } catch (error) {
    throw new Error(error.message || 'Google authentication failed');
  }
}

// Google OAuth callback
export async function googleCallback(code, state) {
  try {
    const response = await apiRequest('/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state })
    });
    
    if (response.success) {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      
      return {
        success: true,
        user: response.data.user,
        tokens: response.data.tokens
      };
    } else {
      throw new Error(response.message || 'Google OAuth callback failed');
    }
  } catch (error) {
    throw new Error(error.message || 'Google OAuth callback failed');
  }
}
  