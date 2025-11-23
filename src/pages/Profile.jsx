import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchUserById } from '../api/userApi';
import { fetchPosts, fetchPostComments, updatePost, deletePost } from '../api/postApi';
import { updateUserProfile, getUserProfile } from '../api/authApi';
import socketService from '../services/socketService';

const Profile = () => {
  const { user, isAuthenticated, updateUser, tokens } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // Get user ID from URL
  const isViewingOtherProfile = !!id && id !== user?._id && id !== user?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewingUser, setViewingUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userPapers, setUserPapers] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'papers'
  const [activeSection, setActiveSection] = useState('personal'); // 'personal', 'posts', 'papers'
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [processingReactions, setProcessingReactions] = useState(new Set()); // Track posts being processed
  const [editingPost, setEditingPost] = useState(null); // Track which post is being edited
  const [editFormData, setEditFormData] = useState({}); // Store edit form data
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // Track post to delete
  const [isEditingProfile, setIsEditingProfile] = useState(false); // Track if profile is being edited
  const inputRefs = useRef({}); // Refs to maintain focus on comment inputs

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    affiliation: '',
    specialization: '',
    bio: '',
    website: '',
    orcid: '',
    googleScholar: '',
    researchInterests: '',
    education: '',
    experience: '',
    avatar: user?.picture || user?.profilePicture || ''
  });

  // Fetch user profile if viewing another user's profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      if (isViewingOtherProfile) {
        setLoading(true);
        try {
          const response = await fetchUserById(id, tokens?.accessToken);
          if (response && response.success) {
            const userData = response.data?.user;
            setViewingUser(userData);
            setProfileData({
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              phone: '',
              affiliation: '',
              specialization: '',
              bio: '',
              website: '',
              orcid: '',
              googleScholar: '',
              researchInterests: '',
              education: '',
              experience: '',
              avatar: userData.profilePicture || ''
            });
            
            // Fetch user's posts and papers
            await loadUserPosts(id);
            await loadUserPapers(id);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setError('Failed to load user profile');
        } finally {
          setLoading(false);
        }
      } else {
        // Own profile - use current user data
        setLoading(false);
        // Load own posts and papers - ensure user is available
        const userId = user?._id || user?.id;
        if (userId) {
          loadUserPosts(userId);
          loadUserPapers(userId);
        }
      }
    };

    loadProfile();
  }, [id, isAuthenticated, isViewingOtherProfile, tokens?.accessToken, navigate, user]);

  // REMOVED: Duplicate useEffect - was causing double API calls
  // The main useEffect above already handles loading own profile
  // This was causing duplicate requests for posts/papers

  // Load user posts (type='post')
  const loadUserPosts = async (userId) => {
    if (!userId) return;
    
    try {
      setPostsLoading(true);
      const token = tokens?.accessToken || localStorage.getItem('accessToken');
      const response = await fetchPosts({ author: userId, type: 'post', limit: 50 }, token);
      if (response && response.success) {
        const posts = response.data?.posts || [];
        // Mark if current user liked each post
        const postsWithReactions = posts.map(post => ({
          ...post,
          isLiked: post.likes?.some(like => 
            String(like.user?._id || like.user) === String(user?._id || user?.id)
          ) || false,
          isDisliked: post.dislikes?.some(dislike => 
            String(dislike.user?._id || dislike.user) === String(user?._id || user?.id)
          ) || false
        }));
        setUserPosts(postsWithReactions);
      } else {
        console.error('Failed to load posts:', response);
        setUserPosts([]);
      }
    } catch (error) {
      console.error('Error loading user posts:', error);
      setUserPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Load user papers (type='paper_share')
  const loadUserPapers = async (userId) => {
    if (!userId) return;
    
    try {
      setPostsLoading(true);
      const token = tokens?.accessToken || localStorage.getItem('accessToken');
      const response = await fetchPosts({ author: userId, type: 'paper_share', limit: 50 }, token);
      if (response && response.success) {
        const papers = response.data?.posts || [];
        // Mark if current user liked each paper
        const papersWithReactions = papers.map(paper => ({
          ...paper,
          isLiked: paper.likes?.some(like => 
            String(like.user?._id || like.user) === String(user?._id || user?.id)
          ) || false,
          isDisliked: paper.dislikes?.some(dislike => 
            String(dislike.user?._id || dislike.user) === String(user?._id || user?.id)
          ) || false
        }));
        setUserPapers(papersWithReactions);
      } else {
        console.error('Failed to load papers:', response);
        setUserPapers([]);
      }
    } catch (error) {
      console.error('Error loading user papers:', error);
      setUserPapers([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Load own profile data from API
  const loadOwnProfile = async () => {
    try {
      const response = await getUserProfile();
      if (response && response.success && response.user) {
        const userData = response.user;
        setProfileData({
          firstName: userData.firstName || user?.firstName || '',
          lastName: userData.lastName || user?.lastName || '',
          email: userData.email || user?.email || '',
          phone: userData.phone || '',
          affiliation: userData.affiliation || '',
          specialization: userData.specialization || '',
          bio: userData.bio || '',
          website: userData.website || '',
          orcid: userData.orcid || '',
          googleScholar: userData.googleScholar || '',
          researchInterests: userData.researchInterests || '',
          education: userData.education || '',
          experience: userData.experience || '',
          avatar: userData.profilePicture || userData.picture || user?.profilePicture || user?.picture || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to user context data
      setProfileData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        affiliation: user?.affiliation || '',
        specialization: user?.specialization || '',
        bio: user?.bio || '',
        website: user?.website || '',
        orcid: user?.orcid || '',
        googleScholar: user?.googleScholar || '',
        researchInterests: user?.researchInterests || '',
        education: user?.education || '',
        experience: user?.experience || '',
        avatar: user?.picture || user?.profilePicture || ''
      });
    }
  };

  // Real-time Socket.io listeners for posts
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewPost = (data) => {
      if (data.post) {
        const postAuthorId = String(data.post.author?._id || data.post.author);
        const targetUserId = isViewingOtherProfile ? String(id) : String(user?._id || user?.id);
        if (postAuthorId === targetUserId) {
          if (data.post.type === 'paper_share') {
            setUserPapers(prev => [data.post, ...prev]);
          } else {
            setUserPosts(prev => [data.post, ...prev]);
          }
        }
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
        
        // Update in posts
        setUserPosts(prev => prev.map(post => {
          if (post._id === data.postId) {
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
                likeCount: data.likeCount !== undefined ? data.likeCount : (post.likeCount || 0) + 1,
                dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : post.dislikeCount,
                isLiked: post.isLiked,
                isDisliked: post.isDisliked
              };
            }
          }
          return post;
        }));
        // Update in papers
        setUserPapers(prev => prev.map(paper => {
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
        
        // Update in posts
        setUserPosts(prev => prev.map(post => {
          if (post._id === data.postId) {
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
                likeCount: data.likeCount !== undefined ? data.likeCount : Math.max(0, (post.likeCount || 0) - 1),
                dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : post.dislikeCount,
                isLiked: post.isLiked,
                isDisliked: post.isDisliked
              };
            }
          }
          return post;
        }));
        // Update in papers
        setUserPapers(prev => prev.map(paper => {
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
        
        // Update in posts
        setUserPosts(prev => prev.map(post => {
          if (post._id === data.postId) {
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
                dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : (post.dislikeCount || 0) + 1,
                isLiked: post.isLiked,
                isDisliked: post.isDisliked
              };
            }
          }
          return post;
        }));
        // Update in papers
        setUserPapers(prev => prev.map(paper => {
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
        
        // Update in posts
        setUserPosts(prev => prev.map(post => {
          if (post._id === data.postId) {
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
                dislikeCount: data.dislikeCount !== undefined ? data.dislikeCount : Math.max(0, (post.dislikeCount || 0) - 1),
                isLiked: post.isLiked,
                isDisliked: post.isDisliked
              };
            }
          }
          return post;
        }));
        // Update in papers
        setUserPapers(prev => prev.map(paper => {
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
        
        // Update in posts
        setUserPosts(prev => prev.map(post => {
          if (post._id === data.postId) {
            return {
              ...post,
              commentCount: (post.commentCount || 0) + 1
            };
          }
          return post;
        }));
        // Update in papers
        setUserPapers(prev => prev.map(paper => {
          if (paper._id === data.postId) {
            return {
              ...paper,
              commentCount: (paper.commentCount || 0) + 1
            };
          }
          return paper;
        }));
        
        // Restore focus after update (only if not the post that received the comment)
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
  }, [isAuthenticated, isViewingOtherProfile, id, user]);

  const handleLike = (postId) => {
    // Prevent multiple rapid clicks
    if (processingReactions.has(postId)) {
      return;
    }

    // Mark as processing
    setProcessingReactions(prev => new Set(prev).add(postId));

    // Get current state before update
    const currentPost = userPosts.find(p => p._id === postId) || userPapers.find(p => p._id === postId);
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
    const updatePostInState = (prevPosts) => prevPosts.map(post => {
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
    });

    setUserPosts(updatePostInState);
    setUserPapers(updatePostInState);

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
    const currentPost = userPosts.find(p => p._id === postId) || userPapers.find(p => p._id === postId);
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
    const updatePostInState = (prevPosts) => prevPosts.map(post => {
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
    });

    setUserPosts(updatePostInState);
    setUserPapers(updatePostInState);

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

  const handleComment = useCallback(async (postId, commentText) => {
    if (!commentText.trim()) return;
    socketService.createComment(postId, commentText);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  }, []);

  const loadComments = async (postId) => {
    try {
      const response = await fetchPostComments(postId);
      if (response && response.success) {
        const comments = response.data?.comments || [];
        setExpandedComments(prev => ({ ...prev, [postId]: comments }));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post._id);
    if (post.type === 'paper_share') {
      setEditFormData({
        title: post.content?.title || '',
        abstract: post.content?.abstract || '',
        tags: post.tags?.join(', ') || '',
        visibility: post.visibility || 'public'
      });
    } else {
      setEditFormData({
        text: post.content?.text || '',
        tags: post.tags?.join(', ') || '',
        visibility: post.visibility || 'public'
      });
    }
  };

  const handleSaveEdit = async (postId) => {
    try {
      const tags = editFormData.tags
        ? editFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      const post = userPosts.find(p => p._id === postId) || userPapers.find(p => p._id === postId);
      let updateData;

      if (post?.type === 'paper_share') {
        updateData = {
          content: {
            title: editFormData.title,
            abstract: editFormData.abstract
          },
          tags: tags,
          visibility: editFormData.visibility
        };
      } else {
        updateData = {
          content: {
            text: editFormData.text
          },
          tags: tags,
          visibility: editFormData.visibility
        };
      }

      const response = await updatePost(postId, updateData);

      if (response && response.success) {
        if (post?.type === 'paper_share') {
          setUserPapers(prev => prev.map(p => {
            if (p._id === postId) {
              return {
                ...p,
                content: { ...p.content, title: editFormData.title, abstract: editFormData.abstract },
                tags: tags,
                visibility: editFormData.visibility,
                updatedAt: new Date().toISOString() // Mark as edited
              };
            }
            return p;
          }));
        } else {
          setUserPosts(prev => prev.map(p => {
            if (p._id === postId) {
              return {
                ...p,
                content: { ...p.content, text: editFormData.text },
                tags: tags,
                visibility: editFormData.visibility,
                updatedAt: new Date().toISOString() // Mark as edited
              };
            }
            return p;
          }));
        }
        setEditingPost(null);
        setEditFormData({});
      } else {
        alert(response?.message || 'Failed to update post. Please try again.');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert(error.message || 'Failed to update post. Please try again.');
    }
  };

  const handleDelete = async (postId) => {
    try {
      const response = await deletePost(postId);
      if (response && response.success) {
        setUserPosts(prev => prev.filter(p => p._id !== postId));
        setUserPapers(prev => prev.filter(p => p._id !== postId));
        setShowDeleteConfirm(null);
      } else {
        const errorMessage = response?.message || response?.error || 'Failed to delete post. Please try again.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error.message || 'Failed to delete post. Please try again.');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Don't allow editing other users' profiles
    if (isViewingOtherProfile) {
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Update profile via API
      const response = await updateUserProfile(profileData);
      
      if (response && response.success) {
        // Update user context
        const updatedUser = {
          ...user,
          ...profileData,
          ...response.user,
          name: `${profileData.firstName} ${profileData.lastName}`
        };
        updateUser(updatedUser);
        
        setSuccess('Profile updated successfully!');
        setIsEditingProfile(false); // Switch back to view mode
        
        // Reload profile data to get latest from server
        setTimeout(() => {
          loadOwnProfile();
        }, 500);
      } else {
        throw new Error(response?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const displayUser = isViewingOtherProfile ? viewingUser : user;
  const displayName = isViewingOtherProfile 
    ? `${profileData.firstName} ${profileData.lastName}`
    : `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 pt-20">
      {/* Main Content */}
      <main className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            {/* Profile Summary Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6 mb-4 animate-fade-in">
              <div className="text-center">
                <div className="w-28 h-28 mx-auto mb-4 relative">
                  {profileData.avatar ? (
                    <div className="relative">
                      <img
                        src={profileData.avatar}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover ring-4 ring-white shadow-xl"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-3 border-white rounded-full"></div>
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-xl ring-4 ring-white">
                      <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {displayName || 'User'}
                </h2>
                <p className="text-gray-600 font-medium mb-1">{profileData.affiliation || displayUser?.affiliation || ''}</p>
                <p className="text-sm text-blue-600 font-semibold">{profileData.specialization || displayUser?.specialization || ''}</p>
              </div>
            </div>

            {/* Navigation Sidebar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 animate-fade-in">
              <nav className="p-3">
                <button
                  onClick={() => setActiveSection('personal')}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 mb-2 ${
                    activeSection === 'personal'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-md'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Personal Details</span>
                </button>
                <button
                  onClick={() => setActiveSection('posts')}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 mb-2 ${
                    activeSection === 'posts'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-md'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <span>Posts ({userPosts.length})</span>
                </button>
                <button
                  onClick={() => setActiveSection('papers')}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    activeSection === 'papers'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-md'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Papers ({userPapers.length})</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 animate-fade-in">
              {/* Personal Details Section */}
              {activeSection === 'personal' && (
                <>
                  <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                        <span className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </span>
                        {isViewingOtherProfile ? 'Profile Information' : 'Personal Information'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-2 ml-13">
                        {isViewingOtherProfile ? 'View user profile' : isEditingProfile ? 'Edit your profile information' : 'View your profile information'}
                      </p>
                    </div>
                    {!isViewingOtherProfile && !isEditingProfile && (
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </div>
                  {isViewingOtherProfile ? (
                    <div className="p-6">
                      <div className="space-y-6">
                        {/* Basic Information */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-4">Basic Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start space-x-3">
                              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500">Name</p>
                                <p className="text-sm font-medium text-gray-900">{profileData.firstName} {profileData.lastName}</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-sm font-medium text-gray-900">{profileData.email}</p>
                              </div>
                            </div>
                            {profileData.phone && (
                              <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <div>
                                  <p className="text-xs text-gray-500">Phone</p>
                                  <p className="text-sm font-medium text-gray-900">{profileData.phone}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Professional Information */}
                        {(profileData.affiliation || profileData.specialization) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">Professional Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {profileData.affiliation && (
                                <div className="flex items-start space-x-3">
                                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <div>
                                    <p className="text-xs text-gray-500">Affiliation</p>
                                    <p className="text-sm font-medium text-gray-900">{profileData.affiliation}</p>
                                  </div>
                                </div>
                              )}
                              {profileData.specialization && (
                                <div className="flex items-start space-x-3">
                                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  <div>
                                    <p className="text-xs text-gray-500">Specialization</p>
                                    <p className="text-sm font-medium text-gray-900">{profileData.specialization}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Bio */}
                        {profileData.bio && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Bio</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{profileData.bio}</p>
                          </div>
                        )}

                        {/* Online Presence */}
                        {(profileData.website || profileData.orcid || profileData.googleScholar) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">Online Presence</h4>
                            <div className="space-y-3">
                              {profileData.website && (
                                <div className="flex items-center space-x-3">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                  </svg>
                                  <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                                    {profileData.website}
                                  </a>
                                </div>
                              )}
                              {profileData.orcid && (
                                <div className="flex items-center space-x-3">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                  </svg>
                                  <span className="text-sm text-gray-900">{profileData.orcid}</span>
                                </div>
                              )}
                              {profileData.googleScholar && (
                                <div className="flex items-center space-x-3">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                  <a href={profileData.googleScholar} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                                    Google Scholar Profile
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Education & Experience */}
                        {(profileData.education || profileData.experience) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profileData.education && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Education</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{profileData.education}</p>
                              </div>
                            )}
                            {profileData.experience && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Experience</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{profileData.experience}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Research Interests */}
                        {profileData.researchInterests && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Research Interests</h4>
                            <p className="text-sm text-gray-700">{profileData.researchInterests}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : isEditingProfile ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={profileData.firstName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={profileData.lastName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={profileData.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Professional Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Affiliation
                          </label>
                          <input
                            type="text"
                            name="affiliation"
                            value={profileData.affiliation}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="University, Institute, Company"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Specialization
                          </label>
                          <input
                            type="text"
                            name="specialization"
                            value={profileData.specialization}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Research field or expertise"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          value={profileData.bio}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tell us about yourself and your research interests"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Research Interests
                        </label>
                        <input
                          type="text"
                          name="researchInterests"
                          value={profileData.researchInterests}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Separate interests with commas"
                        />
                      </div>

                      {/* Online Presence */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Website
                          </label>
                          <input
                            type="url"
                            name="website"
                            value={profileData.website}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ORCID ID
                          </label>
                          <input
                            type="text"
                            name="orcid"
                            value={profileData.orcid}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0000-0000-0000-0000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Google Scholar
                          </label>
                          <input
                            type="text"
                            name="googleScholar"
                            value={profileData.googleScholar}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Scholar profile URL"
                          />
                        </div>
                      </div>

                      {/* Education and Experience */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Education
                        </label>
                        <textarea
                          name="education"
                          value={profileData.education}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="List your educational background"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Experience
                        </label>
                        <textarea
                          name="experience"
                          value={profileData.experience}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Describe your professional experience"
                        />
                      </div>

                      {/* Messages */}
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-600 text-sm">{error}</p>
                        </div>
                      )}

                      {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-600 text-sm">{success}</p>
                        </div>
                      )}

                      {/* Submit Button */}
                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setError('');
                            setSuccess('');
                            // Reload original data
                            loadOwnProfile();
                          }}
                          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </div>
                          ) : (
                            'Update Profile'
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-6">
                      <div className="space-y-6">
                        {/* Basic Information */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-4">Basic Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start space-x-3">
                              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500">Name</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {profileData.firstName || profileData.lastName 
                                    ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() 
                                    : 'Not set'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-sm font-medium text-gray-900">{profileData.email || 'Not set'}</p>
                              </div>
                            </div>
                            {profileData.phone && (
                              <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <div>
                                  <p className="text-xs text-gray-500">Phone</p>
                                  <p className="text-sm font-medium text-gray-900">{profileData.phone}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Professional Information */}
                        {(profileData.affiliation || profileData.specialization) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">Professional Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {profileData.affiliation && (
                                <div className="flex items-start space-x-3">
                                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <div>
                                    <p className="text-xs text-gray-500">Affiliation</p>
                                    <p className="text-sm font-medium text-gray-900">{profileData.affiliation}</p>
                                  </div>
                                </div>
                              )}
                              {profileData.specialization && (
                                <div className="flex items-start space-x-3">
                                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  <div>
                                    <p className="text-xs text-gray-500">Specialization</p>
                                    <p className="text-sm font-medium text-gray-900">{profileData.specialization}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Bio */}
                        {profileData.bio && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Bio</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{profileData.bio}</p>
                          </div>
                        )}

                        {/* Research Interests */}
                        {profileData.researchInterests && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Research Interests</h4>
                            <p className="text-sm text-gray-700">{profileData.researchInterests}</p>
                          </div>
                        )}

                        {/* Online Presence */}
                        {(profileData.website || profileData.orcid || profileData.googleScholar) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">Online Presence</h4>
                            <div className="space-y-3">
                              {profileData.website && (
                                <div className="flex items-center space-x-3">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                  </svg>
                                  <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                                    {profileData.website}
                                  </a>
                                </div>
                              )}
                              {profileData.orcid && (
                                <div className="flex items-center space-x-3">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                  </svg>
                                  <span className="text-sm text-gray-900">{profileData.orcid}</span>
                                </div>
                              )}
                              {profileData.googleScholar && (
                                <div className="flex items-center space-x-3">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                  <a href={profileData.googleScholar} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                                    Google Scholar Profile
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Education & Experience */}
                        {(profileData.education || profileData.experience) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profileData.education && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Education</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{profileData.education}</p>
                              </div>
                            )}
                            {profileData.experience && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Experience</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{profileData.experience}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Empty State */}
                        {!profileData.firstName && !profileData.lastName && !profileData.email && !profileData.phone && 
                         !profileData.affiliation && !profileData.specialization && !profileData.bio && 
                         !profileData.website && !profileData.orcid && !profileData.googleScholar && 
                         !profileData.education && !profileData.experience && !profileData.researchInterests && (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No profile information yet</h3>
                            <p className="text-gray-600 mb-4">Click "Edit Profile" to add your personal details.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Posts Section */}
              {activeSection === 'posts' && (
                <>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Posts</h3>
                    <p className="text-sm text-gray-600">View and manage your posts</p>
                  </div>
                  <div className="p-6">
                    {postsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-600">Loading posts...</p>
                      </div>
                    ) : userPosts.length > 0 ? (
                      <div className="space-y-6">
                        {userPosts.map(post => {
                        const authorName = post.author?.fullName || `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || 'Unknown User';
                        const authorAvatar = post.author?.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authorName);
                        const showComments = expandedComments[post._id] !== undefined;
                        const isOwnPost = String(post.author?._id || post.author) === String(user?._id || user?.id);
                        
                        return (
                          <div key={post._id} className="bg-gray-50 rounded-lg shadow p-6">
                            {/* Post Header */}
                            <div className="flex items-center space-x-3 mb-4">
                              <img
                                src={authorAvatar}
                                alt={authorName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{authorName}</h4>
                                <p className="text-xs text-gray-500">
                                  {formatTimeAgo(post.createdAt)}
                                  {post.updatedAt && new Date(post.updatedAt) > new Date(post.createdAt) && (
                                    <span className="ml-2 text-gray-400">• Edited</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {post.type === 'paper_share' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Research Paper
                                  </span>
                                )}
                                {/* Edit/Delete buttons - only for own posts */}
                                {isOwnPost && (
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

                              {/* Post/Paper Content */}
                              <div className="mb-4">
                                {post.type === 'paper_share' ? (
                                  <div>
                                    {post.content?.title && (
                                      <h5 className="text-lg font-semibold text-gray-900 mb-2">{post.content.title}</h5>
                                    )}
                                    {post.content?.abstract && (
                                      <p className="text-gray-600 mb-3">{post.content.abstract}</p>
                                    )}
                                    {post.content?.category && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                        {post.content.category}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-gray-900 whitespace-pre-wrap">{post.content?.text || post.content || ''}</p>
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
                              </div>

                              {/* Post Actions */}
                              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div className="flex items-center space-x-6">
                                  <button
                                    onClick={() => handleLike(post._id)}
                                    disabled={processingReactions.has(post._id)}
                                    className={`flex items-center space-x-2 text-sm font-medium transition ${
                                      post.isLiked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                                    } ${processingReactions.has(post._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <svg className="w-5 h-5" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span>{post.likeCount || post.likes?.length || 0}</span>
                                  </button>

                                  <button
                                    onClick={() => handleDislike(post._id)}
                                    disabled={processingReactions.has(post._id)}
                                    className={`flex items-center space-x-2 text-sm font-medium transition ${
                                      post.isDisliked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                                    } ${processingReactions.has(post._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <svg className="w-5 h-5" fill={post.isDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" style={{ transform: post.isDisliked ? 'rotate(180deg)' : 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span>{post.dislikeCount || post.dislikes?.length || 0}</span>
                                  </button>

                                  <button
                                    onClick={() => {
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
                                    className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>{post.commentCount || post.comments?.length || 0}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Comments Section */}
                              {showComments && expandedComments[post._id] && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="space-y-3 mb-4">
                                    {expandedComments[post._id].map(comment => (
                                      <div key={comment._id} className="flex space-x-3">
                                        <img
                                          src={comment.author?.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(comment.author?.firstName || 'User')}
                                          alt={comment.author?.firstName || 'User'}
                                          className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <div className="flex-1 bg-white rounded-lg p-3">
                                          <p className="text-sm font-semibold text-gray-900">
                                            {comment.author?.firstName} {comment.author?.lastName}
                                          </p>
                                          <p className="text-sm text-gray-700">{comment.content}</p>
                                          <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(comment.createdAt)}</p>
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
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      autoComplete="off"
                                    />
                                    <button
                                      onClick={() => handleComment(post._id, commentInputs[post._id])}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                      Comment
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Comment Input (when comments not expanded) */}
                              {!showComments && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex space-x-2">
                                    <input
                                      type="text"
                                      ref={(el) => {
                                        if (el) {
                                          inputRefs.current[`collapsed-${post._id}`] = el;
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
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      autoComplete="off"
                                    />
                                    <button
                                      onClick={() => handleComment(post._id, commentInputs[post._id])}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                      Comment
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                        <p className="text-gray-600">This user hasn't shared any posts yet.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Papers Section */}
              {activeSection === 'papers' && (
                <>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Research Papers</h3>
                    <p className="text-sm text-gray-600">View and manage your published papers</p>
                  </div>
                  <div className="p-6">
                    <div className="mb-6">
                      {postsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Loading papers...</p>
                        </div>
                      ) : userPapers.length > 0 ? (
                        <div className="space-y-6">
                          {userPapers.map(post => {
                            const authorName = post.author?.fullName || `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || 'Unknown User';
                            const authorAvatar = post.author?.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authorName);
                            const showComments = expandedComments[post._id] !== undefined;
                            const isOwnPost = String(post.author?._id || post.author) === String(user?._id || user?.id);
                            
                            return (
                              <div key={post._id} className="bg-gray-50 rounded-lg shadow p-6">
                                {/* Post Header */}
                                <div className="flex items-center space-x-3 mb-4">
                                  <img
                                    src={authorAvatar}
                                    alt={authorName}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{authorName}</h4>
                                    <p className="text-xs text-gray-500">
                                      {formatTimeAgo(post.createdAt)}
                                      {post.updatedAt && new Date(post.updatedAt) > new Date(post.createdAt) && (
                                        <span className="ml-2 text-gray-400">• Edited</span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {post.type === 'paper_share' && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Research Paper
                                      </span>
                                    )}
                                    {/* Edit/Delete buttons - only for own posts */}
                                    {isOwnPost && (
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

                                {/* Post/Paper Content */}
                                <div className="mb-4">
                                  {post.type === 'paper_share' ? (
                                    <div>
                                      {post.content?.title && (
                                        <h5 className="text-lg font-semibold text-gray-900 mb-2">{post.content.title}</h5>
                                      )}
                                      {post.content?.abstract && (
                                        <p className="text-gray-600 mb-3">{post.content.abstract}</p>
                                      )}
                                      {post.content?.category && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                          {post.content.category}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-gray-900 whitespace-pre-wrap">{post.content?.text || post.content || ''}</p>
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
                                </div>

                                {/* Post Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                  <div className="flex items-center space-x-6">
                                    <button
                                      onClick={() => handleLike(post._id)}
                                      disabled={processingReactions.has(post._id)}
                                      className={`flex items-center space-x-2 text-sm font-medium transition ${
                                        post.isLiked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                                      } ${processingReactions.has(post._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      <svg className="w-5 h-5" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                      </svg>
                                      <span>{post.likeCount || post.likes?.length || 0}</span>
                                    </button>

                                    <button
                                      onClick={() => handleDislike(post._id)}
                                      disabled={processingReactions.has(post._id)}
                                      className={`flex items-center space-x-2 text-sm font-medium transition ${
                                        post.isDisliked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                                      } ${processingReactions.has(post._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      <svg className="w-5 h-5" fill={post.isDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" style={{ transform: post.isDisliked ? 'rotate(180deg)' : 'none' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                      </svg>
                                      <span>{post.dislikeCount || post.dislikes?.length || 0}</span>
                                    </button>

                                    <button
                                      onClick={() => {
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
                                      className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                      </svg>
                                      <span>{post.commentCount || post.comments?.length || 0}</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Comments Section */}
                                {showComments && expandedComments[post._id] && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="space-y-3 mb-4">
                                      {expandedComments[post._id].map(comment => (
                                        <div key={comment._id} className="flex space-x-3">
                                          <img
                                            src={comment.author?.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(comment.author?.firstName || 'User')}
                                            alt={comment.author?.firstName || 'User'}
                                            className="w-8 h-8 rounded-full object-cover"
                                          />
                                          <div className="flex-1 bg-white rounded-lg p-3">
                                            <p className="text-sm font-semibold text-gray-900">
                                              {comment.author?.firstName} {comment.author?.lastName}
                                            </p>
                                            <p className="text-sm text-gray-700">{comment.content}</p>
                                            <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(comment.createdAt)}</p>
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
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        autoComplete="off"
                                      />
                                      <button
                                        onClick={() => handleComment(post._id, commentInputs[post._id])}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                      >
                                        Comment
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Comment Input (when comments not expanded) */}
                                {!showComments && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex space-x-2">
                                      <input
                                        type="text"
                                        ref={(el) => {
                                          if (el) {
                                            inputRefs.current[`collapsed-${post._id}`] = el;
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
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        autoComplete="off"
                                      />
                                      <button
                                        onClick={() => handleComment(post._id, commentInputs[post._id])}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                      >
                                        Comment
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No papers yet</h3>
                          <p className="text-gray-600">This user hasn't published any papers yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Post</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingPost && (() => {
        const post = userPosts.find(p => p._id === editingPost) || userPapers.find(p => p._id === editingPost);
        if (!post) return null;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit {post.type === 'paper_share' ? 'Paper' : 'Post'}</h3>
              <div className="space-y-4">
                {post.type === 'paper_share' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={editFormData.title || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Abstract</label>
                      <textarea
                        value={editFormData.abstract || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, abstract: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <textarea
                      value={editFormData.text || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, text: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editFormData.tags || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <select
                    value={editFormData.visibility || 'public'}
                    onChange={(e) => setEditFormData({ ...editFormData, visibility: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="friends">Friends Only</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setEditFormData({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveEdit(editingPost)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Profile;
