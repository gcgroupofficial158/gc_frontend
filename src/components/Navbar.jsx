// src/components/Navbar.jsx
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="bg-white shadow flex items-center justify-between px-8 py-4">
      <span className="text-xl font-bold text-blue-700">ResearchNet</span>
      <div className="space-x-6">
        <a className="text-gray-700 hover:text-blue-700 font-medium" href="/">Home</a>
        <a className="text-gray-700 hover:text-blue-700 font-medium" href="/network">My Network</a>
        <a className="text-gray-700 hover:text-blue-700 font-medium" href="/jobs">Opportunities</a>
        <a className="text-gray-700 hover:text-blue-700 font-medium" href="/messages">Messages</a>
      </div>
      <div className="flex items-center space-x-4">
        {isAuthenticated && user ? (
          <>
            <div className="text-sm text-gray-700">
              Welcome, {user.name || user.email}
            </div>
            <img 
              className="rounded-full w-8 h-8" 
              src={user.picture || "/profile.jpg"} 
              alt="Profile" 
            />
            <button 
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </>
        ) : (
          <a 
            href="/login" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Login
          </a>
        )}
      </div>
    </nav>
  );
}
  