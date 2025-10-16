import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Network = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [exploreUsers, setExploreUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connections');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockConnections = [
      {
        id: 1,
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@university.edu",
        affiliation: "Stanford University",
        specialization: "Machine Learning",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        papersCount: 23,
        citations: 145,
        mutualConnections: 5,
        status: "connected"
      },
      {
        id: 2,
        name: "Prof. Michael Chen",
        email: "m.chen@mit.edu",
        affiliation: "MIT",
        specialization: "Computer Science",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        papersCount: 45,
        citations: 289,
        mutualConnections: 8,
        status: "connected"
      },
      {
        id: 3,
        name: "Dr. Emma Wilson",
        email: "e.wilson@cambridge.ac.uk",
        affiliation: "University of Cambridge",
        specialization: "Physics",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        papersCount: 18,
        citations: 98,
        mutualConnections: 3,
        status: "connected"
      },
      {
        id: 4,
        name: "Dr. Alex Rodriguez",
        email: "a.rodriguez@berkeley.edu",
        affiliation: "UC Berkeley",
        specialization: "Quantum Computing",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        papersCount: 31,
        citations: 167,
        mutualConnections: 6,
        status: "connected"
      }
    ];

    const mockSuggestions = [
      {
        id: 5,
        name: "Dr. Lisa Thompson",
        email: "l.thompson@harvard.edu",
        affiliation: "Harvard University",
        specialization: "Biomedical Engineering",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
        papersCount: 27,
        citations: 134,
        mutualConnections: 4,
        status: "suggestion"
      },
      {
        id: 6,
        name: "Prof. David Kim",
        email: "d.kim@stanford.edu",
        affiliation: "Stanford University",
        specialization: "Materials Science",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        papersCount: 52,
        citations: 312,
        mutualConnections: 7,
        status: "suggestion"
      },
      {
        id: 7,
        name: "Dr. Maria Garcia",
        email: "m.garcia@oxford.ac.uk",
        affiliation: "University of Oxford",
        specialization: "Psychology",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
        papersCount: 19,
        citations: 89,
        mutualConnections: 2,
        status: "suggestion"
      }
    ];

    const mockExploreUsers = [
      {
        id: 8,
        name: "Dr. James Wilson",
        email: "j.wilson@caltech.edu",
        affiliation: "Caltech",
        specialization: "Astrophysics",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        papersCount: 38,
        citations: 245,
        mutualConnections: 1,
        status: "explore",
        researchInterests: ["Dark Matter", "Cosmology", "Galaxy Formation"],
        recentPapers: ["Dark Matter Detection Methods", "Galaxy Evolution Models"]
      },
      {
        id: 9,
        name: "Prof. Anna Schmidt",
        email: "a.schmidt@ethz.ch",
        affiliation: "ETH Zurich",
        specialization: "Robotics",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        papersCount: 41,
        citations: 298,
        mutualConnections: 3,
        status: "explore",
        researchInterests: ["Autonomous Systems", "Machine Learning", "Human-Robot Interaction"],
        recentPapers: ["Autonomous Navigation", "Robotic Learning Algorithms"]
      },
      {
        id: 10,
        name: "Dr. Raj Patel",
        email: "r.patel@iisc.ac.in",
        affiliation: "IISc Bangalore",
        specialization: "Computer Vision",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        papersCount: 29,
        citations: 156,
        mutualConnections: 0,
        status: "explore",
        researchInterests: ["Deep Learning", "Image Processing", "Medical Imaging"],
        recentPapers: ["Medical Image Analysis", "Deep Learning Applications"]
      },
      {
        id: 11,
        name: "Dr. Sophie Chen",
        email: "s.chen@tsinghua.edu.cn",
        affiliation: "Tsinghua University",
        specialization: "Quantum Physics",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        papersCount: 33,
        citations: 189,
        mutualConnections: 2,
        status: "explore",
        researchInterests: ["Quantum Computing", "Quantum Entanglement", "Quantum Algorithms"],
        recentPapers: ["Quantum Error Correction", "Quantum Machine Learning"]
      },
      {
        id: 12,
        name: "Prof. Ahmed Hassan",
        email: "a.hassan@aub.edu.lb",
        affiliation: "American University of Beirut",
        specialization: "Environmental Science",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        papersCount: 25,
        citations: 112,
        mutualConnections: 1,
        status: "explore",
        researchInterests: ["Climate Change", "Sustainability", "Environmental Policy"],
        recentPapers: ["Climate Impact Assessment", "Sustainable Development"]
      },
      {
        id: 13,
        name: "Dr. Yuki Tanaka",
        email: "y.tanaka@u-tokyo.ac.jp",
        affiliation: "University of Tokyo",
        specialization: "Neuroscience",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        papersCount: 36,
        citations: 203,
        mutualConnections: 4,
        status: "explore",
        researchInterests: ["Brain Imaging", "Cognitive Science", "Neural Networks"],
        recentPapers: ["Brain Connectivity Analysis", "Neural Plasticity"]
      }
    ];

    setTimeout(() => {
      setConnections(mockConnections);
      setSuggestions(mockSuggestions);
      setExploreUsers(mockExploreUsers);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleConnect = (userId) => {
    // Move from suggestions/explore to connections
    const suggestion = suggestions.find(s => s.id === userId);
    const exploreUser = exploreUsers.find(e => e.id === userId);
    const searchResult = searchResults.find(s => s.id === userId);
    
    if (suggestion) {
      setSuggestions(prev => prev.filter(s => s.id !== userId));
      setConnections(prev => [...prev, { ...suggestion, status: 'connected' }]);
    } else if (exploreUser) {
      setExploreUsers(prev => prev.filter(e => e.id !== userId));
      setConnections(prev => [...prev, { ...exploreUser, status: 'connected' }]);
    } else if (searchResult) {
      setSearchResults(prev => prev.filter(s => s.id !== userId));
      setConnections(prev => [...prev, { ...searchResult, status: 'connected' }]);
    }
  };

  const handleDisconnect = (userId) => {
    // Move from connections to suggestions
    const connection = connections.find(c => c.id === userId);
    if (connection) {
      setConnections(prev => prev.filter(c => c.id !== userId));
      setSuggestions(prev => [...prev, { ...connection, status: 'suggestion' }]);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const allUsers = [...suggestions, ...exploreUsers];
      const filtered = allUsers.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.specialization.toLowerCase().includes(query.toLowerCase()) ||
        user.affiliation.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setIsSearching(false);
    }, 500);
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleFollow = (userId) => {
    // Add to following list (simplified for demo)
    console.log(`Following user ${userId}`);
  };

  const handleUnfollow = (userId) => {
    // Remove from following list
    console.log(`Unfollowing user ${userId}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your network...</p>
        </div>
      </div>
    );
  }

  const UserCard = ({ user: userData, onConnect, onDisconnect, showDetails = false }) => (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        <img
          src={userData.avatar}
          alt={userData.name}
          className="w-16 h-16 rounded-full object-cover cursor-pointer"
          onClick={() => navigate(`/profile/${userData.id}`)}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 
                className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                onClick={() => navigate(`/profile/${userData.id}`)}
              >
                {userData.name}
              </h3>
              <p className="text-sm text-gray-600">{userData.affiliation}</p>
              <p className="text-sm text-blue-600 font-medium">{userData.specialization}</p>
            </div>
            {userData.mutualConnections > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-500">{userData.mutualConnections} mutual</p>
              </div>
            )}
          </div>
          
          <div className="mt-3 flex space-x-4 text-sm text-gray-500">
            <span>{userData.papersCount} papers</span>
            <span>{userData.citations} citations</span>
            {userData.mutualConnections > 0 && (
              <span>{userData.mutualConnections} mutual connections</span>
            )}
          </div>

          {showDetails && userData.researchInterests && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Research Interests:</p>
              <div className="flex flex-wrap gap-1">
                {userData.researchInterests.map((interest, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {showDetails && userData.recentPapers && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Recent Papers:</p>
              <div className="space-y-1">
                {userData.recentPapers.map((paper, index) => (
                  <p key={index} className="text-xs text-gray-600">• {paper}</p>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 flex space-x-2">
            {userData.status === 'connected' ? (
              <>
                <button
                  onClick={() => onDisconnect(userData.id)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Disconnect
                </button>
                <button
                  onClick={() => navigate(`/profile/${userData.id}`)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  View Profile
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onConnect(userData.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Connect
                </button>
                <button
                  onClick={() => navigate(`/profile/${userData.id}`)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  View Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="w-full py-8">
        <div className="w-[85%] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search researchers by name, specialization, or affiliation..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {isSearching && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Connections</p>
                <p className="text-2xl font-semibold text-gray-900">{connections.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suggestions</p>
                <p className="text-2xl font-semibold text-gray-900">{suggestions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Explore</p>
                <p className="text-2xl font-semibold text-gray-900">{exploreUsers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Network</p>
                <p className="text-2xl font-semibold text-gray-900">{connections.length + suggestions.length + exploreUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results for "{searchQuery}" ({searchResults.length})
              </h3>
            </div>
            <div className="p-6">
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {searchResults.map(result => (
                    <UserCard
                      key={result.id}
                      user={result}
                      onConnect={handleConnect}
                      showDetails={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600">
                    Try searching with different keywords or check the Explore section for more researchers.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('connections')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'connections'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Connections ({connections.length})
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'suggestions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Suggestions ({suggestions.length})
              </button>
              <button
                onClick={() => setActiveTab('explore')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'explore'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Explore ({exploreUsers.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'connections' ? (
              <div>
                {connections.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {connections.map(connection => (
                      <UserCard
                        key={connection.id}
                        user={connection}
                        onDisconnect={handleDisconnect}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start building your research network by connecting with other researchers.
                    </p>
                    <button
                      onClick={() => setActiveTab('suggestions')}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View suggestions
                    </button>
                  </div>
                )}
              </div>
            ) : activeTab === 'suggestions' ? (
              <div>
                {suggestions.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {suggestions.map(suggestion => (
                      <UserCard
                        key={suggestion.id}
                        user={suggestion}
                        onConnect={handleConnect}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions available</h3>
                    <p className="text-gray-600 mb-4">
                      We'll suggest researchers based on your interests and publications.
                    </p>
                    <button
                      onClick={() => setActiveTab('explore')}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Explore more researchers
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Discover New Researchers</h3>
                  <p className="text-gray-600">
                    Explore researchers from different fields and institutions. Click on their names or profiles to learn more about their work.
                  </p>
                </div>
                {exploreUsers.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {exploreUsers.map(exploreUser => (
                      <UserCard
                        key={exploreUser.id}
                        user={exploreUser}
                        onConnect={handleConnect}
                        showDetails={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No researchers to explore</h3>
                    <p className="text-gray-600">
                      Check back later for new researchers to discover.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default Network;
