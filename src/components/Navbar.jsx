// src/components/Navbar.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Check if we're on chat page
  const isOnChatPage = location.pathname === '/chat';

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
    <nav className="w-full bg-white/80 backdrop-blur-lg shadow-md border-b border-gray-100 sticky top-0 z-50 relative">
      <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ResearchNet
            </span>
          </button>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/feed')}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200"
          >
            Feed
          </button>
          <button
            onClick={() => navigate('/papers')}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200"
          >
            Papers
          </button>
          <button
            onClick={() => navigate('/network')}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200"
          >
            Network
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200 relative"
          >
            Chat
            {!isOnChatPage && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/publish')}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Publish
          </button>
      </div>
        
        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center space-x-4">
        {isAuthenticated && user ? (
          <>
            <div className="text-sm text-gray-600 hidden lg:block">
              Welcome, <span className="font-semibold text-gray-900">{user.name || user.email}</span>
            </div>
            <button
              onClick={() => {
                navigate('/profile');
                closeMobileMenu();
              }}
              className="relative group"
            >
              <img 
                className="rounded-full w-10 h-10 cursor-pointer ring-2 ring-gray-200 hover:ring-blue-500 transition-all duration-300 shadow-md hover:shadow-lg" 
                src={user.picture || user.profilePicture || "/profile.jpg"} 
                alt="Profile"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 font-medium rounded-lg cursor-pointer transition-all duration-200"
            >
              Logout
            </button>
          </>
        ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg"
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
              navigate('/chat');
              closeMobileMenu();
            }}
            className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-100 rounded-md transition-colors relative"
          >
            Chat
            {!isOnChatPage && unreadCount > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
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
  