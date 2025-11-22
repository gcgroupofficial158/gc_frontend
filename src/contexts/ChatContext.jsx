import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getConversations } from '../api/chatApi';
import socketService from '../services/socketService';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export default function ChatProvider({ children }) {
  const { isAuthenticated, tokens, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnChatPage, setIsOnChatPage] = useState(false);

  // Calculate total unread count from conversations
  const calculateUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !tokens?.accessToken) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await getConversations(tokens.accessToken);
      if (response?.success && response?.data?.conversations) {
        const totalUnread = response.data.conversations.reduce((sum, conv) => {
          return sum + (conv.unreadCount || 0);
        }, 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error calculating unread count:', error);
    }
  }, [isAuthenticated, tokens]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken) {
      calculateUnreadCount();
    }
  }, [isAuthenticated, tokens, calculateUnreadCount]);

  // Listen to socket events for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !tokens?.accessToken) return;

    const handleNewMessage = (data) => {
      // Check if message is for current user
      const currentUserId = String(user?._id || user?.id || '');
      // Socket event can have message.receiver or just receiver
      const receiverId = String(
        data.message?.receiver?._id || 
        data.message?.receiver || 
        data.receiver?._id || 
        data.receiver || 
        ''
      );
      
      // Only increment unread count if message is for current user
      if (receiverId && receiverId === currentUserId) {
        if (!isOnChatPage) {
          // Not on chat page - increment count immediately
          setUnreadCount(prev => prev + 1);
        } else {
          // On chat page - recalculate to be accurate (might be viewing different conversation)
          // Small delay to allow conversation update to complete
          setTimeout(() => {
            calculateUnreadCount();
          }, 500);
        }
      }
    };

    const handleMessageRead = () => {
      // Recalculate unread count when messages are read
      calculateUnreadCount();
    };

    const handleConversationUpdate = () => {
      // Recalculate when conversation is updated
      calculateUnreadCount();
    };

    // Listen to socket events
    if (socketService.socket?.connected) {
      socketService.on('chat:message:new', handleNewMessage);
      socketService.on('chat:message:read', handleMessageRead);
      socketService.on('chat:conversation:updated', handleConversationUpdate);
    }

    return () => {
      if (socketService.socket) {
        socketService.off('chat:message:new', handleNewMessage);
        socketService.off('chat:message:read', handleMessageRead);
        socketService.off('chat:conversation:updated', handleConversationUpdate);
      }
    };
  }, [isAuthenticated, tokens, isOnChatPage, calculateUnreadCount, user]);

  // Update unread count when navigating to/from chat page
  const setChatPageStatus = useCallback((isOnPage) => {
    setIsOnChatPage(isOnPage);
    if (isOnPage) {
      // When entering chat page, recalculate (messages might have been read)
      calculateUnreadCount();
    }
  }, [calculateUnreadCount]);

  return (
    <ChatContext.Provider value={{
      unreadCount,
      setUnreadCount,
      isOnChatPage,
      setChatPageStatus,
      refreshUnreadCount: calculateUnreadCount
    }}>
      {children}
    </ChatContext.Provider>
  );
}

