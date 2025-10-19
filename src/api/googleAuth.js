// Google OAuth configuration and service for client-side authentication
import { GOOGLE_CONFIG } from '../config/environment.js';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = GOOGLE_CONFIG.clientId;
const GOOGLE_REDIRECT_URI = GOOGLE_CONFIG.redirectURI;

// Google OAuth service
export const googleAuthService = {
  // Initialize Google OAuth
  initGoogleAuth: (callback) => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: callback || handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false,
            ux_mode: 'popup',
          });
          resolve();
        } catch (error) {
          console.error('Google OAuth initialization error:', error);
          reject(new Error('Google OAuth initialization failed: ' + error.message));
        }
      } else {
        reject(new Error('Google API not loaded'));
      }
    });
  },

  // Render Google Sign-In button
  renderButton: (elementId) => {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.renderButton(
        document.getElementById(elementId),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%',
          type: 'standard'
        }
      );
    }
  },

  // Handle Google OAuth response
  handleGoogleResponse: (response) => {
    try {
      const decoded = parseJwt(response.credential);
      return {
        success: true,
        user: {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
          email_verified: decoded.email_verified,
          provider: 'google'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Sign out from Google
  signOut: () => {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  },

  // Alternative OAuth flow using popup
  signInWithPopup: () => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.google) {
        const client = window.google.accounts.oauth2.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          ux_mode: 'popup',
          callback: (response) => {
            if (response.code) {
              resolve(response);
            } else {
              reject(new Error('No authorization code received'));
            }
          }
        });
        client.requestCode();
      } else {
        reject(new Error('Google API not loaded'));
      }
    });
  }
};

// Utility function to parse JWT token
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Load Google API script
export const loadGoogleAPI = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google API'));
    };
    
    document.head.appendChild(script);
  });
};

export default googleAuthService;
