import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';
import { fetchPosts, fetchPostComments, updatePost, deletePost } from '../api/postApi';

const SocialFeed = () => {
  const { user, isAuthenticated, socketService: authSocketService } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'papers'
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({}); // Track which posts have comments expanded
  const [processingReactions, setProcessingReactions] = useState(new Set()); // Track posts being processed
  const [editingPost, setEditingPost] = useState(null); // Track which post is being edited
  const [editFormData, setEditFormData] = useState({}); // Store edit form data
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // Track post to delete
  const inputRefs = useRef({}); // Refs to maintain focus on comment inputs

  // Fetch posts from API
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadPosts = async () => {
      try {
        setLoading(true);
        // Fetch both posts and papers
        const [postsResponse, papersResponse] = await Promise.all([
          fetchPosts({ type: 'post', limit: 50 }),
          fetchPosts({ type: 'paper_share', limit: 50 })
        ]);
        
        let allPosts = [];
        
        if (postsResponse.success && postsResponse.data.posts) {
          allPosts = [...allPosts, ...postsResponse.data.posts];
        }
        
        if (papersResponse.success && papersResponse.data.posts) {
          allPosts = [...allPosts, ...papersResponse.data.posts];
        }
        
        // Mark if current user liked/disliked each post
        const postsWithReactions = allPosts.map(post => ({
          ...post,
          isLiked: post.likes?.some(like => 
            String(like.user?._id || like.user) === String(user?._id || user?.id)
          ) || false,
          isDisliked: post.dislikes?.some(dislike => 
            String(dislike.user?._id || dislike.user) === String(user?._id || user?.id)
          ) || false
        }));
        
        // Sort by createdAt (newest first)
        postsWithReactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setPosts(postsWithReactions);
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [isAuthenticated, navigate]);

  // Real-time Socket.io listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for new posts (only type='post', not papers)
    const handleNewPost = (data) => {
      console.log('📝 New post received:', data);
      if (data.post && data.post.type === 'post') {
        // Mark if current user liked/disliked
        const postWithReactions = {
          ...data.post,
          isLiked: data.post.likes?.some(like => 
            String(like.user?._id || like.user) === String(user?._id || user?.id)
          ) || false,
          isDisliked: data.post.dislikes?.some(dislike => 
            String(dislike.user?._id || dislike.user) === String(user?._id || user?.id)
          ) || false
        };
        setPosts(prev => [postWithReactions, ...prev]);
      }
    };

    // Listen for post likes
    const handlePostLiked = (data) => {
      console.log('👍 Post liked:', data);
      // Store focused input before update
      const focusedInputId = Object.keys(inputRefs.current).find(
        id => inputRefs.current[id] === document.activeElement
      );
      
      const currentUserId = String(user?._id || user?.id);
      const eventUserId = String(data.userId || data.user?._id || data.user);
      const isCurrentUser = currentUserId === eventUserId;
      
      setPosts(prev => prev.map(post => {
        if (post._id === data.postId) {
          // Only update if this is not the current user (to avoid overwriting optimistic update)
          // Or update counts from server to ensure accuracy
          if (isCurrentUser) {
            // For current user, keep optimistic state but sync counts from server
            return {
              ...post,
              likeCount: data.likeCount !== undefined ? data.likeCount : post.likeCount,
              dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : post.dislikeCount,
              // Keep optimistic state
              isLiked: post.isLiked,
              isDisliked: post.isDisliked
            };
          } else {
            // For other users, update normally
            return {
              ...post,
              likeCount: data.likeCount !== undefined ? data.likeCount : post.likeCount,
              dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : post.dislikeCount,
              isLiked: post.isLiked,
              isDisliked: post.isDisliked
            };
          }
        }
        return post;
      }));
      
      // Restore focus after update
      if (focusedInputId && inputRefs.current[focusedInputId]) {
        setTimeout(() => {
          inputRefs.current[focusedInputId]?.focus();
        }, 0);
      }
    };

    // Listen for post unlikes
    const handlePostUnliked = (data) => {
      console.log('👎 Post unliked:', data);
      // Store focused input before update
      const focusedInputId = Object.keys(inputRefs.current).find(
        id => inputRefs.current[id] === document.activeElement
      );
      
      const currentUserId = String(user?._id || user?.id);
      const eventUserId = String(data.userId || data.user?._id || data.user);
      const isCurrentUser = currentUserId === eventUserId;
      
      setPosts(prev => prev.map(post => {
        if (post._id === data.postId) {
          // Only update if this is not the current user (to avoid overwriting optimistic update)
          if (isCurrentUser) {
            // For current user, keep optimistic state but sync counts from server
            return {
              ...post,
              likeCount: data.likeCount !== undefined ? data.likeCount : post.likeCount,
              dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : post.dislikeCount,
              // Keep optimistic state
              isLiked: post.isLiked,
              isDisliked: post.isDisliked
            };
          } else {
            // For other users, update normally
            return {
              ...post,
              likeCount: data.likeCount !== undefined ? data.likeCount : post.likeCount,
              dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : post.dislikeCount,
              isLiked: post.isLiked,
              isDisliked: post.isDisliked
            };
          }
        }
        return post;
      }));
      
      // Restore focus after update
      if (focusedInputId && inputRefs.current[focusedInputId]) {
        setTimeout(() => {
          inputRefs.current[focusedInputId]?.focus();
        }, 0);
      }
    };

    // Listen for post dislikes
    const handlePostDisliked = (data) => {
      console.log('👎 Post disliked:', data);
      // Store focused input before update
      const focusedInputId = Object.keys(inputRefs.current).find(
        id => inputRefs.current[id] === document.activeElement
      );
      
      const currentUserId = String(user?._id || user?.id);
      const eventUserId = String(data.userId || data.user?._id || data.user);
      const isCurrentUser = currentUserId === eventUserId;
      
      setPosts(prev => prev.map(post => {
        if (post._id === data.postId) {
          // Only update if this is not the current user (to avoid overwriting optimistic update)
          if (isCurrentUser) {
            // For current user, keep optimistic state but sync counts from server
            return {
              ...post,
              likeCount: data.likeCount !== undefined ? data.likeCount : post.likeCount,
              dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : post.dislikeCount,
              // Keep optimistic state
              isLiked: post.isLiked,
              isDisliked: post.isDisliked
            };
          } else {
            // For other users, update normally
            return {
              ...post,
              likeCount: data.likeCount !== undefined ? data.likeCount : post.likeCount,
              dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : post.dislikeCount,
              isLiked: post.isLiked,
              isDisliked: post.isDisliked
            };
          }
        }
        return post;
      }));
      
      // Restore focus after update
      if (focusedInputId && inputRefs.current[focusedInputId]) {
        setTimeout(() => {
          inputRefs.current[focusedInputId]?.focus();
        }, 0);
      }
    };

    // Listen for post undislikes
    const handlePostUndisliked = (data) => {
      console.log('👍 Post undisliked:', data);
      // Store focused input before update
      const focusedInputId = Object.keys(inputRefs.current).find(
        id => inputRefs.current[id] === document.activeElement
      );
      
      const currentUserId = String(user?._id || user?.id);
      const eventUserId = String(data.userId || data.user?._id || data.user);
      const isCurrentUser = currentUserId === eventUserId;
      
      setPosts(prev => prev.map(post => {
        if (post._id === data.postId) {
          // Only update if this is not the current user (to avoid overwriting optimistic update)
          if (isCurrentUser) {
            // For current user, keep optimistic state but sync counts from server
            return {
              ...post,
              likeCount: data.likeCount !== undefined ? data.likeCount : post.likeCount,
              dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : post.dislikeCount,
              // Keep optimistic state
              isLiked: post.isLiked,
              isDisliked: post.isDisliked
            };
          } else {
            // For other users, update normally
            return {
              ...post,
              likeCount: data.likeCount !== undefined ? data.likeCount : post.likeCount,
              dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : post.dislikeCount,
              isLiked: post.isLiked,
              isDisliked: post.isDisliked
            };
          }
        }
        return post;
      }));
      
      // Restore focus after update
      if (focusedInputId && inputRefs.current[focusedInputId]) {
        setTimeout(() => {
          inputRefs.current[focusedInputId]?.focus();
        }, 0);
      }
    };

    // Listen for new comments
    const handleNewComment = (data) => {
      console.log('💬 New comment received:', data);
      if (data.comment && data.postId) {
        // Store focused input before update
        const focusedInputId = Object.keys(inputRefs.current).find(
          id => inputRefs.current[id] === document.activeElement
        );
        
        setPosts(prev => prev.map(post => {
          if (post._id === data.postId) {
            return {
              ...post,
              comments: [...(post.comments || []), data.comment],
              commentCount: (post.commentCount || 0) + 1
            };
          }
          return post;
        }));
        
        // If comments are expanded for this post, add the new comment to the expanded list
        if (expandedComments[data.postId]) {
          setExpandedComments(prev => ({
            ...prev,
            [data.postId]: [...(prev[data.postId] || []), data.comment]
          }));
        }
        
        // Restore focus after update (only if not the post that received the comment)
        if (focusedInputId && focusedInputId !== data.postId && inputRefs.current[focusedInputId]) {
          setTimeout(() => {
            inputRefs.current[focusedInputId]?.focus();
          }, 0);
        }
      }
    };

    // Register listeners
    socketService.on('post:new', handleNewPost);
    socketService.on('post:liked', handlePostLiked);
    socketService.on('post:unliked', handlePostUnliked);
    socketService.on('post:disliked', handlePostDisliked);
    socketService.on('post:undisliked', handlePostUndisliked);
    socketService.on('comment:new', handleNewComment);

    // Cleanup
    return () => {
      socketService.off('post:new', handleNewPost);
      socketService.off('post:liked', handlePostLiked);
      socketService.off('post:unliked', handlePostUnliked);
      socketService.off('post:disliked', handlePostDisliked);
      socketService.off('post:undisliked', handlePostUndisliked);
      socketService.off('comment:new', handleNewComment);
    };
  }, [isAuthenticated, user]);

  const handleLike = (postId) => {
    // Prevent multiple rapid clicks
    if (processingReactions.has(postId)) {
      return;
    }

    // Mark as processing
    setProcessingReactions(prev => new Set(prev).add(postId));

    // Get current state before update
    const currentPost = posts.find(p => p._id === postId);
    if (!currentPost) {
      setProcessingReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      return;
    }

    const currentlyLiked = currentPost.isLiked;
    const currentlyDisliked = currentPost.isDisliked;
    const currentLikeCount = currentPost.likeCount || currentPost.likes?.length || 0;
    const currentDislikeCount = currentPost.dislikeCount || currentPost.dislikes?.length || 0;

    // Determine what socket events to send BEFORE state update
    const shouldUnlike = currentlyLiked;
    const shouldUndislike = !currentlyLiked && currentlyDisliked;

    // Optimistic update - update UI immediately
    setPosts(prev => prev.map(post => {
      if (post._id === postId) {
        if (currentlyLiked) {
          // Unlike: remove like
          return {
            ...post,
            isLiked: false,
            isDisliked: false,
            likeCount: Math.max(0, currentLikeCount - 1),
            dislikeCount: currentDislikeCount
          };
        } else {
          // Like: add like, remove dislike if exists
          return {
            ...post,
            isLiked: true,
            isDisliked: false,
            likeCount: currentLikeCount + 1,
            dislikeCount: currentlyDisliked ? Math.max(0, currentDislikeCount - 1) : currentDislikeCount
          };
        }
      }
      return post;
    }));

    // Send socket event
    if (shouldUnlike) {
      socketService.unlikePost(postId);
    } else {
      if (shouldUndislike) {
        socketService.undislikePost(postId);
      }
      socketService.likePost(postId);
    }

    // Clear processing state after a short delay
    setTimeout(() => {
      setProcessingReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }, 500);
  };

  const handleDislike = (postId) => {
    // Prevent multiple rapid clicks
    if (processingReactions.has(postId)) {
      return;
    }

    // Mark as processing
    setProcessingReactions(prev => new Set(prev).add(postId));

    // Get current state before update
    const currentPost = posts.find(p => p._id === postId);
    if (!currentPost) {
      setProcessingReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      return;
    }

    const currentlyLiked = currentPost.isLiked;
    const currentlyDisliked = currentPost.isDisliked;
    const currentLikeCount = currentPost.likeCount || currentPost.likes?.length || 0;
    const currentDislikeCount = currentPost.dislikeCount || currentPost.dislikes?.length || 0;

    // Determine what socket events to send BEFORE state update
    const shouldUndislike = currentlyDisliked;
    const shouldUnlike = !currentlyDisliked && currentlyLiked;

    // Optimistic update - update UI immediately
    setPosts(prev => prev.map(post => {
      if (post._id === postId) {
        if (currentlyDisliked) {
          // Undislike: remove dislike
          return {
            ...post,
            isLiked: false,
            isDisliked: false,
            dislikeCount: Math.max(0, currentDislikeCount - 1),
            likeCount: currentLikeCount
          };
        } else {
          // Dislike: add dislike, remove like if exists
          return {
            ...post,
            isLiked: false,
            isDisliked: true,
            dislikeCount: currentDislikeCount + 1,
            likeCount: currentlyLiked ? Math.max(0, currentLikeCount - 1) : currentLikeCount
          };
        }
      }
      return post;
    }));

    // Send socket event
    if (shouldUndislike) {
      socketService.undislikePost(postId);
    } else {
      if (shouldUnlike) {
        socketService.unlikePost(postId);
      }
      socketService.dislikePost(postId);
    }

    // Clear processing state after a short delay
    setTimeout(() => {
      setProcessingReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }, 500);
  };

  const handleComment = useCallback((postId, commentText) => {
    if (!commentText.trim()) return;
    socketService.createComment(postId, commentText);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  }, []);

  const loadComments = async (postId) => {
    try {
      const response = await fetchPostComments(postId);
      if (response && response.success) {
        setExpandedComments(prev => ({
          ...prev,
          [postId]: response.data.comments || []
        }));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post._id);
    setEditFormData({
      text: post.content?.text || '',
      tags: post.tags?.join(', ') || '',
      visibility: post.visibility || 'public'
    });
  };

  const handleSaveEdit = async (postId) => {
    try {
      const tags = editFormData.tags
        ? editFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      const response = await updatePost(postId, {
        content: {
          text: editFormData.text
        },
        tags: tags,
        visibility: editFormData.visibility
      });

      if (response.success) {
        setPosts(prev => prev.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              content: { ...post.content, text: editFormData.text },
              tags: tags,
              visibility: editFormData.visibility,
              updatedAt: new Date().toISOString() // Mark as edited
            };
          }
          return post;
        }));
        setEditingPost(null);
        setEditFormData({});
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  const handleDelete = async (postId) => {
    try {
      const response = await deletePost(postId);
      console.log('Delete response:', response); // Debug log
      if (response && response.success) {
        setPosts(prev => prev.filter(post => post._id !== postId));
        setShowDeleteConfirm(null);
      } else {
        const errorMessage = response?.message || response?.error || 'Failed to delete post. Please try again.';
        alert(errorMessage);
        console.error('Delete failed:', response);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error.message || 'Failed to delete post. Please try again.');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'posts') return post.type === 'post';
    if (activeTab === 'papers') return post.type === 'paper_share';
    return true;
  });

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postTime) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return postTime.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feed...</p>
        </div>
      </div>
    );
  }

  const PostCard = ({ post }) => {
    const authorName = post.author?.fullName || `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || 'Unknown User';
    const authorAvatar = post.author?.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authorName);

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100/50 p-6 mb-6 animate-fade-in card-hover">
        {/* Author Info */}
        <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-100">
          <button
            onClick={() => navigate(`/profile/${post.author?._id || post.author}`)}
            className="hover:opacity-80 transition-transform hover:scale-105"
          >
            <div className="relative">
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-14 h-14 rounded-full object-cover cursor-pointer ring-2 ring-gray-200 hover:ring-blue-500 transition-all duration-300 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          </button>
          <div className="flex-1">
            <button
              onClick={() => navigate(`/profile/${post.author?._id || post.author}`)}
              className="text-left hover:text-blue-600 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 cursor-pointer text-lg">{authorName}</h3>
            </button>
            <p className="text-xs text-gray-500 flex items-center space-x-2 mt-1">
              <span>{formatTimeAgo(post.createdAt)}</span>
              {post.updatedAt && new Date(post.updatedAt) > new Date(post.createdAt) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  • Edited
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {post.type === 'paper_share' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md">
                📄 Research Paper
              </span>
            )}
            {/* Edit/Delete buttons for own posts */}
            {String(post.author?._id || post.author) === String(user?._id || user?.id) && (
              <div className="flex items-center space-x-2 ml-2">
                <button
                  onClick={() => handleEdit(post)}
                  className="p-1 text-gray-500 hover:text-blue-600 transition"
                  title="Edit post"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(post._id)}
                  className="p-1 text-gray-500 hover:text-red-600 transition"
                  title="Delete post"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          {editingPost === post._id ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                <textarea
                  value={editFormData.text}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, text: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editFormData.tags}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility</label>
                <select
                  value={editFormData.visibility}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, visibility: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="public">Public</option>
                  <option value="connections_only">Connections Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleSaveEdit(post._id)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setEditFormData({});
                  }}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {post.type === 'paper' || post.type === 'paper_share' ? (
                <div>
                  {post.content?.title && (
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{post.content.title}</h4>
                  )}
                  {post.content?.abstract && (
                    <p className="text-gray-600 mb-3 line-clamp-3">{post.content.abstract}</p>
                  )}
                  {post.content?.category && (
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        {post.content.category}
                      </span>
                      {post.content?.doi && <span>DOI: {post.content.doi}</span>}
                    </div>
                  )}
                  {post.content?.attachment?.url && (
                    <div className="mt-3">
                      <a
                        href={post.content.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        View PDF
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-900 whitespace-pre-wrap">{post.content?.text || ''}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLike(post._id)}
              disabled={processingReactions.has(post._id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                post.isLiked 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              } ${processingReactions.has(post._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-5 h-5" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="font-semibold">{post.likeCount || post.likes?.length || 0}</span>
            </button>

            <button
              onClick={() => handleDislike(post._id)}
              disabled={processingReactions.has(post._id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                post.isDisliked 
                  ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-600 hover:text-red-600 hover:bg-gray-50'
              } ${processingReactions.has(post._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-5 h-5" fill={post.isDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" style={{ transform: post.isDisliked ? 'rotate(180deg)' : 'none' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="font-semibold">{post.dislikeCount || post.dislikes?.length || 0}</span>
            </button>

            <button
              onClick={() => {
                const showComments = expandedComments[post._id] !== undefined;
                if (!showComments) {
                  loadComments(post._id);
                } else {
                  setExpandedComments(prev => {
                    const newState = { ...prev };
                    delete newState[post._id];
                    return newState;
                  });
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-semibold">{post.commentCount || post.comments?.length || 0}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {expandedComments[post._id] && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {expandedComments[post._id].map(comment => (
                  <div key={comment._id} className="flex space-x-3 animate-fade-in">
                    <button
                      onClick={() => navigate(`/profile/${comment.author?._id || comment.author}`)}
                      className="hover:opacity-80 transition-transform hover:scale-105 flex-shrink-0"
                    >
                      <img
                        src={comment.author?.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(comment.author?.firstName || 'User')}
                        alt={comment.author?.firstName || 'User'}
                        className="w-10 h-10 rounded-full object-cover cursor-pointer ring-2 ring-gray-200 hover:ring-blue-500 transition-all duration-200"
                      />
                    </button>
                    <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-4 border border-gray-100">
                      <button
                        onClick={() => navigate(`/profile/${comment.author?._id || comment.author}`)}
                        className="text-sm font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                      >
                        {comment.author?.firstName} {comment.author?.lastName}
                      </button>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{comment.content}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatTimeAgo(comment.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Comment */}
            <div className="flex space-x-2">
              <input
                type="text"
                ref={(el) => {
                  if (el) {
                    inputRefs.current[`expanded-${post._id}`] = el;
                  }
                }}
                value={commentInputs[post._id] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setCommentInputs(prev => ({ ...prev, [post._id]: value }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const commentText = commentInputs[post._id] || '';
                    if (commentText.trim()) {
                      handleComment(post._id, commentText);
                    }
                  }
                }}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                autoComplete="off"
              />
              <button
                onClick={() => handleComment(post._id, commentInputs[post._id])}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                Post
              </button>
            </div>
          </div>
        )}

        {/* Comment Input (when comments not expanded) */}
        {!expandedComments[post._id] && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <input
                type="text"
                ref={(el) => {
                  if (el) {
                    inputRefs.current[post._id] = el;
                  }
                }}
                value={commentInputs[post._id] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setCommentInputs(prev => ({ ...prev, [post._id]: value }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const commentText = commentInputs[post._id] || '';
                    if (commentText.trim()) {
                      handleComment(post._id, commentText);
                    }
                  }
                }}
                onBlur={(e) => {
                  // Store that this input was focused
                  if (e.target === document.activeElement) {
                    // Input is still focused, do nothing
                  }
                }}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                autoComplete="off"
              />
              <button
                onClick={() => handleComment(post._id, commentInputs[post._id])}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 pt-20">
      <main className="w-full py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="mb-8 flex space-x-2 bg-white/60 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-100/50">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-6 py-3 font-semibold text-sm rounded-xl transition-all duration-200 ${
                activeTab === 'posts'
                  ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              📝 All Posts
            </button>
            <button
              onClick={() => setActiveTab('papers')}
              className={`flex-1 px-6 py-3 font-semibold text-sm rounded-xl transition-all duration-200 ${
                activeTab === 'papers'
                  ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              📄 Research Papers
            </button>
          </div>

          {/* Feed */}
          <div>
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <PostCard key={post._id} post={post} />
              ))
            ) : (
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 animate-fade-in">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No {activeTab === 'posts' ? 'posts' : 'papers'} yet</h3>
                <p className="text-gray-600 mb-6">
                  Be the first to share something! Create a post to get started.
                </p>
                <button
                  onClick={() => navigate('/create-post')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Post
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Post</h3>
            </div>
            <p className="text-gray-600 mb-6 ml-16">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 ml-16">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-6 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
