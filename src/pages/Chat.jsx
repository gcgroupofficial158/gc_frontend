import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import socketService from '../services/socketService';

// Image Display Component with proper error handling
const ImageDisplay = ({ attachment, baseURL }) => {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [blobUrl, setBlobUrl] = useState(null);
  const imgRef = useRef(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    // Reset error state when URL changes
    setImageError(false);
    setBlobUrl(null);
    
    // Construct image URL
    let url = '';
    if (attachment?.url) {
      if (attachment.url.startsWith('http://') || attachment.url.startsWith('https://')) {
        url = attachment.url;
      } else {
        // Remove /api/v1 from baseURL and add attachment URL
        const baseUrl = baseURL.replace('/api/v1', '').replace(/\/$/, ''); // Remove trailing slash
        // Ensure attachment URL starts with /
        const attachmentUrl = attachment.url.startsWith('/') 
          ? attachment.url 
          : `/${attachment.url}`;
        url = `${baseUrl}${attachmentUrl}`;
      }
    }
    
    setImageUrl(url);
    console.log('🖼️ Constructed image URL:', {
      original: attachment?.url,
      baseURL,
      baseUrl: baseURL.replace('/api/v1', ''),
      attachmentUrl: attachment?.url?.startsWith('/') ? attachment.url : `/${attachment?.url}`,
      fullUrl: url,
      hasAttachment: !!attachment,
      hasUrl: !!attachment?.url
    });

    // Try to load image as blob if direct loading fails
    if (url) {
      fetch(url, { 
        method: 'GET',
        credentials: 'include',
        mode: 'cors'
      })
        .then(response => {
          if (response.ok) {
            return response.blob();
          }
          throw new Error('Failed to fetch image');
        })
        .then(blob => {
          const newBlobUrl = URL.createObjectURL(blob);
          // Cleanup old blob URL if exists
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }
          blobUrlRef.current = newBlobUrl;
          setBlobUrl(newBlobUrl);
          console.log('✅ Image loaded as blob:', newBlobUrl);
        })
        .catch(err => {
          console.warn('⚠️ Could not load image as blob, will try direct URL:', err);
          // Will fall back to direct URL
        });
    }

    // Cleanup blob URL on unmount or URL change
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
        setBlobUrl(null);
      }
    };
  }, [attachment?.url, baseURL]);

  // Force reload image if it fails
  const handleImageError = (e) => {
    const img = e.target;
    console.error('❌ Image failed to load:', {
      imageUrl,
      blobUrl,
      attemptedSrc: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete
    });
    
    // If we have a blob URL, try using it
    if (blobUrl && img.src !== blobUrl) {
      img.src = blobUrl;
      return;
    }
    
    // Try reloading with cache bust
    if (!img.dataset.retried) {
      img.dataset.retried = 'true';
      const newUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
      img.src = newUrl;
    } else {
      // After retry, show error
      setImageError(true);
    }
  };

  if (!imageUrl) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
        <span>🖼️</span>
        <span className="ml-1">Loading image...</span>
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="flex flex-col gap-2 p-2 bg-gray-100 rounded">
        <div className="flex items-center gap-2">
          <span>🖼️</span>
          <span className="ml-1">Shared image</span>
        </div>
        <a 
          href={imageUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm"
          onClick={(e) => {
            e.stopPropagation();
            console.log('Opening image URL:', imageUrl);
          }}
        >
          Open in new tab
        </a>
        <div className="text-xs text-gray-500">
          URL: {imageUrl}
        </div>
      </div>
    );
  }

  // Use blob URL if available, otherwise use direct URL
  const srcToUse = blobUrl || imageUrl;

  return (
    <div className="relative">
      <img
        ref={imgRef}
        src={srcToUse}
        alt="Shared image"
        className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer"
        onLoad={() => {
          console.log('✅ Image loaded successfully:', srcToUse);
          setImageError(false);
        }}
        onError={handleImageError}
        onClick={() => {
          window.open(imageUrl, '_blank');
        }}
        style={{ display: 'block' }}
      />
    </div>
  );
};
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markMessagesAsRead,
  deleteMessage,
  blockConversation,
  searchConnections,
  getOnlineStatus,
  addMessageReaction
} from '../api/chatApi';
import { API_CONFIG } from '../config/environment.js';

