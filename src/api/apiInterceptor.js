// src/api/apiInterceptor.js

// Store original fetch BEFORE importing anything that might use it
// This is exported so authApi can use it to bypass the interceptor
export const originalFetch = window.fetch;

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise = null;

// API interceptor to handle token refresh automatically
export const setupApiInterceptor = () => {
  // Override fetch to add token refresh logic
  window.fetch = async (url, options = {}) => {
    // Make the original request
    let response = await originalFetch(url, options);

    // Skip interceptor for refresh-token endpoint and login/register to prevent infinite loop
    const isRefreshTokenEndpoint = url.includes('/auth/refresh-token') || url.includes('/refresh-token');
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    
    // If we get a 401 (Unauthorized) and it's NOT the refresh-token or auth endpoint, try to refresh
    if (response.status === 401 && url.includes('/api/') && !isRefreshTokenEndpoint && !isAuthEndpoint) {
      // If already refreshing, wait for that to complete
      if (isRefreshing && refreshPromise) {
        try {
          await refreshPromise;
          // Retry the original request with potentially new token
          const newOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          };
          response = await originalFetch(url, newOptions);
        } catch (error) {
          // Refresh failed, return original 401 response
          console.warn('Token refresh failed while waiting:', error);
        }
        return response;
      }

      // Start refresh process
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            // Dynamic import to avoid circular dependency
            const { refreshAccessToken } = await import('./authApi');
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
              // Refresh failed, but don't force redirect - let AuthContext handle it
              console.warn('Token refresh failed in API interceptor');
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
            // Clear the refresh flag on error to allow retry after some time
            // Don't redirect here - let the component handle auth state
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();

        try {
          await refreshPromise;
        } catch (error) {
          // Error already handled in promise
        }
      }
    }

    return response;
  };
};

// Initialize the interceptor
setupApiInterceptor();
