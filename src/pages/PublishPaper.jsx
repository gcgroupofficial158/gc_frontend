import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';

const PublishPaper = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [contentType, setContentType] = useState('paper'); // 'post' or 'paper'

  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    keywords: '',
    authors: [{ name: user?.name || '', email: user?.email || '', affiliation: '' }],
    category: '',
    subcategory: '',
    methodology: '',
    results: '',
    conclusion: '',
    references: '',
    funding: '',
    acknowledgments: '',
    doi: '',
    publicationDate: '',
    journal: '',
    volume: '',
    issue: '',
    pages: '',
    language: 'English',
    license: 'CC BY',
    file: null
  });

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

  const licenses = [
    'CC BY',
    'CC BY-SA',
    'CC BY-NC',
    'CC BY-NC-SA',
    'CC BY-ND',
    'CC BY-NC-ND',
    'All Rights Reserved'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAuthorChange = (index, field, value) => {
    const newAuthors = [...formData.authors];
    newAuthors[index][field] = value;
    setFormData(prev => ({
      ...prev,
      authors: newAuthors
    }));
  };

  const addAuthor = () => {
    setFormData(prev => ({
      ...prev,
      authors: [...prev.authors, { name: '', email: '', affiliation: '' }]
    }));
  };

  const removeAuthor = (index) => {
    if (formData.authors.length > 1) {
      const newAuthors = formData.authors.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        authors: newAuthors
      }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      // Convert to base64 for storage (in production, upload to S3/cloud storage)
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          file: file,
          fileBase64: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Parse keywords as tags
      const tags = formData.keywords
        ? formData.keywords.split(',').map(k => k.trim()).filter(k => k)
        : [];

      // Prepare paper post data (type: 'paper_share')
      const paperPost = {
        type: 'paper_share',
        content: {
          title: formData.title,
          abstract: formData.abstract,
          category: formData.category,
          doi: formData.doi,
          methodology: formData.methodology,
          results: formData.results,
          conclusion: formData.conclusion,
          references: formData.references,
          funding: formData.funding,
          acknowledgments: formData.acknowledgments,
          publicationDate: formData.publicationDate,
          journal: formData.journal,
          volume: formData.volume,
          issue: formData.issue,
          pages: formData.pages,
          language: formData.language,
          license: formData.license,
          authors: formData.authors,
          // Add attachment if file was uploaded
          ...(formData.file && formData.fileBase64 ? {
            attachment: {
              url: formData.fileBase64, // In production, this would be a URL to the uploaded file
              type: 'application/pdf',
              filename: formData.file.name
            }
          } : {})
        },
        tags: tags,
        visibility: 'public'
      };

      // Create paper post via Socket.io (real-time)
      socketService.createPost(paperPost);

      // Listen for post creation confirmation
      const handlePostCreated = (data) => {
        if (data.success) {
          setSuccess(true);
          setTimeout(() => {
            navigate('/papers');
          }, 1500);
        }
      };

      const handlePostError = (data) => {
        setError(data.error || 'Failed to publish paper. Please try again.');
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
      setError('Failed to publish paper. Please try again.');
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paper Published!</h2>
          <p className="text-gray-600 mb-4">
            Your research paper has been published and is now visible to the community.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Main Content */}
      <main className="w-full py-8">
        <div className="w-[85%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Content Type Selection */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setContentType('post')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  contentType === 'post'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Create Post
              </button>
              <button
                type="button"
                onClick={() => setContentType('paper')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  contentType === 'paper'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Publish Paper
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {contentType === 'paper' ? 'Paper Information' : 'Create Post'}
            </h2>
            <p className="text-sm text-gray-600">
              {contentType === 'paper' ? 'Fill in the details of your research paper' : 'Share your thoughts and updates'}
            </p>
          </div>

          {/* Post Form */}
          {contentType === 'post' ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError('');

              try {
                const postData = {
                  type: 'post',
                  content: {
                    text: formData.title || '' // Reusing title field for post text
                  },
                  tags: formData.keywords
                    ? formData.keywords.split(',').map(k => k.trim()).filter(k => k)
                    : [],
                  visibility: 'public'
                };

                socketService.createPost(postData);

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

                setTimeout(() => {
                  socketService.off('post:created', handlePostCreated);
                  socketService.off('post:error', handlePostError);
                }, 5000);
              } catch (err) {
                setError('Failed to create post. Please try again.');
                setLoading(false);
              }
            }} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's on your mind?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Posting...' : 'Create Post'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the title of your research paper"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abstract *
                </label>
                <textarea
                  name="abstract"
                  value={formData.abstract}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide a comprehensive abstract of your research"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords *
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter keywords separated by commas"
                  required
                />
              </div>
            </div>

            {/* Authors */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Authors *
                </label>
                <button
                  type="button"
                  onClick={addAuthor}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Author
                </button>
              </div>
              {formData.authors.map((author, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={author.name}
                      onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={author.email}
                      onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Affiliation
                      </label>
                      <input
                        type="text"
                        value={author.affiliation}
                        onChange={(e) => handleAuthorChange(index, 'affiliation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {formData.authors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAuthor(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Category and Publication Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Research Content */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Research Content</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Methodology
                </label>
                <textarea
                  name="methodology"
                  value={formData.methodology}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the methodology used in your research"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Results
                </label>
                <textarea
                  name="results"
                  value={formData.results}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Present your research results"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conclusion
                </label>
                <textarea
                  name="conclusion"
                  value={formData.conclusion}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Summarize your conclusions"
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  References
                </label>
                <textarea
                  name="references"
                  value={formData.references}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="List all references used in your research"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Funding Source
                  </label>
                  <input
                    type="text"
                    name="funding"
                    value={formData.funding}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Funding organization or grant number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License
                  </label>
                  <select
                    name="license"
                    value={formData.license}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {licenses.map(license => (
                      <option key={license} value={license}>{license}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acknowledgments
                </label>
                <textarea
                  name="acknowledgments"
                  value={formData.acknowledgments}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acknowledge contributors, institutions, or funding sources"
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Paper (PDF) <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF up to 10MB</p>
                </div>
              </div>
              {formData.file && (
                <div className="mt-2 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-600">
                    Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, file: null, fileBase64: null }))}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
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
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </div>
                ) : (
                  'Publish Paper'
                )}
              </button>
            </div>
          </form>
          )}
        </div>
        </div>
      </main>
    </div>
  );
};

export default PublishPaper;
