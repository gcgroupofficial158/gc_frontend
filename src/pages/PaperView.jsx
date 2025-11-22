import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPostById, fetchPostComments } from '../api/postApi';
import socketService from '../services/socketService';

const PaperView = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [paper, setPaper] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(0);

  // Fetch real post data from API
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadPaper = async () => {
      try {
        setLoading(true);
        const response = await fetchPostById(id);
        if (response.success && response.data.post) {
          const post = response.data.post;
          const paperData = {
            _id: post._id,
            title: post.content?.title || 'Untitled Paper',
            abstract: post.content?.abstract || post.content?.text || '',
            authors: post.author ? [{
              name: `${post.author.firstName} ${post.author.lastName}`,
              affiliation: post.author.affiliation || '',
              email: post.author.email || ''
            }] : [],
            category: post.content?.category || 'Other',
            keywords: post.tags || [],
            doi: post.content?.doi || '',
            publishedDate: post.createdAt,
            citations: 0,
            downloads: 0,
            views: 0,
            likes: post.likeCount || post.likes?.length || 0,
            bookmarks: 0,
            author: post.author,
            createdAt: post.createdAt
          };
          setPaper(paperData);
          setIsLiked(post.isLiked || false);
          setLikes(paperData.likes);

          // Fetch comments
          const commentsRes = await fetchPostComments(id);
          if (commentsRes.success && commentsRes.data.comments) {
            setComments(commentsRes.data.comments);
          }
        }
      } catch (error) {
        console.error('Error loading paper:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPaper();
  }, [id, isAuthenticated, navigate]);

  // Real-time comment listeners
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const handleNewComment = (data) => {
      if (data.comment && data.postId === id) {
        setComments(prev => [data.comment, ...prev]);
      }
    };

    socketService.on('comment:new', handleNewComment);

    return () => {
      socketService.off('comment:new', handleNewComment);
    };
  }, [isAuthenticated, id]);

  const handleLike = () => {
    if (isLiked) {
      socketService.unlikePost(id);
    } else {
      socketService.likePost(id);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    socketService.createComment(id, newComment);
    setNewComment('');
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInHours = Math.floor((now - commentTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return commentTime.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading paper...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paper not found</h2>
          <p className="text-gray-600 mb-4">The paper you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/papers')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Browse papers
          </button>
        </div>
      </div>
    );
  }

  const authorName = paper.author ? `${paper.author.firstName} ${paper.author.lastName}` : 'Unknown';
  const authorAvatar = paper.author?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}`;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <main className="w-full py-8">
        <div className="w-[85%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Paper Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-8 mb-8">
                {/* Title and Meta */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{paper.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {paper.category}
                    </span>
                    {paper.doi && <span>DOI: {paper.doi}</span>}
                    <span>Published: {new Date(paper.publishedDate || paper.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Authors */}
                {paper.authors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Author</h3>
                    <div className="space-y-2">
                      {paper.authors.map((author, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <img
                            src={authorAvatar}
                            alt={author.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{author.name}</p>
                            {author.affiliation && <p className="text-sm text-gray-600">{author.affiliation}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Abstract */}
                {paper.abstract && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
                    <p className="text-gray-700 leading-relaxed">{paper.abstract}</p>
                  </div>
                )}

                {/* Keywords */}
                {paper.keywords && paper.keywords.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {paper.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Stats */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Paper Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Likes</span>
                    <span className="font-semibold">{likes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Comments</span>
                    <span className="font-semibold">{comments.length}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleLike}
                    className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition ${
                      isLiked 
                        ? 'bg-red-100 text-red-600 border border-red-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{likes} Likes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Comments ({comments.length})</h3>

            {/* Add Comment */}
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex space-x-4">
                <img
                  src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName + ' ' + user?.lastName)}`}
                  alt="Your avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts on this paper..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length > 0 ? (
                comments.map(comment => {
                  const commentAuthorName = comment.author ? `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim() : 'Unknown';
                  const commentAuthorAvatar = comment.author?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(commentAuthorName)}`;
                  
                  return (
                    <div key={comment._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex space-x-4">
                        <img
                          src={commentAuthorAvatar}
                          alt={commentAuthorName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{commentAuthorName}</h4>
                            <span className="text-sm text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 mb-3">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaperView;
