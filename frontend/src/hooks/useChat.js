import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { initializeSocket, getSocket, getChatHistory } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const getStorageKey = (userId) => `attorneygpt_chats_${userId || 'guest'}`;
const getCurrentChatKey = (userId) => `attorneygpt_current_chat_${userId || 'guest'}`;

/**
 * Generate unique ID
 */
const generateId = () => {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get timestamp
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Custom hook for chat functionality
 */
export const useChat = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [error, setError] = useState(null);
  
  const streamingTextRef = useRef('');

  // Memoize storage keys based on userId
  const STORAGE_KEY = useMemo(() => getStorageKey(user?.id), [user?.id]);
  const CURRENT_CHAT_KEY = useMemo(() => getCurrentChatKey(user?.id), [user?.id]);
  
  
  /**
   * Load chats from localStorage
   */
  const loadChats = useCallback(() => {
    try {
      const savedChats = localStorage.getItem(STORAGE_KEY);
      const savedCurrentChat = localStorage.getItem(CURRENT_CHAT_KEY);
      
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats);
        
        const currentChat = savedCurrentChat 
          ? parsedChats.find(c => c.id === savedCurrentChat)
          : parsedChats[0];

        if (currentChat) {
          setCurrentChatId(currentChat.id);
          setMessages(currentChat.messages || []);
        }
      } else {
        // Reset state if no saved chats (e.g. new user)
        setChats([]);
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }, [STORAGE_KEY, CURRENT_CHAT_KEY]);

  /**
   * Save chats to localStorage
   */
  const saveChats = useCallback((updatedChats) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  }, [STORAGE_KEY]);

  /**
   * Sync chats with backend
   */
  const syncWithBackend = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch all sessions (headers will include token if available)
      const response = await fetch('/api/chat/history', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.history && data.history.length > 0) {
          setChats(data.history);
          saveChats(data.history); // Update local cache
          
          // If no current chat or current chat not in history, switch to most recent
          const currentInHistory = data.history.find(c => c.id === currentChatId);
          if (!currentChatId || !currentInHistory) {
            const mostRecent = data.history[0];
            setCurrentChatId(mostRecent.id);
            setMessages(mostRecent.messages || []);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing with backend:', error);
    }
  }, [user, saveChats]); // Removed currentChatId from dependencies to prevent unintended syncs on switch
  
  /**
   * Save chats to localStorage
   */

  // Initialize socket on mount
  useEffect(() => {
    const socket = initializeSocket();
    
    socket.on('connect', () => {
      console.log('Socket connected');
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    // Initial load and sync
    loadChats();
    if (user) {
      syncWithBackend();
    }

    return () => {
      // Cleanup handled by socket manager
    };
  }, [user?.id, isAuthenticated]); // Only reload when user identity changes or authentication status changes
  
  /**
   * Create new chat
   */
  const createNewChat = useCallback(() => {
    const newId = generateId();
    const newChat = {
      id: newId,
      title: 'New Chat',
      messages: [],
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    };
    
    setChats(prev => {
      const updated = [newChat, ...prev];
      saveChats(updated);
      return updated;
    });
    
    setCurrentChatId(newId);
    setMessages([]);
    localStorage.setItem(CURRENT_CHAT_KEY, newId);
    setError(null);
    
    return newId;
  }, [saveChats, CURRENT_CHAT_KEY]);
  
  /**
   * Switch to different chat
   */
  const switchChat = useCallback((chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages || []);
      localStorage.setItem(CURRENT_CHAT_KEY, chatId);
    }
  }, [chats, CURRENT_CHAT_KEY]);
  
  /**
   * Delete chat
   */
  const deleteChat = useCallback(async (chatId) => {
    try {
      // Call backend to delete
      const response = await fetch(`/api/chat/history/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        setChats(prev => {
          const updated = prev.filter(c => c.id !== chatId);
          saveChats(updated);
          return updated;
        });
        
        if (currentChatId === chatId) {
          const remaining = chats.filter(c => c.id !== chatId);
          if (remaining.length > 0) {
            switchChat(remaining[0].id);
          } else {
            createNewChat();
          }
        }
      } else {
        console.error('Failed to delete chat from backend');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }, [chats, currentChatId, switchChat, createNewChat, saveChats]);
  
  /**
   * Send message
   */
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;
    
    const userMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: getTimestamp(),
    };
    
    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setStreamingText('');
    streamingTextRef.current = '';
    
    try {
      // Initialize socket if needed
      let socket = getSocket();
      if (!socket) {
        socket = initializeSocket();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Set up listeners
      const handleStreaming = (data) => {
        if (data.text) {
          streamingTextRef.current += data.text;
          setStreamingText(streamingTextRef.current);
        }
      };
      
      const handleComplete = (data) => {
        cleanup();
        
        const aiMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.answer || streamingTextRef.current,
          citations: data.citations || [],
          confidence: data.confidence || 0,
          timestamp: getTimestamp(),
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setStreamingText('');
        streamingTextRef.current = '';
        setIsTyping(false);
        
        // Update chat in list
        updateChatWithMessages([userMessage, aiMessage]);
      };
      
      const handleError = (data) => {
        cleanup();
        setIsLoading(false);
        setIsTyping(false);
        const errorMsg = data.error || 'Failed to get response';
        setError(errorMsg);
        
        const errorMessage = {
          id: generateId(),
          role: 'assistant',
          content: 'I encountered an error: ' + errorMsg + '. Please check your API quota or network connection.',
          isError: true,
          timestamp: getTimestamp(),
        };
        
        setMessages(prev => [...prev, errorMessage]);
      };
      
      const handleTyping = (data) => {
        setIsTyping(data.isTyping);
      };
      
      const cleanup = () => {
        const s = getSocket();
        if (s) {
          s.off('chat:streaming', handleStreaming);
          s.off('chat:complete', handleComplete);
          s.off('chat:error', handleError);
          s.off('chat:typing', handleTyping);
        }
      };
      
      socket.on('chat:streaming', handleStreaming);
      socket.on('chat:complete', handleComplete);
      socket.on('chat:error', handleError);
      socket.on('chat:typing', handleTyping);
      
      // Send message
socket.emit('chat:message', {
        query: content,
        sessionId: currentChatId || 'default',
        language: localStorage.getItem('language') || 'en',
        token: sessionStorage.getItem('authToken')
      });
      
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message');
      
      const errorMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'I encountered an error: ' + (err.message || 'Unknown error') + '. Please try again.',
        isError: true,
        timestamp: getTimestamp(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [isLoading, currentChatId]);
  
  /**
   * Update chat with new messages
   */
  const updateChatWithMessages = useCallback((newMessages) => {
    setChats(prev => {
      const updated = prev.map(chat => {
        if (chat.id === currentChatId) {
          // Update title if first message
          let title = chat.title;
          if (title === 'New Chat' && newMessages.length > 0) {
            const userMsg = newMessages.find(m => m.role === 'user');
            if (userMsg) {
              title = userMsg.content.slice(0, 30) + (userMsg.content.length > 30 ? '...' : '');
            }
          }
          
          return {
            ...chat,
            title,
            messages: [...(chat.messages || []), ...newMessages],
            updatedAt: getTimestamp(),
          };
        }
        return chat;
      });
      
      saveChats(updated);
      return updated;
    });
  }, [currentChatId, saveChats]);
  
  /**
   * Clear current chat
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    
    setChats(prev => {
      const updated = prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            title: 'New Chat',
            messages: [],
            updatedAt: getTimestamp(),
          };
        }
        return chat;
      });
      
      saveChats(updated);
      return updated;
    });
  }, [currentChatId, saveChats]);

  /**
   * Clear all history from backend and local
   */
  const clearAllHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/clear-all', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        setChats([]);
        setMessages([]);
        setCurrentChatId(null);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CURRENT_CHAT_KEY);
        createNewChat();
      }
    } catch (error) {
      console.error('Error clearing all history:', error);
    }
  }, [STORAGE_KEY, CURRENT_CHAT_KEY, createNewChat]);
  
  return {
    messages,
    isLoading,
    isTyping,
    streamingText,
    chats,
    currentChatId,
    error,
    createNewChat,
    switchChat,
    deleteChat,
    sendMessage,
    clearChat,
    clearAllHistory,
  };
};

export default useChat;

