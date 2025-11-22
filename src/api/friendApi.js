import { API_CONFIG } from '../config/environment.js';

const baseURL = API_CONFIG.baseURL;

/**
 * Send friend request
 */
export async function sendFriendRequest(token, userId) {
  try {
    console.log('🔵 Frontend: Sending friend request to:', `${baseURL}/friends/request`);
    console.log('🔵 Frontend: userId:', userId);
    console.log('🔵 Frontend: token:', token ? `${token.substring(0, 20)}...` : 'null');
    
    const response = await fetch(`${baseURL}/friends/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    });

    console.log('🔵 Frontend: Response status:', response.status);
    console.log('🔵 Frontend: Response ok:', response.ok);
    
    // Log response headers (safely)
    try {
      const headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log('🔵 Frontend: Response headers:', headers);
    } catch (e) {
      console.log('🔵 Frontend: Could not log headers');
    }

    if (!response.ok) {
      let errorText = '';
      let error = null;
      
      try {
        errorText = await response.text();
        console.log('🔵 Frontend: Error response text (raw):', errorText);
        console.log('🔵 Frontend: Error response length:', errorText.length);
        
        if (errorText && errorText.trim() !== '') {
          try {
            error = JSON.parse(errorText);
            console.log('🔵 Frontend: Parsed error object:', error);
          } catch (parseError) {
            console.error('🔵 Frontend: Failed to parse as JSON:', parseError);
            error = { message: errorText || `HTTP ${response.status} error` };
          }
        } else {
          console.warn('🔵 Frontend: Empty error response body');
          error = { message: `HTTP ${response.status}: Server returned empty response` };
        }
      } catch (readError) {
        console.error('🔵 Frontend: Failed to read error response:', readError);
        error = { message: `HTTP ${response.status}: Failed to read error response` };
      }
      
      const errorMessage = error?.message || error?.error || `HTTP ${response.status}: Failed to send friend request`;
      console.error('🔵 Frontend: Throwing error:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('🔵 Frontend: Success response:', data);
    return data;
  } catch (error) {
    console.error('🔵 Frontend: Error sending friend request:', error);
    throw error;
  }
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(token, userId) {
  try {
    const response = await fetch(`${baseURL}/friends/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to accept friend request');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
}

/**
 * Reject friend request
 */
export async function rejectFriendRequest(token, userId) {
  try {
    const response = await fetch(`${baseURL}/friends/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reject friend request');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
}

/**
 * Cancel sent friend request
 */
export async function cancelFriendRequest(token, userId) {
  try {
    const response = await fetch(`${baseURL}/friends/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel friend request');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error canceling friend request:', error);
    throw error;
  }
}

/**
 * Block user
 */
export async function blockUser(token, userId) {
  try {
    const response = await fetch(`${baseURL}/friends/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to block user');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
}

/**
 * Get pending friend requests
 */
export async function getPendingRequests(token) {
  try {
    const response = await fetch(`${baseURL}/friends/pending`, {
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
    console.error('Error fetching pending requests:', error);
    throw error;
  }
}

/**
 * Remove connection (unfriend)
 */
export async function removeConnection(token, userId) {
  try {
    const response = await fetch(`${baseURL}/friends/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove connection');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error removing connection:', error);
    throw error;
  }
}

