// src/api/apiInterceptor.js

import { refreshAccessToken } from './authApi';

// API interceptor to handle token refresh automatically
export const setupApiInterceptor = () => {
  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch to add token refresh logic
  window.fetch = async (url, options = {}) => {
    // Make the original request
    let response = await originalFetch(url, options);

    // If we get a 401 (Unauthorized), try to refresh the token
    if (response.status === 401 && url.includes('/api/')) {
      try {
        const refreshResult = await refreshAccessToken();
        
        if (refreshResult.success) {
          // Retry the original request with the new token
          const newOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${refreshResult.tokens.accessToken}`
            }
          };
          
          response = await originalFetch(url, newOptions);
        } else {
          // Refresh failed, redirect to login
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Redirect to login on refresh failure
        window.location.href = '/login';
      }
    }

    return response;
  };
};

// Initialize the interceptor
setupApiInterceptor();
