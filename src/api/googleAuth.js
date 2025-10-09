// Google OAuth configuration and service for client-side authentication

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id';
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:5173';

// Google OAuth service
export const googleAuthService = {
  // Initialize Google OAuth
  initGoogleAuth: (callback) => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: callback || handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        resolve();
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
          width: '100%'
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
