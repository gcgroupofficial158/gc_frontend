import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/environment.js';

/**
 * Socket.io Service
 * Manages real-time WebSocket connections for live updates
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.io server
   * @param {string} token - JWT access token
   */
  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    if (!token) {
      console.warn('No token provided for socket connection');
      return;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      this.disconnect();
    }

    const socketURL = API_CONFIG.baseURL.replace('/api/v1', '');
    
    console.log('🔌 Connecting to Socket.io server:', socketURL);

    this.socket = io(socketURL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupEventHandlers();
  }

  /**
   * Setup Socket.io event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected:', this.socket.id);
      this.isConnected = true;
      this.emit('socket:connected', { socketId: this.socket.id });
      
      // Update presence to online
      this.updatePresence(true, 'online');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      this.isConnected = false;
      this.emit('socket:disconnected', { reason });
      
      // Update presence to offline
      this.updatePresence(false, 'offline');
      
      // Attempt to reconnect if it wasn't a manual disconnect
      if (reason !== 'io client disconnect') {
        console.log('🔄 Attempting to reconnect...');
        const token = localStorage.getItem('accessToken');
        if (token && !token.startsWith('dummy-access-token-')) {
          setTimeout(() => {
            this.connect(token);
          }, 2000);
        }
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error);
      this.isConnected = false;
      this.emit('socket:error', { error: error.message });
    });

    // Real-time Post Events
    this.socket.on('post:new', (data) => {
      console.log('📝 New post received:', data);
      this.emit('post:new', data);
    });

    this.socket.on('post:liked', (data) => {
      console.log('👍 Post liked:', data);
      this.emit('post:liked', data);
    });

    this.socket.on('post:unliked', (data) => {
      console.log('👎 Post unliked:', data);
      this.emit('post:unliked', data);
    });

    this.socket.on('post:disliked', (data) => {
      console.log('👎 Post disliked:', data);
      this.emit('post:disliked', data);
    });

    this.socket.on('post:undisliked', (data) => {
      console.log('👍 Post undisliked:', data);
      this.emit('post:undisliked', data);
    });

    this.socket.on('post:created', (data) => {
      console.log('✅ Post created:', data);
      this.emit('post:created', data);
    });

    this.socket.on('post:error', (data) => {
      console.error('❌ Post error:', data);
      this.emit('post:error', data);
    });

    // Real-time Comment Events
    this.socket.on('comment:new', (data) => {
      console.log('💬 New comment received:', data);
      this.emit('comment:new', data);
    });

    this.socket.on('comment:liked', (data) => {
      console.log('👍 Comment liked:', data);
      this.emit('comment:liked', data);
    });

    this.socket.on('comment:error', (data) => {
      console.error('❌ Comment error:', data);
      this.emit('comment:error', data);
    });

    // Real-time Friend Events
    this.socket.on('friend:request:received', (data) => {
      console.log('👋 Friend request received:', data);
      this.emit('friend:request:received', data);
    });

    this.socket.on('friend:request:sent', (data) => {
      console.log('✅ Friend request sent:', data);
      this.emit('friend:request:sent', data);
    });

    this.socket.on('friend:accepted', (data) => {
      console.log('✅ Friend request accepted:', data);
      this.emit('friend:accepted', data);
    });

    this.socket.on('friend:rejected', (data) => {
      console.log('❌ Friend request rejected:', data);
      this.emit('friend:rejected', data);
    });

    this.socket.on('friend:cancelled', (data) => {
      console.log('🚫 Friend request cancelled:', data);
      this.emit('friend:cancelled', data);
    });

    this.socket.on('friend:blocked', (data) => {
      console.log('🚫 User blocked:', data);
      this.emit('friend:blocked', data);
    });

    this.socket.on('friend:removed', (data) => {
      console.log('👋 Connection removed:', data);
      this.emit('friend:removed', data);
    });

    this.socket.on('friend:status', (data) => {
      console.log('👤 Friend status update:', data);
      this.emit('friend:status', data);
    });

    this.socket.on('friend:error', (data) => {
      console.error('❌ Friend error:', data);
      this.emit('friend:error', data);
    });

    // Real-time Chat Events
    this.socket.on('chat:message:new', (data) => {
      console.log('📨 New chat message received:', data);
      this.emit('chat:message:new', data);
    });

    this.socket.on('chat:message:sent', (data) => {
      console.log('✅ Chat message sent confirmation:', data);
      this.emit('chat:message:sent', data);
    });

    this.socket.on('chat:typing', (data) => {
      console.log('⌨️ Typing indicator:', data);
      this.emit('chat:typing', data);
    });

    this.socket.on('chat:conversation:updated', (data) => {
      console.log('🔄 Conversation updated:', data);
      this.emit('chat:conversation:updated', data);
    });

    this.socket.on('chat:message:delivered', (data) => {
      console.log('✅ Message delivered:', data);
      this.emit('chat:message:delivered', data);
    });

    this.socket.on('chat:message:reaction', (data) => {
      console.log('😀 Message reaction:', data);
      this.emit('chat:message:reaction', data);
    });

    this.socket.on('chat:error', (data) => {
      console.error('❌ Chat error:', data);
      this.emit('chat:error', data);
    });

    // User Online/Offline Status Events
    this.socket.on('user:online', (data) => {
      console.log('🟢 User came online:', data);
      this.emit('user:online', data);
    });

    this.socket.on('user:offline', (data) => {
      console.log('🔴 User went offline:', data);
      this.emit('user:offline', data);
    });
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Socket.io disconnected');
    }
  }

  /**
   * Emit event to server
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToServer(event, data) {
    if (!this.socket || !this.socket.connected) {
      console.warn(`⚠️ Cannot emit ${event}: Socket not connected. Attempting to reconnect...`);
      // Try to reconnect if we have a token
      const token = localStorage.getItem('accessToken');
      if (token && !token.startsWith('dummy-access-token-')) {
        this.connect(token);
        // Retry after a short delay
        setTimeout(() => {
          if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
            console.log(`📤 Retried emit ${event} after reconnect`);
          } else {
            console.error(`❌ Failed to emit ${event} after reconnect attempt`);
          }
        }, 1000);
      }
      return;
    }

    this.socket.emit(event, data);
    console.log(`📤 Emitted ${event}:`, data);
  }

  /**
   * Emit event to local listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Create a new post (real-time)
   */
  createPost(postData) {
    this.emitToServer('post:create', postData);
  }

  /**
   * Like a post (real-time)
   */
  likePost(postId) {
    this.emitToServer('post:like', { postId });
  }

  /**
   * Unlike a post (real-time)
   */
  unlikePost(postId) {
    this.emitToServer('post:unlike', { postId });
  }

  /**
   * Dislike a post (real-time)
   */
  dislikePost(postId) {
    this.emitToServer('post:dislike', { postId });
  }

  /**
   * Undislike a post (real-time)
   */
  undislikePost(postId) {
    this.emitToServer('post:undislike', { postId });
  }

  /**
   * Create a comment (real-time)
   */
  createComment(postId, content, parentCommentId = null) {
    this.emitToServer('comment:create', {
      postId,
      content,
      parentCommentId
    });
  }

  /**
   * Like a comment (real-time)
   */
  likeComment(commentId) {
    this.emitToServer('comment:like', { commentId });
  }

  /**
   * Send friend request (real-time)
   */
  sendFriendRequest(userId) {
    this.emitToServer('friend:request', { userId });
  }

  /**
   * Accept friend request (real-time)
   */
  acceptFriendRequest(userId) {
    this.emitToServer('friend:accept', { userId });
  }

  /**
   * Reject friend request (real-time)
   */
  rejectFriendRequest(userId) {
    this.emitToServer('friend:reject', { userId });
  }

  /**
   * Cancel friend request (real-time)
   */
  cancelFriendRequest(userId) {
    this.emitToServer('friend:cancel', { userId });
  }

  /**
   * Block user (real-time)
   */
  blockUser(userId) {
    this.emitToServer('friend:block', { userId });
  }

  /**
   * Remove connection (unfriend) (real-time)
   */
  removeConnection(userId) {
    this.emitToServer('friend:remove', { userId });
  }

  /**
   * Update user presence
   */
  updatePresence(isOnline, status = 'online') {
    this.emitToServer('presence:update', { isOnline, status });
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // ==================== CHAT METHODS ====================

  /**
   * Send a chat message
   */
  sendChatMessage(receiverId, content, messageType = 'text', attachment = null, replyTo = null) {
    this.emitToServer('chat:message', {
      receiverId,
      content,
      messageType,
      attachment,
      replyTo
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(receiverId, isTyping = true) {
    this.emitToServer('chat:typing', {
      receiverId,
      isTyping
    });
  }

  /**
   * Mark messages as read
   */
  markChatAsRead(senderId) {
    this.emitToServer('chat:read', {
      senderId
    });
  }

  /**
   * Join a conversation room
   */
  joinConversation(userId) {
    this.emitToServer('chat:join', {
      userId
    });
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(userId) {
    this.emitToServer('chat:leave', {
      userId
    });
  }

  /**
   * Listen for new chat messages
   */
  onChatMessage(callback) {
    this.on('chat:message:new', callback);
  }

  /**
   * Listen for sent message confirmation
   */
  onChatMessageSent(callback) {
    this.on('chat:message:sent', callback);
  }

  /**
   * Listen for typing indicators
   */
  onChatTyping(callback) {
    this.on('chat:typing', callback);
  }

  /**
   * Listen for read receipts
   */
  onChatRead(callback) {
    this.on('chat:read', callback);
  }

  /**
   * Listen for conversation updates
   */
  onConversationUpdated(callback) {
    this.on('chat:conversation:updated', callback);
  }

  /**
   * Send message reaction via socket
   */
  reactToMessage(messageId, emoji) {
    this.emitToServer('chat:message:reaction', {
      messageId,
      emoji
    });
  }

  /**
   * Listen for message reactions
   */
  onChatMessageReaction(callback) {
    this.on('chat:message:reaction', callback);
  }

  /**
   * Listen for chat errors
   */
  onChatError(callback) {
    this.on('chat:error', callback);
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;

