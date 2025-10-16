import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

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

  // Mock data for demonstration
  useEffect(() => {
    const mockPaper = {
      id: parseInt(id),
      title: "Machine Learning Applications in Healthcare: A Comprehensive Review",
      abstract: "This paper explores the use of machine learning algorithms in diagnosing diseases and predicting patient outcomes. We present a comprehensive review of current applications, methodologies, and future prospects in healthcare AI. Our analysis covers various machine learning techniques including supervised learning, unsupervised learning, and deep learning approaches used in medical diagnosis, treatment planning, and patient monitoring.",
      authors: [
        { name: "Dr. Sarah Johnson", affiliation: "Stanford University", email: "sarah.johnson@stanford.edu" },
        { name: "Prof. Michael Chen", affiliation: "MIT", email: "m.chen@mit.edu" },
        { name: "Dr. Emma Wilson", affiliation: "University of Cambridge", email: "e.wilson@cambridge.ac.uk" }
      ],
      category: "Computer Science",
      subcategory: "Machine Learning",
      keywords: ["machine learning", "healthcare", "diagnosis", "AI", "medical imaging", "predictive analytics"],
      doi: "10.1000/182",
      publishedDate: "2024-01-15",
      citations: 45,
      downloads: 234,
      views: 567,
      likes: 89,
      bookmarks: 23,
      methodology: "We conducted a systematic review of machine learning applications in healthcare from 2015 to 2024. Our methodology included comprehensive literature search across multiple databases, data extraction, and analysis of trends and patterns in healthcare AI applications.",
      results: "Our analysis revealed significant growth in machine learning applications in healthcare, with particular emphasis on medical imaging, drug discovery, and personalized medicine. The results show improved accuracy in disease diagnosis and treatment planning.",
      conclusion: "Machine learning continues to revolutionize healthcare delivery. Future research should focus on addressing ethical concerns, improving interpretability, and ensuring equitable access to AI-powered healthcare solutions.",
      references: [
        "Smith, J. et al. (2023). Deep Learning in Medical Imaging. Nature Medicine, 29(3), 123-145.",
        "Brown, A. et al. (2023). AI-Driven Drug Discovery. Science, 380(6642), 456-478.",
        "Davis, R. et al. (2022). Personalized Medicine and Machine Learning. Cell, 185(12), 234-256."
      ],
      funding: "This research was supported by the National Science Foundation (Grant No. NSF-2023-001) and the Stanford AI Research Initiative.",
      acknowledgments: "We thank the Stanford Medical Center for providing access to anonymized patient data and the MIT Computer Science Department for computational resources."
    };

    const mockComments = [
      {
        id: 1,
        author: {
          name: "Dr. Alex Rodriguez",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          affiliation: "UC Berkeley"
        },
        text: "Excellent comprehensive review! The methodology section is particularly well-structured. I'm curious about the ethical considerations mentioned - could you elaborate on the bias mitigation strategies?",
        timestamp: "2024-01-16T10:30:00Z",
        likes: 12,
        replies: [
          {
            id: 1,
            author: {
              name: "Dr. Sarah Johnson",
              avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
              affiliation: "Stanford University"
            },
            text: "Great question! We implemented several bias mitigation strategies including diverse training datasets, fairness constraints, and regular auditing of model performance across different demographic groups.",
            timestamp: "2024-01-16T11:15:00Z",
            likes: 8
          }
        ]
      },
      {
        id: 2,
        author: {
          name: "Prof. Lisa Thompson",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
          affiliation: "Harvard University"
        },
        text: "This paper provides valuable insights into the current state of ML in healthcare. The future prospects section is particularly thought-provoking. Looking forward to seeing more research in this area!",
        timestamp: "2024-01-15T16:45:00Z",
        likes: 7,
        replies: []
      },
      {
        id: 3,
        author: {
          name: "Dr. David Kim",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
          affiliation: "Stanford University"
        },
        text: "The section on medical imaging applications is outstanding. Have you considered the computational requirements for real-time diagnosis in clinical settings?",
        timestamp: "2024-01-15T14:20:00Z",
        likes: 5,
        replies: []
      }
    ];

    setTimeout(() => {
      setPaper(mockPaper);
      setComments(mockComments);
      setLikes(mockPaper.likes);
      setLoading(false);
    }, 1000);
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: comments.length + 1,
      author: {
        name: user?.name || 'Anonymous',
        avatar: user?.picture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        affiliation: user?.affiliation || 'Unknown'
      },
      text: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
      replies: []
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: paper.title,
        text: paper.abstract,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatTimeAgo = (timestamp) => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading paper...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
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
                  <span>DOI: {paper.doi}</span>
                  <span>Published: {new Date(paper.publishedDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Authors */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Authors</h3>
                <div className="space-y-2">
                  {paper.authors.map((author, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {author.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{author.name}</p>
                        <p className="text-sm text-gray-600">{author.affiliation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Abstract */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
                <p className="text-gray-700 leading-relaxed">{paper.abstract}</p>
              </div>

              {/* Keywords */}
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

              {/* Methodology */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Methodology</h3>
                <p className="text-gray-700 leading-relaxed">{paper.methodology}</p>
              </div>

              {/* Results */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Results</h3>
                <p className="text-gray-700 leading-relaxed">{paper.results}</p>
              </div>

              {/* Conclusion */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Conclusion</h3>
                <p className="text-gray-700 leading-relaxed">{paper.conclusion}</p>
              </div>

              {/* References */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">References</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {paper.references.map((ref, index) => (
                    <li key={index} className="text-gray-700">{ref}</li>
                  ))}
                </ol>
              </div>

              {/* Funding & Acknowledgments */}
              <div className="border-t border-gray-200 pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Funding</h3>
                  <p className="text-gray-700">{paper.funding}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Acknowledgments</h3>
                  <p className="text-gray-700">{paper.acknowledgments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Stats */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Paper Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Views</span>
                  <span className="font-semibold">{paper.views}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Downloads</span>
                  <span className="font-semibold">{paper.downloads}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Citations</span>
                  <span className="font-semibold">{paper.citations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bookmarks</span>
                  <span className="font-semibold">{paper.bookmarks}</span>
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

                <button className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download PDF</span>
                </button>

                <button className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>Cite</span>
                </button>
              </div>
            </div>

            {/* Related Papers */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Papers</h3>
              <div className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">AI in Medical Diagnosis</h4>
                  <p className="text-xs text-gray-600">Dr. John Smith • 2023</p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">Deep Learning for Healthcare</h4>
                  <p className="text-xs text-gray-600">Prof. Jane Doe • 2023</p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">Machine Learning Ethics</h4>
                  <p className="text-xs text-gray-600">Dr. Bob Wilson • 2022</p>
                </div>
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
                src={user?.picture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
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
            {comments.map(comment => (
              <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex space-x-4">
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{comment.author.name}</h4>
                      <span className="text-sm text-gray-600">{comment.author.affiliation}</span>
                      <span className="text-sm text-gray-500">{formatTimeAgo(comment.timestamp)}</span>
                    </div>
                    <p className="text-gray-700 mb-3">{comment.text}</p>
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{comment.likes}</span>
                      </button>
                      <button className="text-sm text-gray-600 hover:text-blue-600 transition">
                        Reply
                      </button>
                    </div>

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="mt-4 ml-6 space-y-4">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="flex space-x-3">
                            <img
                              src={reply.author.avatar}
                              alt={reply.author.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className="font-medium text-gray-900 text-sm">{reply.author.name}</h5>
                                <span className="text-xs text-gray-600">{reply.author.affiliation}</span>
                                <span className="text-xs text-gray-500">{formatTimeAgo(reply.timestamp)}</span>
                              </div>
                              <p className="text-gray-700 text-sm">{reply.text}</p>
                              <div className="flex items-center space-x-3 mt-2">
                                <button className="flex items-center space-x-1 text-xs text-gray-600 hover:text-red-600 transition">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  <span>{reply.likes}</span>
                                </button>
                                <button className="text-xs text-gray-600 hover:text-blue-600 transition">
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default PaperView;
