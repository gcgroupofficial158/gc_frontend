// src/components/Navbar.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="w-full bg-white shadow relative">
      <div className="w-full flex items-center justify-between px-[5%] py-4">
        {/* Logo */}
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xl font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
          >
            ResearchNet
          </button>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-700 hover:text-blue-700 font-medium cursor-pointer transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/feed')}
            className="text-gray-700 hover:text-blue-700 font-medium cursor-pointer transition-colors"
          >
            Feed
          </button>
          <button
            onClick={() => navigate('/papers')}
            className="text-gray-700 hover:text-blue-700 font-medium cursor-pointer transition-colors"
          >
            Papers
          </button>
          <button
            onClick={() => navigate('/network')}
            className="text-gray-700 hover:text-blue-700 font-medium cursor-pointer transition-colors"
          >
            Network
          </button>
          <button
            onClick={() => navigate('/publish')}
            className="text-gray-700 hover:text-blue-700 font-medium cursor-pointer transition-colors"
          >
            Publish
          </button>
        </div>
        
        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated && user ? (
            <>
              <div className="text-sm text-gray-700">
                Welcome, {user.name || user.email}
              </div>
              <img 
                className="rounded-full w-8 h-8 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" 
                src={user.picture || "/profile.jpg"} 
                alt="Profile" 
                onClick={() => {
                  navigate('/profile');
                  closeMobileMenu();
                }}
              />
              <button 
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 font-medium cursor-pointer transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer transition-colors"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            {/* Hamburger Icon */}
            <svg
              className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {/* Close Icon */}
            <svg
              className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
          {/* Mobile Navigation Links */}
          <button
            onClick={() => {
              navigate('/dashboard');
              closeMobileMenu();
            }}
            className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              navigate('/feed');
              closeMobileMenu();
            }}
            className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Feed
          </button>
          <button
            onClick={() => {
              navigate('/papers');
              closeMobileMenu();
            }}
            className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Papers
          </button>
          <button
            onClick={() => {
              navigate('/network');
              closeMobileMenu();
            }}
            className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Network
          </button>
          <button
            onClick={() => {
              navigate('/publish');
              closeMobileMenu();
            }}
            className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Publish
          </button>

          {/* Mobile User Menu */}
          {isAuthenticated && user ? (
            <>
              <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="flex items-center px-3">
                  <div className="flex-shrink-0">
                    <img 
                      className="rounded-full w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" 
                      src={user.picture || "/profile.jpg"} 
                      alt="Profile"
                      onClick={() => {
                        navigate('/profile');
                        closeMobileMenu();
                      }}
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user.name || user.email}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => {
                  navigate('/login');
                  closeMobileMenu();
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
  