const Chat = () => {
  const { user, tokens } = useAuth();
  const { setChatPageStatus, refreshUnreadCount } = useChat();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // messageId for which emoji picker is shown
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false); // For message input emoji picker
  const [hoveredMessageId, setHoveredMessageId] = useState(null); // Track which message is hovered

  // Check if user is near bottom of messages
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Scroll to bottom of messages
  const scrollToBottom = (force = false, instant = false) => {
    // Only auto-scroll if user is near bottom or forced
    if (!force && !isNearBottom()) {
      return;
    }
    
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: instant ? 'auto' : 'smooth',
          block: 'end'
        });
      } else if (messagesContainerRef.current) {
        // Fallback: scroll container directly
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, instant ? 0 : 100);
  };

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0 && selectedConversation && messagesContainerRef.current) {
      // Check if this is initial load (scroll position is at top or very small)
      const container = messagesContainerRef.current;
      const isInitialLoad = container.scrollTop < 50; // Consider it initial if scrolled less than 50px
      
      if (isInitialLoad) {
        // For initial load, force instant scroll to bottom
        setTimeout(() => {
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 50);
        setTimeout(() => {
          scrollToBottom(true, true);
        }, 150);
      } else {
        // For subsequent updates, only scroll if user is near bottom
        scrollToBottom(false, false);
      }
    }
  }, [messages, selectedConversation]);

  // Set chat page status when component mounts/unmounts
  useEffect(() => {
    setChatPageStatus(true);
    return () => {
      setChatPageStatus(false);
    };
  }, [setChatPageStatus]);

  // Ensure socket is connected when Chat page loads
  useEffect(() => {
    if (tokens?.accessToken && !socketService.socket?.connected) {
      console.log('🔌 Connecting socket in Chat page...');
      socketService.connect(tokens.accessToken);
    }
  }, [tokens]);

  // Fetch conversations and online status
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch conversations
        const conversationsResponse = await getConversations(tokens.accessToken);
        setConversations(conversationsResponse.data.conversations || []);

        // Fetch initial online status
        try {
          const onlineStatusResponse = await getOnlineStatus(tokens.accessToken);
          if (onlineStatusResponse.success && onlineStatusResponse.data.onlineUsers) {
            setOnlineUsers(new Set(onlineStatusResponse.data.onlineUsers.map(id => String(id))));
            console.log('📊 Initial online users loaded:', onlineStatusResponse.data.onlineUsers);
          }
        } catch (error) {
          console.error('Error fetching online status:', error);
          // Don't fail if online status fails
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tokens?.accessToken) {
      fetchData();
    }
  }, [tokens]);

  // Handle search for connections
  const handleSearchConnections = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchConnections(tokens.accessToken, query, 20);
      if (response.success) {
        setSearchResults(response.data.connections || []);
      }
    } catch (error) {
      console.error('Error searching connections:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearchConnections(query);
  };

  // Handle selecting a user from search to start conversation
  const handleSelectUser = (userData) => {
    const userId = userData._id || userData.id;
    
    // Check if conversation already exists
    const existingConv = conversations.find(conv => 
      String(conv.participant?._id || conv.participant) === String(userId)
    );

    if (existingConv) {
      setSelectedConversation(existingConv);
    } else {
      // Create a temporary conversation object
      setSelectedConversation({
        _id: `temp-${userId}`,
        participant: {
          _id: userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profilePicture: userData.profilePicture
        },
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0
      });
    }
    
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Check URL params for userId (when navigating from Network page)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    
    if (userId && tokens?.accessToken) {
      // Find existing conversation or create temp one
      const existingConv = conversations.find(conv => 
        String(conv.participant?._id || conv.participant) === String(userId)
      );

      if (existingConv) {
        setSelectedConversation(existingConv);
      } else {
        // Fetch user details and create temp conversation
        fetch(`${API_CONFIG.baseURL}/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data.user) {
              const userData = data.data.user;
              setSelectedConversation({
                _id: `temp-${userId}`,
                participant: {
                  _id: userId,
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  profilePicture: userData.profilePicture
                },
                lastMessage: null,
                lastMessageAt: null,
                unreadCount: 0
              });
            }
          })
          .catch(err => console.error('Error fetching user:', err));
      }
      
      // Clean URL
      window.history.replaceState({}, '', '/chat');
    }
  }, [conversations, tokens]);

  // Close emoji pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showEmojiPicker && !e.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(null);
      }
      if (showInputEmojiPicker && !e.target.closest('.input-emoji-picker-container')) {
        setShowInputEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showInputEmojiPicker]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && selectedConversation.participant?._id) {
      const fetchMessages = async () => {
        try {
          const participantId = selectedConversation.participant._id;
          
          // Only fetch messages if conversation exists (not a temp conversation)
          if (!selectedConversation._id?.startsWith('temp-')) {
            const response = await getMessages(tokens.accessToken, participantId);
            // Ensure all messages have status fields initialized
            const messagesWithStatus = (response.data.messages || []).map(msg => ({
              ...msg,
              isDelivered: msg.isDelivered !== undefined ? msg.isDelivered : false,
              isRead: msg.isRead !== undefined ? msg.isRead : false,
              reactions: msg.reactions || [] // Ensure reactions array exists
            }));
            setMessages(messagesWithStatus);
          
          // Mark as read
            await markMessagesAsRead(tokens.accessToken, participantId);
            // Refresh unread count after marking as read
            refreshUnreadCount();
            
            // Force scroll to bottom after messages are loaded (instant scroll for initial load)
            // Use multiple timeouts to ensure DOM is fully rendered
            setTimeout(() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
              }
            }, 100);
            setTimeout(() => {
              scrollToBottom(true, true);
            }, 300);
          } else {
            // New conversation - no messages yet
            setMessages([]);
          }
          
          // Join conversation room
          socketService.joinConversation(participantId);
        } catch (error) {
          console.error('Error fetching messages:', error);
          // If error, still allow sending messages (might be new conversation)
          setMessages([]);
        }
      };

      fetchMessages();
    } else {
      setMessages([]);
    }

    return () => {
      if (selectedConversation?.participant?._id) {
        socketService.leaveConversation(selectedConversation.participant._id);
      }
    };
  }, [selectedConversation, tokens]);

  // Socket event listeners
  useEffect(() => {
    if (!tokens?.accessToken) return;

    // Ensure socket is connected
    if (!socketService.socket?.connected) {
      socketService.connect(tokens.accessToken);
    }

    // New message received
    const handleNewMessage = (data) => {
      console.log('📨 New message received via socket:', data);
      if (!data.message) return;
        
      const senderId = String(data.message.sender?._id || data.message.sender);
      const currentUserId = String(user._id || user.id);
      
      // Always update conversations list when new message arrives
      const fetchConversations = async () => {
        try {
          const response = await getConversations(tokens.accessToken);
          const updatedConversations = response.data.conversations || [];
          setConversations(updatedConversations);
          
          // If we're in a temp conversation and a real one was created, switch to it
          if (selectedConversation?._id?.startsWith('temp-')) {
            const realConv = updatedConversations.find(conv => 
              String(conv.participant?._id || conv.participant) === String(selectedConversation.participant?._id)
            );
            if (realConv) {
              setSelectedConversation(realConv);
            }
          }
        } catch (error) {
          console.error('Error fetching conversations:', error);
        }
      };
      
      if (selectedConversation) {
        const participantId = String(selectedConversation.participant?._id || selectedConversation.participant);
        
        // If message is from selected conversation participant
        if (senderId === participantId) {
          setMessages(prev => {
            // Avoid duplicates
            const exists = prev.some(msg => String(msg._id) === String(data.message._id));
            if (exists) return prev;
            const newMessages = [...prev, data.message];
            // Auto-scroll after state update (force scroll for new received messages)
            setTimeout(() => {
              scrollToBottom(true);
            }, 50);
            return newMessages;
          });
          
          // Acknowledge delivery immediately when message is received
          if (data.message._id && socketService.socket?.connected) {
            // Small delay to ensure message is added to state first
            setTimeout(() => {
              socketService.socket.emit('chat:message:delivered', {
                messageId: data.message._id
              });
            }, 100);
          }
          
          // Mark as read
          markMessagesAsRead(tokens.accessToken, senderId).then(() => {
            // Refresh unread count after marking as read
            refreshUnreadCount();
          });
        }
      }
      
      // Always update conversations list
      fetchConversations();
    };

    // Message sent confirmation
    const handleMessageSent = (data) => {
      if (data.success && data.message) {
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(msg => String(msg._id) === String(data.message._id));
          if (exists) return prev;
          // Initialize message with sent status (not delivered, not read)
          const messageWithStatus = {
            ...data.message,
            isDelivered: false,
            isRead: false
          };
          const newMessages = [...prev, messageWithStatus];
          // Auto-scroll after state update (force scroll for sent messages)
          setTimeout(() => {
            scrollToBottom(true);
          }, 50);
          return newMessages;
        });
        setSending(false);
        
        // Refresh conversations to get real conversation if it was temp
        const fetchConversations = async () => {
          try {
            const response = await getConversations(tokens.accessToken);
            const updatedConversations = response.data.conversations || [];
            setConversations(updatedConversations);
            
            // If we're in a temp conversation, switch to real one
            if (selectedConversation?._id?.startsWith('temp-')) {
              const realConv = updatedConversations.find(conv => 
                String(conv.participant?._id || conv.participant) === String(selectedConversation.participant?._id)
              );
              if (realConv) {
                setSelectedConversation(realConv);
              }
            }
          } catch (error) {
            console.error('Error fetching conversations:', error);
          }
        };
        fetchConversations();
      }
    };

    // Typing indicator
    const handleTyping = (data) => {
      if (selectedConversation && data.userId === selectedConversation.participant._id) {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: data.isTyping
        }));

        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => ({
              ...prev,
              [data.userId]: false
            }));
          }, 3000);
        }
      }
    };

    // Conversation updated
    const handleConversationUpdated = () => {
      const fetchConversations = async () => {
        try {
          const response = await getConversations(tokens.accessToken);
          setConversations(response.data.conversations || []);
        } catch (error) {
          console.error('Error fetching conversations:', error);
        }
      };
      fetchConversations();
    };

    // Online status handler
    const handleUserOnline = (data) => {
      console.log('🟢 User online:', data);
      if (data.userId) {
        const userIdStr = String(data.userId);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.add(userIdStr);
          return newSet;
        });
        console.log('✅ Added user to online set:', userIdStr);
      }
    };

    const handleUserOffline = (data) => {
      console.log('🔴 User offline:', data);
      if (data.userId) {
        const userIdStr = String(data.userId);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userIdStr);
          return newSet;
        });
        console.log('❌ Removed user from online set:', userIdStr);
      }
    };

    // Message delivery handler
    const handleMessageDelivered = (data) => {
      if (data.messageId) {
        setMessages(prev => prev.map(msg => 
          String(msg._id) === String(data.messageId) 
            ? { ...msg, isDelivered: true, deliveredAt: data.deliveredAt } 
            : msg
        ));
      }
    };

    // Message read receipt handler
    const handleMessageRead = (data) => {
      if (data.messageId) {
        setMessages(prev => prev.map(msg => 
          String(msg._id) === String(data.messageId) 
            ? { ...msg, isRead: true, readAt: data.readAt } 
            : msg
        ));
        // Refresh unread count when message is read
        refreshUnreadCount();
      }
    };

    // Message reaction handler - real-time updates
    const handleMessageReaction = (data) => {
      console.log('😀 Reaction update received:', data);
      if (data.messageId && data.reactions) {
        setMessages(prev => prev.map(msg => 
          String(msg._id) === String(data.messageId) 
            ? { ...msg, reactions: data.reactions } 
            : msg
        ));
      }
    };

    // Socket connection status handler
    const handleSocketConnected = () => {
      console.log('✅ Socket connected in Chat page');
      // Update online status - backend will broadcast to friends
      socketService.updatePresence(true, 'online');
    };

    const handleSocketDisconnected = () => {
      console.log('❌ Socket disconnected in Chat page');
    };

    // Register all event listeners
    socketService.onChatMessage(handleNewMessage);
    socketService.onChatMessageSent(handleMessageSent);
    socketService.onChatTyping(handleTyping);
    socketService.onConversationUpdated(handleConversationUpdated);
    
    // Listen for online status updates
    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);
    socketService.on('chat:message:delivered', handleMessageDelivered);
    socketService.on('chat:message:read', handleMessageRead);
    socketService.onChatMessageReaction(handleMessageReaction);
    socketService.on('socket:connected', handleSocketConnected);
    socketService.on('socket:disconnected', handleSocketDisconnected);

    return () => {
      socketService.off('chat:message:new', handleNewMessage);
      socketService.off('chat:message:sent', handleMessageSent);
      socketService.off('chat:typing', handleTyping);
      socketService.off('chat:conversation:updated', handleConversationUpdated);
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);
      socketService.off('chat:message:delivered', handleMessageDelivered);
      socketService.off('chat:message:read', handleMessageRead);
      socketService.off('chat:message:reaction', handleMessageReaction);
      socketService.off('socket:connected', handleSocketConnected);
      socketService.off('socket:disconnected', handleSocketDisconnected);
    };
  }, [selectedConversation, user, tokens]);

  // Handle typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (selectedConversation) {
      socketService.sendTypingIndicator(selectedConversation.participant._id, true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTypingIndicator(selectedConversation.participant._id, false);
      }, 1000);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle emoji reaction
  const handleReaction = async (messageId, emoji) => {
    try {
      // Optimistic update
      setMessages(prev => prev.map(msg => {
        if (String(msg._id) === String(messageId)) {
          const currentUserId = String(user._id || user.id);
          const existingReaction = msg.reactions?.find(
            r => String(r.user?._id || r.user) === currentUserId && r.emoji === emoji
          );
          
          let newReactions = [...(msg.reactions || [])];
          if (existingReaction) {
            // Remove reaction
            newReactions = newReactions.filter(
              r => !(String(r.user?._id || r.user) === currentUserId && r.emoji === emoji)
            );
          } else {
            // Add reaction
            newReactions.push({
              user: user._id || user.id,
              emoji: emoji,
              createdAt: new Date()
            });
          }
          
          return { ...msg, reactions: newReactions };
        }
        return msg;
      }));

      // Send via socket for real-time
      if (socketService.socket?.connected) {
        socketService.reactToMessage(messageId, emoji);
      } else {
        // Fallback to API
        await addMessageReaction(tokens.accessToken, messageId, emoji);
      }
      
      setShowEmojiPicker(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Quick emoji reactions - expanded list
  const quickEmojis = [
    '👍', '👎', '❤️', '😍', '😂', '😮', '😢', '🔥',
    '😊', '😎', '🤔', '👏', '🎉', '💯', '✨', '🙌',
    '😱', '😴', '🤗', '😋', '🥳', '😇', '🤩', '😏'
  ];

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() && !selectedFile) return;
    if (!selectedConversation) return;

    // Check if socket is connected
    if (!socketService.socket?.connected) {
      console.warn('⚠️ Socket not connected, attempting to reconnect...');
      socketService.connect(tokens.accessToken);
      // Wait a bit for connection
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setSending(true);
    
    try {
      const messageType = selectedFile 
        ? (selectedFile.type.startsWith('image/') ? 'image' 
          : selectedFile.type === 'application/pdf' ? 'pdf'
          : selectedFile.type.startsWith('video/') ? 'video'
          : 'file')
        : 'text';

      // Send message - always use API (it now emits socket events)
      // API handles file uploads and emits socket events for real-time delivery
      const apiResponse = await sendMessage(
        tokens.accessToken,
        selectedConversation.participant._id,
        messageInput,
        messageType,
        selectedFile
      );

      // Message will be added to UI via socket event (chat:message:sent)
      // But add optimistically if API returned it immediately
      if (apiResponse?.data?.message) {
        setMessages(prev => {
          const exists = prev.some(msg => String(msg._id) === String(apiResponse.data.message._id));
          if (exists) return prev;
          const newMessages = [...prev, apiResponse.data.message];
          // Auto-scroll after state update (force scroll for sent messages)
          setTimeout(() => {
            scrollToBottom(true);
          }, 50);
          return newMessages;
        });
      }

      setMessageInput('');
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Stop typing indicator
      socketService.sendTypingIndicator(selectedConversation.participant._id, false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Format message time
  const formatTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diff = now - messageDate;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return messageDate.toLocaleDateString();
  };

  // Get file icon
  const getFileIcon = (messageType) => {
    switch (messageType) {
      case 'image':
        return '🖼️';
      case 'pdf':
        return '📄';
      case 'video':
        return '🎥';
      case 'file':
        return '📎';
      default:
        return '💬';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden flex flex-col pt-20">
      <div className="container mx-auto px-4 py-6 flex-1 min-h-0 flex flex-col">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="flex flex-1 min-h-0">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">Messages</h2>
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    title="Search connections"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                <p className="text-indigo-100 text-sm">{conversations.length} conversations</p>
              </div>
              
              {/* Search Bar */}
              {showSearch && (
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search connections to message..."
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-2.5">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchQuery && searchResults.length > 0 && (
                    <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                      {searchResults.map((result) => (
                        <div
                          key={result._id}
                          onClick={() => handleSelectUser(result)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={result.profilePicture || `https://ui-avatars.com/api/?name=${result.firstName}+${result.lastName}`}
                              alt={result.firstName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {result.firstName} {result.lastName}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                {result.isConnected && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Connected
                                  </span>
                                )}
                                {result.hasPastChat && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    Past Chat
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery && !isSearching && searchResults.length === 0 && (
                    <div className="mt-2 text-center text-gray-500 text-sm py-4">
                      No connections found
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto min-h-0">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start chatting with your friends!</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?._id === conv._id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={conv.participant?.profilePicture || `https://ui-avatars.com/api/?name=${conv.participant?.firstName}+${conv.participant?.lastName}`}
                            alt={conv.participant?.firstName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                            {(() => {
                              const participantId = String(conv.participant?._id || conv.participant);
                              return onlineUsers.has(participantId) && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                              );
                            })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {conv.participant?.firstName} {conv.participant?.lastName}
                            </h3>
                            {conv.unreadCount > 0 && (
                              <span className="bg-indigo-600 text-white text-xs font-bold rounded-full px-2 py-1">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {conv.lastMessage?.content || 'No messages yet'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              {selectedConversation ? (
                <>
                  {/* Chat Header - Fixed */}
                  <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0 z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={selectedConversation.participant?.profilePicture || `https://ui-avatars.com/api/?name=${selectedConversation.participant?.firstName}+${selectedConversation.participant?.lastName}`}
                          alt={selectedConversation.participant?.firstName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {selectedConversation.participant?.firstName} {selectedConversation.participant?.lastName}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center">
                            {(() => {
                              const participantId = String(selectedConversation.participant?._id || selectedConversation.participant);
                              const isOnline = onlineUsers.has(participantId);
                              return isOnline ? (
                                <>
                                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                  Online
                                </>
                              ) : (
                                <>
                                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                  Offline
                                </>
                              );
                            })()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => blockConversation(tokens.accessToken, selectedConversation.participant._id, true)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Block
                      </button>
                    </div>
                  </div>

                  {/* Messages - Scrollable Area */}
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0"
                    style={{ scrollBehavior: 'auto' }}
                  >
                    <div className="space-y-4">
                      {messages.map((message) => {
                        // Determine if message is sent by current user
                        const senderId = String(message.sender?._id || message.sender || '');
                        const receiverId = String(message.receiver?._id || message.receiver || '');
                        const currentUserId = String(user?._id || user?.id || '');
                        
                        // Message is sent if sender is current user OR receiver is not current user
                        const isSent = senderId === currentUserId;
                        
                        return (
                      <div
                        key={message._id}
                          className={`flex items-end gap-2 mb-4 w-full ${isSent ? 'justify-end' : 'justify-start'}`}
                      >
                          {/* Avatar for received messages (left side) */}
                          {!isSent && (
                            <img
                              src={message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${message.sender?.firstName || ''}+${message.sender?.lastName || ''}`}
                              alt={message.sender?.firstName || 'User'}
                              className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                          )}
                          
                          {/* Message bubble */}
                          <div className={`max-w-xs lg:max-w-md ${isSent ? 'ml-auto' : ''} ${isSent ? 'flex flex-col items-end' : ''}`}>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                                isSent
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            {message.attachment && (
                              <div className="mb-2">
                                {message.messageType === 'image' && (
                                  <div>
                                    {message.attachment?.url ? (
                                      <ImageDisplay 
                                        attachment={message.attachment}
                                        baseURL={API_CONFIG.baseURL}
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span>🖼️</span>
                                        <span className="ml-1">Shared image</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {message.messageType === 'pdf' && (
                                  <a
                                    href={`${API_CONFIG.baseURL.replace('/api/v1', '')}${message.attachment.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                                  >
                                    <span>📄</span>
                                    <span>{message.attachment.filename}</span>
                                  </a>
                                )}
                                {message.messageType === 'video' && (
                                  <video
                                    src={`${API_CONFIG.baseURL.replace('/api/v1', '')}${message.attachment.url}`}
                                    controls
                                    className="max-w-full rounded-lg"
                                  />
                                )}
                                {message.messageType === 'file' && (
                                  <a
                                    href={`${API_CONFIG.baseURL.replace('/api/v1', '')}${message.attachment.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                                  >
                                    <span>📎</span>
                                    <span>{message.attachment.filename}</span>
                                  </a>
                                )}
                              </div>
                            )}
                            {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                              <div className={`flex items-center gap-1 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                                <p className={`text-xs ${isSent ? 'text-indigo-200' : 'text-gray-500'}`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                            {/* Message status ticks - outside bubble, below in right corner for sent messages */}
                            {isSent && (
                              <span className={`text-xs mt-1 ${
                                message.isRead 
                                  ? 'text-blue-400'  // Blue double tick for read
                                  : message.isDelivered 
                                    ? 'text-indigo-200'  // Gray double tick for delivered
                                    : 'text-gray-400'  // Gray single tick for sent
                              }`}>
                                {message.isRead || message.isDelivered ? '✓✓' : '✓'}
                              </span>
                            )}
                            
                          {/* Reactions and emoji picker */}
                          <div 
                            className="mt-1 relative group"
                            onMouseEnter={() => setHoveredMessageId(message._id)}
                            onMouseLeave={() => setHoveredMessageId(null)}
                          >
                            {/* Display reactions */}
                            {message.reactions && Array.isArray(message.reactions) && message.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {Object.entries(
                                  message.reactions.reduce((acc, reaction) => {
                                    if (!reaction || !reaction.emoji) return acc;
                                    const emoji = reaction.emoji;
                                    if (!acc[emoji]) {
                                      acc[emoji] = [];
                                    }
                                    acc[emoji].push(reaction);
                                    return acc;
                                  }, {})
                                ).map(([emoji, reactions]) => {
                                  const currentUserId = String(user._id || user.id);
                                  const hasUserReacted = reactions.some(
                                    r => r && (String(r.user?._id || r.user) === currentUserId)
                                  );
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(message._id, emoji)}
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                                        hasUserReacted
                                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                          : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span>{reactions.length}</span>
                                    </button>
                                  );
                                })}
                      </div>
                            )}
                            
                            {/* Emoji picker button - always show, more visible on hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id);
                              }}
                              className={`text-sm px-2 py-1 rounded transition-all ${
                                hoveredMessageId === message._id
                                  ? 'text-gray-600 bg-gray-100'
                                  : 'text-gray-400 opacity-60 hover:opacity-100'
                              }`}
                              title="Add reaction"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                            
                            {/* Emoji picker */}
                            {showEmojiPicker === message._id && (
                              <div 
                                className="emoji-picker-container absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-[100]"
                                style={{
                                  left: isSent ? 'auto' : '0',
                                  right: isSent ? '0' : 'auto',
                                  maxWidth: '280px',
                                  width: '280px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="grid grid-cols-6 gap-1">
                                  {quickEmojis.map(emoji => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReaction(message._id, emoji);
                                      }}
                                      className="text-lg hover:scale-125 transition-transform p-1.5 hover:bg-gray-100 rounded cursor-pointer flex items-center justify-center"
                                      title={emoji}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          </div>
                        </div>
                      );
                      })}
                    
                    {/* Typing Indicator */}
                    {typingUsers[selectedConversation.participant._id] && (
                        <div className="flex justify-start">
                        <div className="bg-white rounded-2xl px-4 py-2 border border-gray-200">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                      {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Message Input - Fixed */}
                  <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0 z-10">
                    {filePreview && (
                      <div className="mb-2 relative inline-block">
                        <img src={filePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                        <button
                          onClick={removeFile}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {selectedFile && !filePreview && (
                      <div className="mb-2 flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
                        <span>{getFileIcon(selectedFile.type.startsWith('image/') ? 'image' : selectedFile.type === 'application/pdf' ? 'pdf' : selectedFile.type.startsWith('video/') ? 'video' : 'file')}</span>
                        <span className="flex-1 text-sm text-gray-700 truncate">{selectedFile.name}</span>
                        <button
                          onClick={removeFile}
                          className="text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,application/pdf,video/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                        title="Attach file"
                      >
                        📎
                      </button>
                      <div className="flex-1 relative">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                        {/* Emoji picker for input */}
                        {showInputEmojiPicker && (
                          <div 
                            className="input-emoji-picker-container absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-[100]"
                            style={{
                              maxWidth: '280px',
                              width: '280px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="grid grid-cols-6 gap-1">
                              {quickEmojis.map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMessageInput(prev => prev + emoji);
                                    setShowInputEmojiPicker(false);
                                  }}
                                  className="text-lg hover:scale-125 transition-transform p-1.5 hover:bg-gray-100 rounded cursor-pointer flex items-center justify-center"
                                  title={emoji}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowInputEmojiPicker(!showInputEmojiPicker);
                        }}
                        className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                        title="Add emoji"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button
                        type="submit"
                        disabled={sending || (!messageInput.trim() && !selectedFile)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sending ? 'Sending...' : 'Send'}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-xl font-semibold">Select a conversation</p>
                    <p className="text-sm mt-2">Choose a conversation from the sidebar to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

