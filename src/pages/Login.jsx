import React, { useState, useEffect } from "react";
import { loginUser } from "../api/authApi.js";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { loadGoogleAPI, googleAuthService } from "../api/googleAuth.js";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load Google API on component mount
  useEffect(() => {
    loadGoogleAPI()
      .then(() => {
        setIsGoogleLoaded(true);
        return googleAuthService.initGoogleAuth(handleGoogleLogin);
      })
      .catch((err) => {
        console.error('Failed to load Google API:', err);
        setError('Failed to load Google authentication');
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
    try {
      const result = await loginUser(email, password);
      if (result.success) {
        login(result.user); // Pass user data to context
        navigate("/"); // Redirect to Home page after login
      } else {
        setError("Invalid credentials");
      }
    } catch (e) {
      setError(e.message || "Invalid credentials");
    }
  };

  const handleGoogleLogin = (response) => {
    try {
      const result = googleAuthService.handleGoogleResponse(response);
      if (result.success) {
        login(result.user); // Pass user data to context
        navigate("/"); // Redirect to Home page
      } else {
        setError(result.error || "Google login failed");
      }
    } catch (err) {
      setError("Google login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Welcome Back</h2>
        
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

        {/* Traditional Login Form */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Sign In with Email</h3>
          <form onSubmit={handleLogin}>
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
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Additional Options */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account? 
            <a href="#" className="text-blue-600 hover:text-blue-800 ml-1 font-medium">
              Sign up here
            </a>
          </p>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700 mt-2 block">
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
