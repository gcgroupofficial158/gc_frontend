import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Papers = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('date');

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

  // Mock data for demonstration
  useEffect(() => {
    const mockPapers = [
      {
        id: 1,
        title: "Machine Learning Applications in Healthcare",
        abstract: "This paper explores the use of machine learning algorithms in diagnosing diseases and predicting patient outcomes...",
        authors: ["Dr. Sarah Johnson", "Prof. Michael Chen"],
        category: "Computer Science",
        publishedDate: "2024-01-15",
        citations: 45,
        downloads: 234,
        status: "published",
        doi: "10.1000/182",
        keywords: ["machine learning", "healthcare", "diagnosis", "AI"]
      },
      {
        id: 2,
        title: "Quantum Computing: A New Era of Computation",
        abstract: "Quantum computing represents a paradigm shift in computational power, offering solutions to problems...",
        authors: ["Dr. Alex Rodriguez", "Dr. Emma Wilson"],
        category: "Physics",
        publishedDate: "2024-01-10",
        citations: 78,
        downloads: 456,
        status: "published",
        doi: "10.1000/183",
        keywords: ["quantum computing", "quantum mechanics", "computation"]
      },
      {
        id: 3,
        title: "Sustainable Energy Solutions for Urban Development",
        abstract: "This research investigates renewable energy integration in urban environments...",
        authors: ["Prof. David Kim", "Dr. Lisa Thompson"],
        category: "Engineering",
        publishedDate: "2024-01-05",
        citations: 32,
        downloads: 189,
        status: "published",
        doi: "10.1000/184",
        keywords: ["sustainable energy", "urban development", "renewable energy"]
      },
      {
        id: 4,
        title: "The Impact of Social Media on Mental Health",
        abstract: "A comprehensive study examining the correlation between social media usage and mental health outcomes...",
        authors: ["Dr. Maria Garcia", "Prof. James Brown"],
        category: "Psychology",
        publishedDate: "2023-12-28",
        citations: 67,
        downloads: 312,
        status: "published",
        doi: "10.1000/185",
        keywords: ["social media", "mental health", "psychology", "wellbeing"]
      },
      {
        id: 5,
        title: "Advanced Materials for Space Exploration",
        abstract: "Development of new materials capable of withstanding extreme space conditions...",
        authors: ["Dr. Robert Taylor", "Dr. Jennifer Lee"],
        category: "Engineering",
        publishedDate: "2023-12-20",
        citations: 23,
        downloads: 145,
        status: "published",
        doi: "10.1000/186",
        keywords: ["materials science", "space exploration", "aerospace"]
      }
    ];
    
    setTimeout(() => {
      setPapers(mockPapers);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const filteredPapers = papers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         paper.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         paper.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === '' || paper.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedPapers = [...filteredPapers].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.publishedDate) - new Date(a.publishedDate);
      case 'citations':
        return b.citations - a.citations;
      case 'downloads':
        return b.downloads - a.downloads;
      case 'title':
        return a.title.localeCompare(b.title);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading research papers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="w-full py-8">
        <div className="w-[85%] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Papers
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by title, author, or keywords..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Publication Date</option>
                <option value="citations">Citations</option>
                <option value="downloads">Downloads</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {sortedPapers.length} of {papers.length} papers
          </p>
        </div>

        {/* Papers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedPapers.map(paper => (
            <div
              key={paper.id}
              onClick={() => handlePaperClick(paper.id)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {paper.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(paper.publishedDate).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {paper.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {paper.abstract}
                </p>

                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Authors:</span> {paper.authors.join(', ')}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">DOI:</span> {paper.doi}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {paper.keywords.slice(0, 3).map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {keyword}
                    </span>
                  ))}
                  {paper.keywords.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      +{paper.keywords.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
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
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No papers found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse all papers.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default Papers;
