import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';
import { fetchUsers, fetchConnections, fetchSuggestions } from '../api/userApi';
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  cancelFriendRequest,
  blockUser, 
  getPendingRequests,
  removeConnection 
} from '../api/friendApi';
import { getConversations } from '../api/chatApi';

const Network = () => {
  const { user, isAuthenticated, tokens } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [exploreUsers, setExploreUsers] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connections');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [usersWithPastChat, setUsersWithPastChat] = useState(new Set());

  // Fetch real data from API
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch connections (friends)
        if (tokens?.accessToken) {
          try {
            const connectionsRes = await fetchConnections(tokens.accessToken);
            if (connectionsRes && connectionsRes.success) {
              setConnections(connectionsRes.data?.connections || []);
            } else {
              setConnections([]);
            }
          } catch (error) {
            console.error('❌ Error fetching connections:', error);
            setConnections([]);
          }

          // Fetch suggestions
          try {
            const suggestionsRes = await fetchSuggestions(tokens.accessToken);
            if (suggestionsRes && suggestionsRes.success) {
              setSuggestions(suggestionsRes.data?.suggestions || []);
            }
          } catch (error) {
            console.error('❌ Error fetching suggestions:', error);
          }

          // Fetch pending requests
          try {
            const pendingRes = await getPendingRequests(tokens.accessToken);
            if (pendingRes && pendingRes.success) {
              setPendingReceived(pendingRes.data?.received || []);
              setPendingSent(pendingRes.data?.sent || []);
            }
          } catch (error) {
            console.error('❌ Error fetching pending requests:', error);
          }

          // Fetch conversations to identify users with past chat
          try {
            const conversationsRes = await getConversations(tokens.accessToken);
            if (conversationsRes && conversationsRes.success) {
              const pastChatUserIds = new Set(
                (conversationsRes.data?.conversations || []).map(conv => 
                  String(conv.participant?._id || conv.participant)
                )
              );
              setUsersWithPastChat(pastChatUserIds);
            }
          } catch (error) {
            console.error('❌ Error fetching conversations:', error);
          }
        }

        // Fetch all users for explore (after connections are loaded)
        // This ensures we have the latest connections data for filtering
        if (connections.length >= 0) { // Wait for connections to be fetched (even if empty)
          try {
            const usersRes = await fetchUsers({ limit: 50 }, tokens?.accessToken);
            if (usersRes && usersRes.success) {
              const allUsers = usersRes.data?.users || [];
              const currentUserId = user?._id || user?.id;
              const currentUserIdStr = currentUserId ? String(currentUserId) : null;
              
              // Build sets of IDs to exclude
              // Only exclude connected users (accepted connections), NOT pending requests
              const connectionIds = new Set(connections.map(c => String(c._id || c.id)));
              
              // Filter out current user and connected users only
              // Keep users with pending requests visible until connection is accepted
              const explore = allUsers.filter(u => {
                const userId = String(u._id || u.id);
                const isCurrentUser = currentUserIdStr && userId === currentUserIdStr;
                const isConnected = connectionIds.has(userId);
                return !isCurrentUser && !isConnected;
              });
              
              setExploreUsers(explore);
              
              // Also filter suggestions to remove only connected users
              // Keep users with pending requests visible until connection is accepted
              setSuggestions(prev => {
                if (prev.length > 0) {
                  return prev.filter(s => {
                    const userId = String(s._id || s.id);
                    return !connectionIds.has(userId) && userId !== currentUserIdStr;
                  });
                }
                return prev;
              });
            }
          } catch (error) {
            console.error('❌ Error fetching users:', error);
          }
        }
      } catch (error) {
        console.error('Error loading network data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, tokens?.accessToken]); // Only re-run when auth state or token changes

  // Filter explore and suggestions when connections change
  useEffect(() => {
    if (!isAuthenticated || !tokens?.accessToken) return;
    
    const filterUsers = async () => {
      try {
        const usersRes = await fetchUsers({ limit: 50 }, tokens.accessToken);
        if (usersRes && usersRes.success) {
          const allUsers = usersRes.data?.users || [];
          const currentUserId = user?._id || user?.id;
          const currentUserIdStr = currentUserId ? String(currentUserId) : null;
          
          // Only exclude connected users (accepted connections), NOT pending requests
          const connectionIds = new Set(connections.map(c => String(c._id || c.id)));
          
          // Filter explore users - only exclude current user and connected users
          // Keep users with pending requests visible until connection is accepted
          const explore = allUsers.filter(u => {
            const userId = String(u._id || u.id);
            const isCurrentUser = currentUserIdStr && userId === currentUserIdStr;
            const isConnected = connectionIds.has(userId);
            return !isCurrentUser && !isConnected;
          });
          
          setExploreUsers(explore);
          
          // Filter suggestions - only exclude connected users
          // Keep users with pending requests visible until connection is accepted
          setSuggestions(prev => {
            if (prev.length > 0) {
              return prev.filter(s => {
                const userId = String(s._id || s.id);
                return !connectionIds.has(userId) && userId !== currentUserIdStr;
              });
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('❌ Error filtering users:', error);
      }
    };
    
    if (connections.length >= 0) { // Run when connections are loaded (even if empty)
      filterUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections, pendingReceived, pendingSent]); // Re-filter when connections or pending requests change

  // Real-time friend request listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleFriendAccepted = (data) => {
      if (data.request) {
        const friend = data.request.requester._id.toString() === String(user?._id || user?.id)
          ? data.request.recipient
          : data.request.requester;
        
        // Remove from pending
        setPendingReceived(prev => prev.filter(r => String(r.user?._id || r.user) !== String(friend._id)));
        setPendingSent(prev => prev.filter(r => String(r.user?._id || r.user) !== String(friend._id)));
        
        // Remove from suggestions and explore
        setSuggestions(prev => prev.filter(s => String(s._id) !== String(friend._id)));
        setExploreUsers(prev => prev.filter(e => String(e._id) !== String(friend._id)));
        
        // Add to connections
        setConnections(prev => {
          if (!prev.find(c => String(c._id) === String(friend._id))) {
            return [...prev, {
              _id: friend._id,
              firstName: friend.firstName,
              lastName: friend.lastName,
              fullName: `${friend.firstName} ${friend.lastName}`,
              email: friend.email,
              profilePicture: friend.profilePicture,
              friendStatus: 'accepted',
              isConnected: true,
              papersCount: 0
            }];
          }
          return prev;
        });
      }
    };

    const handleFriendRequestReceived = (data) => {
      if (data.request) {
        // Reload pending requests
        if (tokens?.accessToken) {
          getPendingRequests(tokens.accessToken).then(res => {
            if (res && res.success) {
              setPendingReceived(res.data?.received || []);
            }
          });
        }
      }
    };

    const handleFriendRequestSent = (data) => {
      if (data.request) {
        // Reload pending sent requests
        if (tokens?.accessToken) {
          getPendingRequests(tokens.accessToken).then(res => {
            if (res && res.success) {
              setPendingSent(res.data?.sent || []);
            }
          });
        }
      }
    };

    const handleFriendRejected = (data) => {
      if (data.userId) {
        // Remove from pending sent (if we sent the request)
        setPendingSent(prev => prev.filter(r => String(r.user?._id || r.user) !== String(data.userId)));
        
        // Reload pending requests
        if (tokens?.accessToken) {
          getPendingRequests(tokens.accessToken).then(res => {
            if (res && res.success) {
              setPendingSent(res.data?.sent || []);
              setPendingReceived(res.data?.received || []);
            }
          });
        }
      }
    };

    const handleFriendCancelled = (data) => {
      if (data.userId) {
        // Remove from pending sent
        setPendingSent(prev => prev.filter(r => String(r.user?._id || r.user) !== String(data.userId)));
        
        // Reload pending requests
        if (tokens?.accessToken) {
          getPendingRequests(tokens.accessToken).then(res => {
            if (res && res.success) {
              setPendingSent(res.data?.sent || []);
            }
          });
        }
      }
    };

    const handleFriendBlocked = (data) => {
      if (data.userId) {
        const userIdStr = String(data.userId);
        // Remove from all lists
        setConnections(prev => prev.filter(c => String(c._id) !== userIdStr));
        setSuggestions(prev => prev.filter(s => String(s._id) !== userIdStr));
        setExploreUsers(prev => prev.filter(e => String(e._id) !== userIdStr));
        setPendingReceived(prev => prev.filter(r => String(r.user?._id || r.user) !== userIdStr));
        setPendingSent(prev => prev.filter(r => String(r.user?._id || r.user) !== userIdStr));
      }
    };

    const handleFriendRemoved = (data) => {
      if (data.userId) {
        const userIdStr = String(data.userId);
        // Remove from connections
        setConnections(prev => prev.filter(c => String(c._id) !== userIdStr));
        
        // Reload connections
        if (tokens?.accessToken) {
          fetchConnections(tokens.accessToken).then(res => {
            if (res && res.success) {
              setConnections(res.data?.connections || []);
            }
          });
        }
      }
    };

    socketService.on('friend:accepted', handleFriendAccepted);
    socketService.on('friend:request:received', handleFriendRequestReceived);
    socketService.on('friend:request:sent', handleFriendRequestSent);
    socketService.on('friend:rejected', handleFriendRejected);
    socketService.on('friend:cancelled', handleFriendCancelled);
    socketService.on('friend:blocked', handleFriendBlocked);
    socketService.on('friend:removed', handleFriendRemoved);

      return () => {
        socketService.off('friend:accepted', handleFriendAccepted);
        socketService.off('friend:request:received', handleFriendRequestReceived);
        socketService.off('friend:request:sent', handleFriendRequestSent);
        socketService.off('friend:rejected', handleFriendRejected);
        socketService.off('friend:cancelled', handleFriendCancelled);
        socketService.off('friend:blocked', handleFriendBlocked);
        socketService.off('friend:removed', handleFriendRemoved);
      };
  }, [isAuthenticated, user, tokens]);

  // Helper function to get request status for a user
  const getUserRequestStatus = (userId) => {
    const userIdStr = String(userId);
    
    // Check if already connected
    const isConnected = connections.some(c => String(c._id || c.id) === userIdStr);
    if (isConnected) return 'connected';
    
    // Check if request was sent
    const isSent = pendingSent.some(r => String(r.user?._id || r.user) === userIdStr);
    if (isSent) return 'sent';
    
    // Check if request was received
    const isReceived = pendingReceived.some(r => String(r.user?._id || r.user) === userIdStr);
    if (isReceived) return 'pending';
    
    return null; // No request
  };

  // Helper function to check if user can receive messages
  const canSendMessage = (userId) => {
    const userIdStr = String(userId);
    const isConnected = connections.some(c => String(c._id || c.id) === userIdStr);
    const hasPastChat = usersWithPastChat.has(userIdStr);
    return isConnected || hasPastChat;
  };

  // Handle send message navigation
  const handleSendMessage = (userId) => {
    navigate(`/chat?userId=${userId}`);
  };

  const handleConnect = async (userId) => {
    if (!tokens?.accessToken) {
      alert('Authentication required. Please log in again.');
      return;
    }
    
    // Ensure userId is a string
    const userIdStr = String(userId);
    console.log('🔗 handleConnect - userId:', userIdStr);
    
    setActionLoading(prev => ({ ...prev, [userIdStr]: true }));
    try {
      // Use Socket.io for real-time friend request
      socketService.sendFriendRequest(userIdStr);
      
      // The UI will update via socket event listener
      // But we can also use HTTP API as fallback for immediate feedback
      try {
        await sendFriendRequest(tokens.accessToken, userIdStr);
      } catch (error) {
        // If HTTP fails but socket succeeds, that's okay
        console.log('HTTP fallback error (socket may have succeeded):', error);
      }
    } catch (error) {
      console.error('❌ Error sending friend request:', error);
      alert(error.message || 'Failed to send friend request');
    } finally {
      setActionLoading(prev => ({ ...prev, [userIdStr]: false }));
    }
  };

  const handleAccept = async (userId) => {
    if (!tokens?.accessToken) return;
    
    setActionLoading(prev => ({ ...prev, [`accept-${userId}`]: true }));
    try {
      // Use Socket.io for real-time friend acceptance
      socketService.acceptFriendRequest(userId);
      
      // The UI will update via socket event listener
      // But we can also use HTTP API as fallback
      try {
        await acceptFriendRequest(tokens.accessToken, userId);
      } catch (error) {
        console.log('HTTP fallback error (socket may have succeeded):', error);
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert(error.message || 'Failed to accept friend request');
    } finally {
      setActionLoading(prev => ({ ...prev, [`accept-${userId}`]: false }));
    }
  };

  const handleReject = async (userId) => {
    if (!tokens?.accessToken) return;
    
    setActionLoading(prev => ({ ...prev, [`reject-${userId}`]: true }));
    try {
      // Use Socket.io for real-time friend rejection
      socketService.rejectFriendRequest(userId);
      
      // The UI will update via socket event listener
      // But we can also use HTTP API as fallback
      try {
        await rejectFriendRequest(tokens.accessToken, userId);
      } catch (error) {
        console.log('HTTP fallback error (socket may have succeeded):', error);
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert(error.message || 'Failed to reject friend request');
    } finally {
      setActionLoading(prev => ({ ...prev, [`reject-${userId}`]: false }));
    }
  };

  const handleCancel = async (userId) => {
    if (!tokens?.accessToken) return;
    
    const userIdStr = String(userId);
    setActionLoading(prev => ({ ...prev, [`cancel-${userIdStr}`]: true }));
    try {
      // Use Socket.io for real-time friend cancellation
      socketService.cancelFriendRequest(userIdStr);
      
      // The UI will update via socket event listener
      // But we can also use HTTP API as fallback
      try {
        await cancelFriendRequest(tokens.accessToken, userIdStr);
      } catch (error) {
        console.log('HTTP fallback error (socket may have succeeded):', error);
      }
    } catch (error) {
      console.error('Error canceling friend request:', error);
      alert(error.message || 'Failed to cancel friend request');
    } finally {
      setActionLoading(prev => ({ ...prev, [`cancel-${userIdStr}`]: false }));
    }
  };

  const handleBlock = async (userId) => {
    if (!tokens?.accessToken) return;
    if (!confirm('Are you sure you want to block this user?')) return;
    
    setActionLoading(prev => ({ ...prev, [`block-${userId}`]: true }));
    try {
      // Use Socket.io for real-time blocking
      socketService.blockUser(userId);
      
      // The UI will update via socket event listener
      // But we can also use HTTP API as fallback
      try {
        await blockUser(tokens.accessToken, userId);
      } catch (error) {
        console.log('HTTP fallback error (socket may have succeeded):', error);
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert(error.message || 'Failed to block user');
    } finally {
      setActionLoading(prev => ({ ...prev, [`block-${userId}`]: false }));
    }
  };

  const handleDisconnect = async (userId) => {
    if (!tokens?.accessToken) return;
    if (!confirm('Are you sure you want to remove this connection?')) return;
    
    setActionLoading(prev => ({ ...prev, [`disconnect-${userId}`]: true }));
    try {
      // Use Socket.io for real-time connection removal
      socketService.removeConnection(userId);
      
      // The UI will update via socket event listener
      // But we can also use HTTP API as fallback
      try {
        await removeConnection(tokens.accessToken, userId);
      } catch (error) {
        console.log('HTTP fallback error (socket may have succeeded):', error);
      }
    } catch (error) {
      console.error('Error removing connection:', error);
      alert(error.message || 'Failed to remove connection');
    } finally {
      setActionLoading(prev => ({ ...prev, [`disconnect-${userId}`]: false }));
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetchUsers({ search: query, limit: 20 });
      if (response.success) {
        setSearchResults(response.data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
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

  const UserCard = ({ user: userData, onConnect, onDisconnect, onAccept, onReject, onCancel, onBlock, requestStatus = null, showDetails = false }) => {
    const userName = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User';
    const userAvatar = userData.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;
    const userId = userData._id || userData.user?._id || userData.user;
    const isLoading = actionLoading[userId] || actionLoading[`accept-${userId}`] || actionLoading[`reject-${userId}`] || actionLoading[`cancel-${userId}`] || actionLoading[`block-${userId}`] || actionLoading[`disconnect-${userId}`];

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100/50 p-6 card-hover animate-fade-in">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <img
              src={userAvatar}
              alt={userName}
              className="w-20 h-20 rounded-full object-cover cursor-pointer ring-2 ring-gray-200 hover:ring-blue-500 transition-all duration-300 shadow-md"
              onClick={() => navigate(`/profile/${userId}`)}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 
                  className="text-lg font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => navigate(`/profile/${userId}`)}
                >
                  {userName}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{userData.email || userData.user?.email}</p>
                {requestStatus && (
                  <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                    requestStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                    requestStatus === 'sent' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    {requestStatus === 'pending' ? 'Pending' : requestStatus === 'sent' ? 'Request Sent' : requestStatus}
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-3 flex space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {userData.papersCount || 0} posts
              </span>
            </div>
          
            <div className="mt-4 flex flex-wrap gap-2">
              {userData.isConnected ? (
                <>
                  <button
                    onClick={() => handleSendMessage(userId)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                  >
                    💬 Send Message
                  </button>
                  <button
                    onClick={() => onDisconnect && onDisconnect(userId)}
                    disabled={isLoading}
                    className="px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Removing...' : 'Disconnect'}
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${userId}`)}
                    className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                  >
                    View Profile
                  </button>
                </>
              ) : requestStatus === 'pending' ? (
                <>
                  <button
                    onClick={() => onAccept && onAccept(userId)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Accepting...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => onReject && onReject(userId)}
                    disabled={isLoading}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Declining...' : 'Decline'}
                  </button>
                  <button
                    onClick={() => onBlock && onBlock(userId)}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Block
                  </button>
                </>
              ) : requestStatus === 'sent' ? (
                <>
                  <button
                    onClick={() => onCancel && onCancel(userId)}
                    disabled={isLoading}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Canceling...' : 'Cancel Request'}
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${userId}`)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    View Profile
                  </button>
                </>
              ) : requestStatus === 'connected' ? (
                <>
                  {canSendMessage(userId) && (
                    <button
                      onClick={() => handleSendMessage(userId)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                    >
                      💬 Send Message
                    </button>
                  )}
                  <button
                    disabled
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg cursor-not-allowed"
                  >
                    Connected
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${userId}`)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    View Profile
                  </button>
                </>
              ) : (
                <>
                  {canSendMessage(userId) && (
                    <button
                      onClick={() => handleSendMessage(userId)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                    >
                      💬 Send Message
                    </button>
                  )}
                  <button
                    onClick={() => onConnect && onConnect(userId)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Send Request'}
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${userId}`)}
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 pt-20">
      <main className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6 mb-8 animate-fade-in">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
              </div>
              {isSearching && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100/50 p-6 card-hover animate-fade-in">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Connections</p>
                  <p className="text-3xl font-bold text-gray-900">{connections.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100/50 p-6 card-hover animate-fade-in">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Suggestions</p>
                  <p className="text-3xl font-bold text-gray-900">{suggestions.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Based on new users</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100/50 p-6 card-hover animate-fade-in">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Explore</p>
                  <p className="text-3xl font-bold text-gray-900">{exploreUsers.length}</p>
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
                        key={result._id}
                        user={result}
                        onConnect={handleConnect}
                        onCancel={handleCancel}
                        requestStatus={getUserRequestStatus(result._id)}
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
                    <p className="text-gray-600">Try searching with different keywords.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab('connections')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === 'connections'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Connections ({connections.length})
                  {pendingReceived.length > 0 && (
                    <span className="ml-1 bg-yellow-500 text-white rounded-full px-2 py-0.5 text-xs">
                      {pendingReceived.length} pending
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('suggestions')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === 'suggestions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Suggestions ({suggestions.length})
                </button>
                <button
                  onClick={() => setActiveTab('explore')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
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
                  {/* Show pending received requests first */}
                  {pendingReceived.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Requests ({pendingReceived.length})</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {pendingReceived.map(request => {
                          const requestUser = request.user || request.requester;
                          return (
                            <UserCard
                              key={request._id || requestUser._id}
                              user={requestUser}
                              onAccept={handleAccept}
                              onReject={handleReject}
                              onBlock={handleBlock}
                              requestStatus="pending"
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Show connections */}
                  {connections.length > 0 ? (
                    <div>
                      {pendingReceived.length > 0 && (
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Connections ({connections.length})</h3>
                      )}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {connections.map(connection => (
                          <UserCard
                            key={connection._id}
                            user={connection}
                            onDisconnect={handleDisconnect}
                            onBlock={handleBlock}
                            requestStatus="connected"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {pendingReceived.length > 0 ? 'No connections yet' : 'No connections or requests'}
                      </h3>
                      <p className="text-gray-600 mb-4">Start building your network by connecting with other users.</p>
                      {pendingReceived.length === 0 && (
                        <button
                          onClick={() => setActiveTab('suggestions')}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View suggestions
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : activeTab === 'suggestions' ? (
                <div>
                  {suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {suggestions.map(suggestion => (
                        <UserCard
                          key={suggestion._id}
                          user={suggestion}
                          onConnect={handleConnect}
                          onCancel={handleCancel}
                          requestStatus={getUserRequestStatus(suggestion._id)}
                          showDetails={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions available</h3>
                      <p className="text-gray-600 mb-4">All users are already connected or in your suggestions.</p>
                      <button
                        onClick={() => setActiveTab('explore')}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Explore more users
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Discover Users</h3>
                    <p className="text-gray-600">Explore and connect with other users in the platform.</p>
                  </div>
                  {exploreUsers.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {exploreUsers.map(exploreUser => (
                        <UserCard
                          key={exploreUser._id}
                          user={exploreUser}
                          onConnect={handleConnect}
                          onCancel={handleCancel}
                          requestStatus={getUserRequestStatus(exploreUser._id)}
                          showDetails={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No users to explore</h3>
                      <p className="text-gray-600">All users are already in your network.</p>
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
