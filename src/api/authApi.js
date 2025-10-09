// src/api/authApi.js

// Traditional email/password login
export async function loginUser(email, password) {
  try {
    // For demo purposes, we'll simulate a successful login
    // In a real app, you would make an API call to your backend
    if (email && password) {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock user data
      return {
        success: true,
        user: {
          id: 'user_' + Date.now(),
          email: email,
          name: email.split('@')[0], // Use email prefix as name
          provider: 'email',
          email_verified: true
        }
      };
    } else {
      throw new Error('Email and password are required');
    }
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
}

// Register new user
export async function registerUser(email, password, name) {
  try {
    // For demo purposes, we'll simulate a successful registration
    if (email && password) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        user: {
          id: 'user_' + Date.now(),
          email: email,
          name: name || email.split('@')[0],
          provider: 'email',
          email_verified: false
        }
      };
    } else {
      throw new Error('Email and password are required');
    }
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
}
  