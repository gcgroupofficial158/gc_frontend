import React, { useState, useEffect } from "react";
import { loginUser, registerUser, googleAuth } from "../api/authApi.js";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { loadGoogleAPI, googleAuthService } from "../api/googleAuth.js";
import { ENV_INFO, API_CONFIG } from "../config/environment.js";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [testingMode, setTestingMode] = useState(false);
  const [showTestingPopup, setShowTestingPopup] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Password validation
  const validatePassword = (password) => {
    if (!password) return "";
    
    const errors = [];
    if (password.length < 6) errors.push("at least 6 characters");
    if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
    if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
    if (!/\d/.test(password)) errors.push("one number");
    
    return errors.length > 0 ? `Password must contain ${errors.join(", ")}` : "";
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (!isLogin) {
      setPasswordError(validatePassword(newPassword));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Dummy login function for testing
  const dummyLogin = async (email, password, isLoginMode) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Show testing popup
    setShowTestingPopup(true);
    
    // Create dummy user data
    const dummyUser = {
      id: 'test-user-123',
      email: email,
      firstName: isLoginMode ? 'Test' : firstName || 'Test',
      lastName: isLoginMode ? 'User' : lastName || 'User',
      name: isLoginMode ? 'Test User' : `${firstName || 'Test'} ${lastName || 'User'}`,
      provider: 'email',
      email_verified: true,
      role: 'user'
    };

    const dummyTokens = {
      accessToken: 'dummy-access-token-' + Date.now(),
      refreshToken: 'dummy-refresh-token-' + Date.now()
    };

    return {
      success: true,
      user: dummyUser,
      tokens: dummyTokens
    };
  };

  // Load Google API on component mount
  useEffect(() => {
    console.log('🔧 Google OAuth Debug Info:', {
      clientId: GOOGLE_CONFIG.clientId,
      redirectURI: GOOGLE_CONFIG.redirectURI,
      environment: ENV_INFO.environment,
      isDevelopment: ENV_INFO.isDevelopment
    });
    
    loadGoogleAPI()
      .then(() => {
        console.log('✅ Google API loaded successfully');
        setIsGoogleLoaded(true);
        return googleAuthService.initGoogleAuth(handleGoogleLogin);
      })
      .catch((err) => {
        console.error('❌ Failed to load Google API:', err);
        if (err.message.includes('origin_mismatch') || err.message.includes('400')) {
          setError('Google OAuth origin mismatch. Please check your Google Cloud Console settings and ensure http://localhost:5173 is added to Authorized JavaScript origins.');
        } else {
          setError('Failed to load Google authentication: ' + err.message);
        }
      });
  }, []);

  // Render Google Sign-In button after API is loaded
  useEffect(() => {
    if (isGoogleLoaded) {
      googleAuthService.renderButton('google-signin-button');
    }
  }, [isGoogleLoaded]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      let result;
      
      if (testingMode) {
        // Use dummy login for testing
        result = await dummyLogin(email, password, true);
      } else {
        // Use real API
        result = await loginUser(email, password, rememberMe);
      }
      
      if (result.success) {
        await login(result.user, result.tokens); // Pass user data and tokens to context
        navigate("/"); // Redirect to Home page after login
      } else {
        setError("Invalid credentials");
      }
    } catch (e) {
      setError(e.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    
    // Check password validation
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setError(passwordValidationError);
      return;
    }
    
    setLoading(true);
    
    try {
      let result;
      
      if (testingMode) {
        // Use dummy registration for testing
        result = await dummyLogin(email, password, false);
      } else {
        // Use real API
        const userData = {
          firstName,
          lastName,
          email,
          password,
          phone: phone || undefined
        };
        
        result = await registerUser(userData);
      }
      
      if (result.success) {
        await login(result.user, result.tokens); // Pass user data and tokens to context
        navigate("/"); // Redirect to Home page after registration
      } else {
        setError("Registration failed");
      }
    } catch (e) {
      setError(e.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (response) => {
    try {
      setLoading(true);
      setError("");
      
      if (testingMode) {
        // Use dummy Google login for testing
        const dummyUser = {
          id: 'google-test-user-123',
          email: 'test@gmail.com',
          firstName: 'Google',
          lastName: 'User',
          name: 'Google User',
          provider: 'google',
          email_verified: true,
          picture: 'https://via.placeholder.com/150',
          role: 'user'
        };

        const dummyTokens = {
          accessToken: 'dummy-google-access-token-' + Date.now(),
          refreshToken: 'dummy-google-refresh-token-' + Date.now()
        };

        await login(dummyUser, dummyTokens);
        navigate('/dashboard');
      } else {
        // Use real Google OAuth with backend
        const result = googleAuthService.handleGoogleResponse(response);
        
        if (result.success) {
          // Send to backend for verification and token generation
          const backendResult = await googleAuth(response.credential);
          
          if (backendResult.success) {
            await login(backendResult.user, backendResult.tokens);
            navigate('/dashboard');
          } else {
            setError(backendResult.message || 'Google authentication failed');
          }
        } else {
          setError(result.error || 'Google login failed');
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (error.message.includes('400')) {
        setError('Google OAuth configuration error. Please check your Google Cloud Console settings.');
      } else {
        setError('Google login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        {/* Google Sign-In Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Quick Sign In</h3>
          {isGoogleLoaded ? (
            <div className="mb-4">
              <div id="google-signin-button" className="mb-3"></div>
            </div>
          ) : (
            <div className="mb-4">
              <button
                onClick={() => setError("Google API is loading, please wait...")}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition flex items-center justify-center font-medium"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Toggle between Login and Register */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            {isLogin ? 'Sign In with Email' : 'Create Account with Email'}
          </h3>
          
          <form onSubmit={isLogin ? handleLogin : handleRegister}>
            {!isLogin && (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="First name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Last name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            
            <div className="mb-4">
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <div className="relative">
              <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    passwordError ? 'border-red-300' : 'border-gray-300'
                  }`}
                placeholder="Enter your password"
                value={password}
                  onChange={handlePasswordChange}
                required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {!isLogin && (
                <div className="mt-1">
                  {passwordError ? (
                    <p className="text-xs text-red-500">{passwordError}</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Password must be at least 6 characters with uppercase, lowercase, and number
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {!isLogin && (
              <div className="mb-4">
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Phone number (optional)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            )}
            
            {isLogin && (
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || (!isLogin && passwordError)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Environment Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-blue-800 font-medium">
                Environment: {ENV_INFO.environment}
              </span>
            </div>
            <span className="text-xs text-blue-600">
              Real Backend Mode
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            API: {API_CONFIG.baseURL}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            ⚠️ Make sure backend is running on port 3001
          </p>
        </div>

        {/* Google OAuth Debug Info */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isGoogleLoaded ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-800 font-medium">
                Google OAuth: {isGoogleLoaded ? 'Loaded' : 'Not Loaded'}
              </span>
            </div>
            <span className="text-xs text-gray-600">
              Client ID: {GOOGLE_CONFIG.clientId.substring(0, 20)}...
            </span>
          </div>
          <p className="text-xs text-gray-700 mt-1">
            Redirect URI: {GOOGLE_CONFIG.redirectURI}
          </p>
          <p className="text-xs text-gray-700 mt-1">
            Current Origin: {window.location.origin}
          </p>
          {!isGoogleLoaded && (
            <p className="text-xs text-red-600 mt-1">
              ❌ Google OAuth failed to load. Check console for errors.
            </p>
          )}
        </div>

        {/* Testing Mode Toggle */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="testingMode"
                checked={testingMode}
                onChange={e => setTestingMode(e.target.checked)}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
              />
              <label htmlFor="testingMode" className="ml-2 block text-sm text-yellow-800 font-medium">
                Testing Mode (Backend Bypass)
              </label>
            </div>
            <button
              onClick={() => setShowTestingPopup(true)}
              className="text-xs text-yellow-600 hover:text-yellow-800 underline"
            >
              Info
            </button>
          </div>
          {testingMode && (
            <p className="text-xs text-yellow-700 mt-2">
              ⚠️ Testing mode enabled - Login will succeed without backend validation
            </p>
          )}
        </div>

        {/* Additional Options */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
            >
              {isLogin ? 'Sign up here' : 'Sign in here'}
            </button>
          </p>
          {isLogin && (
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700 mt-2 block">
            Forgot your password?
          </a>
          )}
        </div>
      </div>

      {/* Testing Mode Popup */}
      {showTestingPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Testing Mode Active</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <strong>Backend is not working, but for testing I proceed.</strong>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                When testing mode is enabled:
              </p>
              <ul className="text-sm text-gray-600 mt-2 list-disc list-inside">
                <li>Any email/password combination will work</li>
                <li>No actual backend validation occurs</li>
                <li>Dummy user data is created</li>
                <li>You can test the frontend flow completely</li>
              </ul>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowTestingPopup(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
