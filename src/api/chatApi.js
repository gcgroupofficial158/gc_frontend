import { API_CONFIG } from '../config/environment.js';

const baseURL = API_CONFIG.baseURL;

/**
 * Send a chat message
 */
export async function sendMessage(token, receiverId, content, messageType = 'text', file = null, replyTo = null) {
  try {
    const formData = new FormData();
    formData.append('receiverId', receiverId);
    formData.append('content', content || '');
    formData.append('messageType', messageType);
    if (file) {
      formData.append('file', file);
    }
    if (replyTo) {
      formData.append('replyTo', replyTo);
    }

    const response = await fetch(`${baseURL}/chat/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send message');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Get all conversations for current user
 */
export async function getConversations(token) {
  try {
    const response = await fetch(`${baseURL}/chat/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch conversations');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

/**
 * Get messages for a conversation
 */
export async function getMessages(token, userId, page = 1, limit = 50) {
  try {
    const response = await fetch(`${baseURL}/chat/messages/${userId}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch messages');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(token, userId) {
  try {
    const response = await fetch(`${baseURL}/chat/messages/read/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark messages as read');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(token, messageId) {
  try {
    const response = await fetch(`${baseURL}/chat/message/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete message');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

/**
 * Block/unblock a conversation
 */
export async function blockConversation(token, userId, block = true) {
  try {
    const response = await fetch(`${baseURL}/chat/block/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ block })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to block/unblock conversation');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error blocking conversation:', error);
    throw error;
  }
}

/**
 * Search connections/friends for messaging
 */
export async function searchConnections(token, searchQuery = '', limit = 20) {
  try {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (limit) params.append('limit', limit);

    const response = await fetch(`${baseURL}/chat/search-connections?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to search connections');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching connections:', error);
    throw error;
  }
}

/**
 * Get online status for conversation participants
 */
export async function getOnlineStatus(token) {
  try {
    const response = await fetch(`${baseURL}/chat/online-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get online status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting online status:', error);
    throw error;
  }
}

/**
 * Add or remove reaction to a message
 */
export async function addMessageReaction(token, messageId, emoji) {
  try {
    const response = await fetch(`${baseURL}/chat/message/${messageId}/reaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ emoji })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add reaction');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
}

