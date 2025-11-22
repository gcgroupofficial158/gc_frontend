import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';

const CreatePost = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [postData, setPostData] = useState({
    text: '',
    type: 'post',
    tags: '',
    visibility: 'public',
    attachment: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPostData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setPostData(prev => ({
      ...prev,
      attachment: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Parse tags
      const tags = postData.tags
        ? postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      // Prepare post data
      const postContent = {
        type: postData.type,
        content: {
          text: postData.text
        },
        tags: tags,
        visibility: postData.visibility
      };

      // Create post via Socket.io (real-time)
      socketService.createPost(postContent);

      // Listen for post creation confirmation
      const handlePostCreated = (data) => {
        if (data.success) {
          setSuccess(true);
          setTimeout(() => {
            navigate('/feed');
          }, 1500);
        }
      };

      const handlePostError = (data) => {
        setError(data.error || 'Failed to create post. Please try again.');
        setLoading(false);
      };

      socketService.on('post:created', handlePostCreated);
      socketService.on('post:error', handlePostError);

      // Cleanup listeners after 5 seconds
      setTimeout(() => {
        socketService.off('post:created', handlePostCreated);
        socketService.off('post:error', handlePostError);
      }, 5000);

    } catch (err) {
      setError('Failed to create post. Please try again.');
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Post Created!</h2>
          <p className="text-gray-600 mb-4">
            Your post has been shared in real-time with the community.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full py-8">
        <div className="w-[85%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Create a Post</h2>
            <p className="text-sm text-gray-600">Share your thoughts, research updates, or collaboration requests</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Post Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    name="type"
                    value="post"
                    checked={postData.type === 'post'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`p-4 border rounded-lg cursor-pointer transition ${
                    postData.type === 'post' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span className="font-medium">General Post</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Share thoughts, updates, or announcements</p>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="type"
                    value="paper_share"
                    checked={postData.type === 'paper_share'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`p-4 border rounded-lg cursor-pointer transition ${
                    postData.type === 'paper_share' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium">Paper Share</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Share or discuss a research paper</p>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="type"
                    value="collaboration_request"
                    checked={postData.type === 'collaboration_request'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`p-4 border rounded-lg cursor-pointer transition ${
                    postData.type === 'collaboration_request' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="font-medium">Collaboration</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Request collaboration or find partners</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Post Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's on your mind? *
              </label>
              <textarea
                name="text"
                value={postData.text}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Share your research updates, thoughts, or announcements..."
                required
              />
              <div className="mt-2 flex justify-between text-sm text-gray-500">
                <span>Share your research insights</span>
                <span>{postData.text.length}/1000</span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <input
                type="text"
                name="tags"
                value={postData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter tags separated by commas (e.g., machine learning, healthcare, AI)"
              />
              <p className="mt-1 text-sm text-gray-500">
                Add relevant tags to help others discover your post
              </p>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <select
                name="visibility"
                value={postData.visibility}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="public">Public - Everyone can see</option>
                <option value="connections_only">Connections Only - Only your connections</option>
                <option value="private">Private - Only you</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/feed')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !postData.text.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sharing...
                  </div>
                ) : (
                  'Share Post'
                )}
              </button>
            </div>
          </form>
        </div>
        </div>
      </main>
    </div>
  );
};

export default CreatePost;
