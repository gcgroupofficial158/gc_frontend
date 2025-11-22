import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchPosts, fetchPostComments, updatePost, deletePost } from '../api/postApi';
import socketService from '../services/socketService';

const Papers = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [processingReactions, setProcessingReactions] = useState(new Set()); // Track papers being processed
  const [editingPaper, setEditingPaper] = useState(null); // Track which paper is being edited
  const [editFormData, setEditFormData] = useState({}); // Store edit form data
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // Track paper to delete
  const inputRefs = useRef({}); // Refs to maintain focus on comment inputs

  const categories = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Medicine',
    'Engineering',
    'Social Sciences',
    'Economics',
    'Psychology',
    'Other'
  ];

  // Fetch real posts from API (filter for paper_share type)
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadPapers = async () => {
      try {
        setLoading(true);
        const response = await fetchPosts({ type: 'paper_share', limit: 100 });
        if (response.success && response.data.posts) {
          // Convert posts to paper format with like status
          const papersData = response.data.posts.map(post => ({
            _id: post._id,
            title: post.content?.title || 'Untitled Paper',
            abstract: post.content?.abstract || post.content?.text || '',
            authors: post.author ? [`${post.author.firstName} ${post.author.lastName}`] : ['Unknown'],
            category: post.content?.category || 'Other',
            publishedDate: post.createdAt,
            citations: 0, // Can be added later
            downloads: 0, // Can be added later
            status: 'published',
            doi: post.content?.doi || '',
            keywords: post.tags || [],
            author: post.author,
            createdAt: post.createdAt,
            // Keep original post data for like/comment/share
            type: post.type,
            content: post.content,
            tags: post.tags,
            likes: post.likes,
            likeCount: post.likeCount || post.likes?.length || 0,
            commentCount: post.commentCount || post.comments?.length || 0,
            shareCount: post.shareCount || post.shares?.length || 0,
            isLiked: post.likes?.some(like => 
              String(like.user?._id || like.user) === String(user?._id || user?.id)
            ) || false,
            isDisliked: post.dislikes?.some(dislike => 
              String(dislike.user?._id || dislike.user) === String(user?._id || user?.id)
            ) || false,
            dislikes: post.dislikes,
            dislikeCount: post.dislikeCount || post.dislikes?.length || 0,
            comments: post.comments
          }));
          setPapers(papersData);
        }
      } catch (error) {
        console.error('Error loading papers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPapers();
  }, [isAuthenticated, navigate, user]);

  // Real-time Socket.io listeners for papers
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewPost = (data) => {
      if (data.post && data.post.type === 'paper_share') {
        const paperData = {
          _id: data.post._id,
          title: data.post.content?.title || 'Untitled Paper',
          abstract: data.post.content?.abstract || '',
          authors: data.post.author ? [`${data.post.author.firstName} ${data.post.author.lastName}`] : ['Unknown'],
          category: data.post.content?.category || 'Other',
          publishedDate: data.post.createdAt,
          citations: 0,
          downloads: 0,
          status: 'published',
          doi: data.post.content?.doi || '',
          keywords: data.post.tags || [],
          author: data.post.author,
          createdAt: data.post.createdAt,
          type: data.post.type,
          content: data.post.content,
          tags: data.post.tags,
          likes: data.post.likes || [],
          likeCount: data.post.likeCount || 0,
          commentCount: data.post.commentCount || 0,
          shareCount: data.post.shareCount || 0,
          isLiked: false,
          isDisliked: false,
          dislikes: data.post.dislikes || [],
          comments: data.post.comments || []
        };
        setPapers(prev => [paperData, ...prev]);
      }
    };

    const handlePostLiked = (data) => {
      if (data.postId) {
        // Store focused input before update
        const focusedInputKey = Object.keys(inputRefs.current).find(
          key => inputRefs.current[key] === document.activeElement
        );
        
        const currentUserId = String(user?._id || user?.id);
        const eventUserId = String(data.userId || data.user?._id || data.user);
        const isCurrentUser = currentUserId === eventUserId;
        
        setPapers(prev => prev.map(paper => {
          if (paper._id === data.postId) {
            if (isCurrentUser) {
              // For current user, keep optimistic state but sync counts from server
              return {
                ...paper,
                likeCount: data.likeCount !== undefined ? data.likeCount : paper.likeCount,
                dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : paper.dislikeCount,
                // Keep optimistic state
                isLiked: paper.isLiked,
                isDisliked: paper.isDisliked
              };
            } else {
              // For other users, update normally
              return {
                ...paper,
                likeCount: data.likeCount !== undefined ? data.likeCount : (paper.likeCount || 0) + 1,
                dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : paper.dislikeCount,
                isLiked: paper.isLiked,
                isDisliked: paper.isDisliked
              };
            }
          }
          return paper;
        }));
        
        // Restore focus after update
        if (focusedInputKey && inputRefs.current[focusedInputKey]) {
          setTimeout(() => {
            inputRefs.current[focusedInputKey]?.focus();
          }, 0);
        }
      }
    };

    const handlePostUnliked = (data) => {
      if (data.postId) {
        // Store focused input before update
        const focusedInputKey = Object.keys(inputRefs.current).find(
          key => inputRefs.current[key] === document.activeElement
        );
        
        const currentUserId = String(user?._id || user?.id);
        const eventUserId = String(data.userId || data.user?._id || data.user);
        const isCurrentUser = currentUserId === eventUserId;
        
        setPapers(prev => prev.map(paper => {
          if (paper._id === data.postId) {
            if (isCurrentUser) {
              // For current user, keep optimistic state but sync counts from server
              return {
                ...paper,
                likeCount: data.likeCount !== undefined ? data.likeCount : paper.likeCount,
                dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : paper.dislikeCount,
                // Keep optimistic state
                isLiked: paper.isLiked,
                isDisliked: paper.isDisliked
              };
            } else {
              // For other users, update normally
              return {
                ...paper,
                likeCount: data.likeCount !== undefined ? data.likeCount : Math.max(0, (paper.likeCount || 0) - 1),
                dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : paper.dislikeCount,
                isLiked: paper.isLiked,
                isDisliked: paper.isDisliked
              };
            }
          }
          return paper;
        }));
        
        // Restore focus after update
        if (focusedInputKey && inputRefs.current[focusedInputKey]) {
          setTimeout(() => {
            inputRefs.current[focusedInputKey]?.focus();
          }, 0);
        }
      }
    };

    const handlePostDisliked = (data) => {
      if (data.postId) {
        // Store focused input before update
        const focusedInputKey = Object.keys(inputRefs.current).find(
          key => inputRefs.current[key] === document.activeElement
        );
        
        const currentUserId = String(user?._id || user?.id);
        const eventUserId = String(data.userId || data.user?._id || data.user);
        const isCurrentUser = currentUserId === eventUserId;
        
        setPapers(prev => prev.map(paper => {
          if (paper._id === data.postId) {
            if (isCurrentUser) {
              // For current user, keep optimistic state but sync counts from server
              return {
                ...paper,
                likeCount: data.likeCount !== undefined ? data.likeCount : paper.likeCount,
                dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : paper.dislikeCount,
                // Keep optimistic state
                isLiked: paper.isLiked,
                isDisliked: paper.isDisliked
              };
            } else {
              // For other users, update normally
              return {
                ...paper,
                likeCount: data.likeCount !== undefined ? data.likeCount : paper.likeCount,
                dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : (paper.dislikeCount || 0) + 1,
                isLiked: paper.isLiked,
                isDisliked: paper.isDisliked
              };
            }
          }
          return paper;
        }));
        
        // Restore focus after update
        if (focusedInputKey && inputRefs.current[focusedInputKey]) {
          setTimeout(() => {
            inputRefs.current[focusedInputKey]?.focus();
          }, 0);
        }
      }
    };

    const handlePostUndisliked = (data) => {
      if (data.postId) {
        // Store focused input before update
        const focusedInputKey = Object.keys(inputRefs.current).find(
          key => inputRefs.current[key] === document.activeElement
        );
        
        const currentUserId = String(user?._id || user?.id);
        const eventUserId = String(data.userId || data.user?._id || data.user);
        const isCurrentUser = currentUserId === eventUserId;
        
        setPapers(prev => prev.map(paper => {
          if (paper._id === data.postId) {
            if (isCurrentUser) {
              // For current user, keep optimistic state but sync counts from server
              return {
                ...paper,
                likeCount: data.likeCount !== undefined ? data.likeCount : paper.likeCount,
                dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : paper.dislikeCount,
                // Keep optimistic state
                isLiked: paper.isLiked,
                isDisliked: paper.isDisliked
              };
            } else {
              // For other users, update normally
              return {
                ...paper,
                likeCount: data.likeCount !== undefined ? data.likeCount : paper.likeCount,
                dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : Math.max(0, (paper.dislikeCount || 0) - 1),
                isLiked: paper.isLiked,
                isDisliked: paper.isDisliked
              };
            }
          }
          return paper;
        }));
        
        // Restore focus after update
        if (focusedInputKey && inputRefs.current[focusedInputKey]) {
          setTimeout(() => {
            inputRefs.current[focusedInputKey]?.focus();
          }, 0);
        }
      }
    };

    const handleNewComment = (data) => {
      if (data.postId) {
        // Store focused input before update
        const focusedInputKey = Object.keys(inputRefs.current).find(
          key => inputRefs.current[key] === document.activeElement
        );
        
        setPapers(prev => prev.map(paper => {
          if (paper._id === data.postId) {
            return {
              ...paper,
              commentCount: (paper.commentCount || 0) + 1
            };
          }
          return paper;
        }));
        
        // Restore focus after update (only if not the paper that received the comment)
        if (focusedInputKey && !focusedInputKey.includes(data.postId) && inputRefs.current[focusedInputKey]) {
          setTimeout(() => {
            inputRefs.current[focusedInputKey]?.focus();
          }, 0);
        }
      }
    };

    socketService.on('post:new', handleNewPost);
    socketService.on('post:liked', handlePostLiked);
    socketService.on('post:unliked', handlePostUnliked);
    socketService.on('post:disliked', handlePostDisliked);
    socketService.on('post:undisliked', handlePostUndisliked);
    socketService.on('comment:new', handleNewComment);

    return () => {
      socketService.off('post:new', handleNewPost);
      socketService.off('post:liked', handlePostLiked);
      socketService.off('post:unliked', handlePostUnliked);
      socketService.off('post:disliked', handlePostDisliked);
      socketService.off('post:undisliked', handlePostUndisliked);
      socketService.off('comment:new', handleNewComment);
    };
  }, [isAuthenticated, user]);

  const handleLike = (paperId, e) => {
    e.stopPropagation(); // Prevent card click
    
    // Prevent multiple rapid clicks
    if (processingReactions.has(paperId)) {
      return;
    }

    // Mark as processing
    setProcessingReactions(prev => new Set(prev).add(paperId));

    // Get current state before update
    const currentPaper = papers.find(p => p._id === paperId);
    if (!currentPaper) {
      setProcessingReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(paperId);
        return newSet;
      });
      return;
    }

    const currentlyLiked = currentPaper.isLiked;
    const currentlyDisliked = currentPaper.isDisliked;
    const currentLikeCount = currentPaper.likeCount || currentPaper.likes?.length || 0;
    const currentDislikeCount = currentPaper.dislikeCount || currentPaper.dislikes?.length || 0;

    // Determine what socket events to send BEFORE state update
    const shouldUnlike = currentlyLiked;
    const shouldUndislike = !currentlyLiked && currentlyDisliked;

    // Optimistic update - update UI immediately
    setPapers(prev => prev.map(paper => {
      if (paper._id === paperId) {
        if (currentlyLiked) {
          // Unlike: remove like
          return {
            ...paper,
            isLiked: false,
            isDisliked: false,
            likeCount: Math.max(0, currentLikeCount - 1),
            dislikeCount: currentDislikeCount
          };
        } else {
          // Like: add like, remove dislike if exists
          return {
            ...paper,
            isLiked: true,
            isDisliked: false,
            likeCount: currentLikeCount + 1,
            dislikeCount: currentlyDisliked ? Math.max(0, currentDislikeCount - 1) : currentDislikeCount
          };
        }
      }
      return paper;
    }));

    // Send socket event
    if (shouldUnlike) {
      socketService.unlikePost(paperId);
    } else {
      if (shouldUndislike) {
        socketService.undislikePost(paperId);
      }
      socketService.likePost(paperId);
    }

    // Clear processing state after a short delay
    setTimeout(() => {
      setProcessingReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(paperId);
        return newSet;
      });
    }, 500);
  };

  const handleDislike = (paperId, e) => {
    e.stopPropagation(); // Prevent card click
    
    // Prevent multiple rapid clicks
    if (processingReactions.has(paperId)) {
      return;
    }

    // Mark as processing
    setProcessingReactions(prev => new Set(prev).add(paperId));

    // Get current state before update
    const currentPaper = papers.find(p => p._id === paperId);
    if (!currentPaper) {
      setProcessingReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(paperId);
        return newSet;
      });
      return;
    }

    const currentlyLiked = currentPaper.isLiked;
    const currentlyDisliked = currentPaper.isDisliked;
    const currentLikeCount = currentPaper.likeCount || currentPaper.likes?.length || 0;
    const currentDislikeCount = currentPaper.dislikeCount || currentPaper.dislikes?.length || 0;

    // Determine what socket events to send BEFORE state update
    const shouldUndislike = currentlyDisliked;
    const shouldUnlike = !currentlyDisliked && currentlyLiked;

    // Optimistic update - update UI immediately
    setPapers(prev => prev.map(paper => {
      if (paper._id === paperId) {
        if (currentlyDisliked) {
          // Undislike: remove dislike
          return {
            ...paper,
            isLiked: false,
            isDisliked: false,
            dislikeCount: Math.max(0, currentDislikeCount - 1),
            likeCount: currentLikeCount
          };
        } else {
          // Dislike: add dislike, remove like if exists
          return {
            ...paper,
            isLiked: false,
            isDisliked: true,
            dislikeCount: currentDislikeCount + 1,
            likeCount: currentlyLiked ? Math.max(0, currentLikeCount - 1) : currentLikeCount
          };
        }
      }
      return paper;
    }));

    // Send socket event
    if (shouldUndislike) {
      socketService.undislikePost(paperId);
    } else {
      if (shouldUnlike) {
        socketService.unlikePost(paperId);
      }
      socketService.dislikePost(paperId);
    }

    // Clear processing state after a short delay
    setTimeout(() => {
      setProcessingReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(paperId);
        return newSet;
      });
    }, 500);
  };

  const handleComment = useCallback(async (paperId, commentText, e) => {
    if (e) e.stopPropagation(); // Prevent card click
    if (!commentText.trim()) return;
    socketService.createComment(paperId, commentText);
    setCommentInputs(prev => ({ ...prev, [paperId]: '' }));
  }, []);

  const loadComments = async (paperId, e) => {
    if (e) e.stopPropagation(); // Prevent card click
    try {
      const response = await fetchPostComments(paperId);
      if (response && response.success) {
        const comments = response.data?.comments || [];
        setExpandedComments(prev => ({ ...prev, [paperId]: comments }));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleEdit = (paper) => {
    setEditingPaper(paper._id);
    setEditFormData({
      title: paper.content?.title || '',
      abstract: paper.content?.abstract || '',
      tags: paper.tags?.join(', ') || '',
      visibility: paper.visibility || 'public'
    });
  };

  const handleSaveEdit = async (paperId) => {
    try {
      const tags = editFormData.tags
        ? editFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      const response = await updatePost(paperId, {
        content: {
          title: editFormData.title,
          abstract: editFormData.abstract
        },
        tags: tags,
        visibility: editFormData.visibility
      });

      if (response && response.success) {
        setPapers(prev => prev.map(paper => {
          if (paper._id === paperId) {
            return {
              ...paper,
              content: { ...paper.content, title: editFormData.title, abstract: editFormData.abstract },
              tags: tags,
              visibility: editFormData.visibility,
              updatedAt: new Date().toISOString() // Mark as edited
            };
          }
          return paper;
        }));
        setEditingPaper(null);
        setEditFormData({});
      } else {
        alert(response?.message || 'Failed to update paper. Please try again.');
      }
    } catch (error) {
      console.error('Error updating paper:', error);
      alert(error.message || 'Failed to update paper. Please try again.');
    }
  };

  const handleDelete = async (paperId) => {
    try {
      const response = await deletePost(paperId);
      if (response && response.success) {
        setPapers(prev => prev.filter(paper => paper._id !== paperId));
        setShowDeleteConfirm(null);
      } else {
        alert(response?.message || 'Failed to delete paper. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting paper:', error);
      alert(error.message || 'Failed to delete paper. Please try again.');
    }
  };

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

  const filteredPapers = papers.filter(paper => {
    const title = paper.content?.title || '';
    const abstract = paper.content?.abstract || '';
    const authors = paper.content?.authors || [];
    const authorNames = Array.isArray(authors) ? authors.map(a => (typeof a === 'string' ? a : a.name || '')).join(' ') : '';
    const tags = paper.tags || [];
    
    const matchesSearch = searchTerm === '' || 
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
      authorNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === '' || paper.content?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedPapers = [...filteredPapers].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'likes':
        return (b.likeCount || 0) - (a.likeCount || 0);
      case 'comments':
        return (b.commentCount || 0) - (a.commentCount || 0);
      case 'title':
        return (a.content?.title || '').localeCompare(b.content?.title || '');
      default:
        return 0;
    }
  });

  const handlePaperClick = (paperId) => {
    navigate(`/paper/${paperId}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-gray-600 font-semibold text-lg">Loading research papers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 pt-20">
      <main className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Research Papers
                </h1>
                <p className="text-gray-600 text-lg mt-1">Discover and explore academic publications</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6 mb-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔍 Search Papers
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="Search by title, author, or keywords..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📂 Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔄 Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="date">Publication Date</option>
                  <option value="likes">Most Liked</option>
                  <option value="comments">Most Comments</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6 animate-fade-in">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 inline-block border border-gray-100/50">
              <p className="text-gray-700 font-semibold">
                Showing <span className="text-blue-600">{sortedPapers.length}</span> of <span className="text-purple-600">{papers.length}</span> papers
              </p>
            </div>
          </div>

          {/* Papers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedPapers.map(paper => (
              <div
                key={paper._id}
                onClick={() => handlePaperClick(paper._id)}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100/50 cursor-pointer card-hover animate-fade-in"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md">
                        {paper.content?.category || 'Research Paper'}
                      </span>
                      {/* Edit/Delete buttons for own papers */}
                      {String(paper.author?._id || paper.author) === String(user?._id || user?.id) && (
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(paper);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 transition"
                            title="Edit paper"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(paper._id);
                            }}
                            className="p-1 text-gray-500 hover:text-red-600 transition"
                            title="Delete paper"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600 font-medium">
                        {new Date(paper.createdAt).toLocaleDateString()}
                      </span>
                      {paper.updatedAt && new Date(paper.updatedAt) > new Date(paper.createdAt) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 ml-2">• Edited</span>
                      )}
                    </div>
                  </div>

                  {editingPaper === paper._id ? (
                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          value={editFormData.title}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Abstract</label>
                        <textarea
                          value={editFormData.abstract}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, abstract: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                        <input
                          type="text"
                          value={editFormData.tags}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, tags: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                        <select
                          value={editFormData.visibility}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, visibility: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="public">Public</option>
                          <option value="connections_only">Connections Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit(paper._id);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPaper(null);
                            setEditFormData({});
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
                        {paper.content?.title || 'Untitled Paper'}
                      </h3>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {paper.content?.abstract || ''}
                      </p>

                      {/* Author Info */}
                      {paper.author && (
                        <div className="mb-4 flex items-center space-x-3 pb-4 border-b border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${paper.author?._id || paper.author}`);
                            }}
                            className="flex items-center space-x-3 hover:opacity-80 transition-transform hover:scale-105"
                          >
                            <div className="relative">
                              <img
                                src={paper.author?.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(`${paper.author?.firstName || ''} ${paper.author?.lastName || ''}`.trim() || 'User')}
                                alt={`${paper.author?.firstName || ''} ${paper.author?.lastName || ''}`.trim() || 'User'}
                                className="w-12 h-12 rounded-full object-cover cursor-pointer ring-2 ring-gray-200 hover:ring-blue-500 transition-all duration-300 shadow-md"
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors">
                                {paper.author?.fullName || `${paper.author?.firstName || ''} ${paper.author?.lastName || ''}`.trim() || 'Unknown User'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatTimeAgo(paper.createdAt)}
                              </p>
                            </div>
                          </button>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        {paper.content?.authors && Array.isArray(paper.content.authors) && (
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">Authors:</span> {paper.content.authors.map(a => a.name || a).join(', ')}
                          </p>
                        )}
                        {paper.content?.doi && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">DOI:</span> {paper.content.doi}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {paper.tags && paper.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {paper.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-200 hover:from-blue-200 hover:to-purple-200 transition-all duration-200 cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                      {paper.tags.length > 3 && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-200">
                          +{paper.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Like, Dislike, Comment, Share Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={(e) => handleLike(paper._id, e)}
                        disabled={processingReactions.has(paper._id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          paper.isLiked 
                            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        } ${processingReactions.has(paper._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <svg className="w-5 h-5" fill={paper.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="font-semibold">{paper.likeCount || 0}</span>
                      </button>

                      <button
                        onClick={(e) => handleDislike(paper._id, e)}
                        disabled={processingReactions.has(paper._id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          paper.isDisliked 
                            ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                            : 'text-gray-600 hover:text-red-600 hover:bg-gray-50'
                        } ${processingReactions.has(paper._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <svg className="w-5 h-5" fill={paper.isDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" style={{ transform: paper.isDisliked ? 'rotate(180deg)' : 'none' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="font-semibold">{paper.dislikeCount || 0}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          const showComments = expandedComments[paper._id] !== undefined;
                          if (!showComments) {
                            loadComments(paper._id, e);
                          } else {
                            setExpandedComments(prev => {
                              const newState = { ...prev };
                              delete newState[paper._id];
                              return newState;
                            });
                          }
                        }}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="font-semibold">{paper.commentCount || 0}</span>
                      </button>

                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-gray-50 transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342c-.2 0-.4-.01-.6-.03m-2.482 0c-.2.02-.4.03-.6.03a3.5 3.5 0 01-3.5-3.5 3.5 3.5 0 013.5-3.5c.2 0 .4.01.6.03m2.482 0c.2-.02.4-.03.6-.03a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m0-7a3.5 3.5 0 00-3.5 3.5m7 0a3.5 3.5 0 01-3.5 3.5m0-7a3.5 3.5 0 00-3.5 3.5m7 0a3.5 3.5 0 01-3.5 3.5m0 0a3.5 3.5 0 01-3.5-3.5m3.5 3.5a3.5 3.5 0 003.5-3.5m0 0a3.5 3.5 0 00-3.5-3.5" />
                        </svg>
                        <span className="font-semibold">{paper.shareCount || 0}</span>
                      </button>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{formatTimeAgo(paper.createdAt)}</span>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[paper._id] && (
                    <div className="pt-4 border-t border-gray-100 mb-4">
                      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                        {expandedComments[paper._id].map(comment => (
                          <div key={comment._id} className="flex space-x-3 animate-fade-in">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${comment.author?._id || comment.author}`);
                              }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${comment.author?._id || comment.author}`);
                                }}
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
                              inputRefs.current[`expanded-${paper._id}`] = el;
                            }
                          }}
                          value={commentInputs[paper._id] || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            const value = e.target.value;
                            setCommentInputs(prev => ({ ...prev, [paper._id]: value }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              e.stopPropagation();
                              const commentText = commentInputs[paper._id] || '';
                              if (commentText.trim()) {
                                handleComment(paper._id, commentText, e);
                              }
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          placeholder="Write a comment..."
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                          autoComplete="off"
                        />
                        <button
                          onClick={(e) => handleComment(paper._id, commentInputs[paper._id], e)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Comment Input (when comments not expanded) */}
                  {!expandedComments[paper._id] && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          ref={(el) => {
                            if (el) {
                              inputRefs.current[`collapsed-${paper._id}`] = el;
                            }
                          }}
                          value={commentInputs[paper._id] || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            const value = e.target.value;
                            setCommentInputs(prev => ({ ...prev, [paper._id]: value }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              e.stopPropagation();
                              const commentText = commentInputs[paper._id] || '';
                              if (commentText.trim()) {
                                handleComment(paper._id, commentText, e);
                              }
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          placeholder="Write a comment..."
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                          autoComplete="off"
                        />
                        <button
                          onClick={(e) => handleComment(paper._id, commentInputs[paper._id], e)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
                    <div className="flex space-x-4">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {paper.citations} citations
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {paper.downloads} downloads
                      </span>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Published
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {sortedPapers.length === 0 && (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No papers found</h3>
              <p className="text-gray-600 mb-6">
                No research papers have been shared yet. Be the first to share a paper!
              </p>
              <button
                onClick={() => navigate('/publish')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Share a Paper
              </button>
            </div>
          )}
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
              <h3 className="text-xl font-bold text-gray-900">Delete Paper</h3>
            </div>
            <p className="text-gray-600 mb-6 ml-16">
              Are you sure you want to delete this paper? This action cannot be undone.
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

export default Papers;
