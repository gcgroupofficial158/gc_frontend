// src/api/authApi.js

// Backend API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

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
    throw error;
  }
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
    throw new Error(error.message || 'Login failed');
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
  