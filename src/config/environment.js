// Environment configuration utility
// Automatically selects URLs based on environment

const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development';
const isProduction = import.meta.env.VITE_NODE_ENV === 'production';

// Backend API Configuration
export const API_CONFIG = {
  // Select API URL based on environment
  baseURL: isDevelopment 
    ? import.meta.env.VITE_API_BASE_URL_DEV || 'http://localhost:3001/api/v1'
    : import.meta.env.VITE_API_BASE_URL_PROD || 'https://your-backend-domain.com/api/v1',
  
  // Fallback for when backend is not available
  fallbackMode: isDevelopment, // Enable fallback mode in development for better error handling
  
  // Timeout settings
  timeout: 10000, // 10 seconds
};

// Google OAuth Configuration
export const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
  
  // Select redirect URI based on environment
  redirectURI: isDevelopment
    ? import.meta.env.VITE_GOOGLE_REDIRECT_URI_DEV || 'http://localhost:5173'
    : import.meta.env.VITE_GOOGLE_REDIRECT_URI_PROD || 'https://gc-frontend-ten.vercel.app',
  
  // Scopes
  scopes: 'openid email profile',
  
  // Additional configuration for development
  uxMode: 'popup',
  autoSelect: false,
  cancelOnTapOutside: true,
};

// Environment info
export const ENV_INFO = {
  isDevelopment,
  isProduction,
  environment: import.meta.env.VITE_NODE_ENV || 'development',
  backendAvailable: !API_CONFIG.fallbackMode,
};

// Debug logging
if (isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    environment: ENV_INFO.environment,
    apiBaseURL: API_CONFIG.baseURL,
    googleClientId: GOOGLE_CONFIG.clientId,
    googleRedirectURI: GOOGLE_CONFIG.redirectURI,
    backendAvailable: ENV_INFO.backendAvailable,
    fallbackMode: API_CONFIG.fallbackMode
  });
}
