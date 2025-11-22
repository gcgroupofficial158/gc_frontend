import { API_CONFIG } from '../config/environment.js';

const baseURL = API_CONFIG.baseURL;

/**
 * Fetch all users
 */
export async function fetchUsers(filters = {}, token = null) {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.skip) params.append('skip', filters.skip);

    const url = `${baseURL}/users${params.toString() ? '?' + params.toString() : ''}`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add auth token if provided (optional - for excluding current user)
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
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Fetch user connections (friends)
 */
export async function fetchConnections(token) {
  try {
    const response = await fetch(`${baseURL}/users/connections`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching connections:', error);
    throw error;
  }
}

/**
 * Fetch user suggestions
 */
export async function fetchSuggestions(token) {
  try {
    const response = await fetch(`${baseURL}/users/suggestions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    throw error;
  }
}

/**
 * Fetch user by ID
 */
export async function fetchUserById(userId, token) {
  try {
    const response = await fetch(`${baseURL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

