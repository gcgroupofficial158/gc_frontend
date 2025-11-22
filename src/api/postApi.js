import { API_CONFIG } from '../config/environment.js';

const baseURL = API_CONFIG.baseURL;

/**
 * Fetch posts from backend
 */
export async function fetchPosts(filters = {}, token = null) {
  try {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.visibility) params.append('visibility', filters.visibility);
    if (filters.author) params.append('author', filters.author);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.skip) params.append('skip', filters.skip);

    const url = `${baseURL}/posts${params.toString() ? '?' + params.toString() : ''}`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

/**
 * Fetch single post by ID
 */
export async function fetchPostById(postId) {
  try {
    const response = await fetch(`${baseURL}/posts/${postId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
}

/**
 * Fetch comments for a post
 */
export async function fetchPostComments(postId) {
  try {
    const response = await fetch(`${baseURL}/posts/${postId}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

/**
 * Update a post
 */
export async function updatePost(postId, postData) {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${baseURL}/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

/**
 * Delete a post
 */
export async function deletePost(postId) {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${baseURL}/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      return {
        success: false,
        message: errorMessage,
        statusCode: response.status
      };
    }

    const data = await response.json();
    // Ensure response has success field
    if (data.success === undefined) {
      return {
        success: true,
        ...data
      };
    }
    return data;
  } catch (error) {
    console.error('Error deleting post:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete post. Please try again.',
      error: error.message
    };
  }
}

