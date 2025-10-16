import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SocialFeed = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Mock data for demonstration
  useEffect(() => {
    const mockPosts = [
      {
        id: 1,
        type: 'paper',
        author: {
          id: 1,
          name: "Dr. Sarah Johnson",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
          affiliation: "Stanford University"
        },
        content: {
          title: "Machine Learning Applications in Healthcare",
          abstract: "This paper explores the use of machine learning algorithms in diagnosing diseases and predicting patient outcomes...",
          category: "Computer Science",
          doi: "10.1000/182"
        },
        timestamp: "2024-01-15T10:30:00Z",
        likes: 24,
        comments: 8,
        shares: 5,
        isLiked: false,
        isShared: false
      },
      {
        id: 2,
        type: 'post',
        author: {
          id: 2,
          name: "Prof. Michael Chen",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
          affiliation: "MIT"
        },
        content: {
          text: "Excited to announce that our latest research on quantum computing has been accepted for publication in Nature! This breakthrough could revolutionize how we approach complex computational problems. #QuantumComputing #Research"
        },
        timestamp: "2024-01-14T15:45:00Z",
        likes: 45,
        comments: 12,
        shares: 18,
        isLiked: true,
        isShared: false
      },
      {
        id: 3,
        type: 'paper',
        author: {
          id: 3,
          name: "Dr. Emma Wilson",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
          affiliation: "University of Cambridge"
        },
        content: {
          title: "Quantum Computing: A New Era of Computation",
          abstract: "Quantum computing represents a paradigm shift in computational power, offering solutions to problems...",
          category: "Physics",
          doi: "10.1000/183"
        },
        timestamp: "2024-01-13T09:15:00Z",
        likes: 67,
        comments: 15,
        shares: 23,
        isLiked: false,
        isShared: true
      },
      {
        id: 4,
        type: 'post',
        author: {
          id: 4,
          name: "Dr. Alex Rodriguez",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          affiliation: "UC Berkeley"
        },
        content: {
          text: "Looking for collaborators for a new project on sustainable energy solutions. If you're working in renewable energy or materials science, let's connect! #Collaboration #SustainableEnergy #Research"
        },
        timestamp: "2024-01-12T14:20:00Z",
        likes: 18,
        comments: 6,
        shares: 3,
        isLiked: false,
        isShared: false
      },
      {
        id: 5,
        type: 'paper',
        author: {
          id: 5,
          name: "Dr. Lisa Thompson",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
          affiliation: "Harvard University"
        },
        content: {
          title: "The Impact of Social Media on Mental Health",
          abstract: "A comprehensive study examining the correlation between social media usage and mental health outcomes...",
          category: "Psychology",
          doi: "10.1000/184"
        },
        timestamp: "2024-01-11T11:30:00Z",
        likes: 89,
        comments: 22,
        shares: 34,
        isLiked: true,
        isShared: false
      }
    ];

    setTimeout(() => {
      setPosts(mockPosts);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLike = (postId) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const handleShare = (postId) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isShared: !post.isShared, 
            shares: post.isShared ? post.shares - 1 : post.shares + 1 
          }
        : post
    ));
  };

  const handleComment = (postId, comment) => {
    // In a real app, this would make an API call
    console.log(`Comment on post ${postId}: ${comment}`);
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'all') return true;
    if (activeTab === 'papers') return post.type === 'paper';
    if (activeTab === 'posts') return post.type === 'post';
    return true;
  });

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInHours = Math.floor((now - postTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
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

  const PostCard = ({ post }) => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      {/* Author Info */}
      <div className="flex items-center space-x-3 mb-4">
        <img
          src={post.author.avatar}
          alt={post.author.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
          <p className="text-sm text-gray-600">{post.author.affiliation}</p>
          <p className="text-xs text-gray-500">{formatTimeAgo(post.timestamp)}</p>
        </div>
        <div className="flex items-center space-x-2">
          {post.type === 'paper' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Research Paper
            </span>
          )}
          {post.type === 'post' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Post
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        {post.type === 'paper' ? (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{post.content.title}</h4>
            <p className="text-gray-600 mb-3 line-clamp-3">{post.content.abstract}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                {post.content.category}
              </span>
              <span>DOI: {post.content.doi}</span>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-900 whitespace-pre-wrap">{post.content.text}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => handleLike(post.id)}
            className={`flex items-center space-x-2 text-sm font-medium transition ${
              post.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <svg className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{post.likes}</span>
          </button>

          <button className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{post.comments}</span>
          </button>

          <button
            onClick={() => handleShare(post.id)}
            className={`flex items-center space-x-2 text-sm font-medium transition ${
              post.isShared ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <svg className={`w-5 h-5 ${post.isShared ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>{post.shares}</span>
          </button>
        </div>

        <button className="text-sm text-gray-600 hover:text-gray-800 font-medium">
          View Details
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="w-full py-8">
        <div className="w-[85%] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Activity
              </button>
              <button
                onClick={() => setActiveTab('papers')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'papers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Research Papers
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Posts & Updates
              </button>
            </nav>
          </div>
        </div>

        {/* Feed */}
        <div>
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-4">
                Connect with researchers to see their latest papers and updates.
              </p>
              <button
                onClick={() => navigate('/network')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Find researchers to follow
              </button>
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
};

export default SocialFeed;
