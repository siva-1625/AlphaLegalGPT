import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import { FiBook } from 'react-icons/fi';
import ChatWindow from './ChatWindow';
import ChatInput from '../components/ChatInput';
import SettingsModal from '../components/SettingsModal';
import NearbyOfficesSidebar from '../components/NearbyOfficesSidebar';
import LawReferenceSidebar from '../components/LawReferenceSidebar';
import useChat from '../hooks/useChat';
import { checkHealth } from '../services/api';

function MainApp() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isNearbyOpen, setIsNearbyOpen] = useState(false);
  const [isLawSidebarOpen, setIsLawSidebarOpen] = useState(false);
  const [detectedLaws, setDetectedLaws] = useState([]);

  const {
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
    location,
    isLocationEnabled,
    isLocationLoading,
    toggleLocation,
  } = useChat();

  // Detect laws in the current response
  useEffect(() => {
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || streamingText;
    
    if (lastAssistantMessage) {
      // Robust regex to detect IPC/CrPC/BNSS sections
      // Matches: IPC 420, Section 188, u/s 302, Sec 47, Section 50 of the CrPC
      const regex = /(?:IPC|CrPC|BNSS|Section|Sec|u\/s|S\.)\s*(\d+[A-Z]?)(?:\s*(?:of|in)\s*(?:the\s+)?(?:IPC|CrPC|BNSS))?/gi;
      const matches = [...lastAssistantMessage.matchAll(regex)];
      
      if (matches.length > 0) {
        const sections = [...new Set(matches.map(m => {
          const num = m[1];
          // Try to determine if it's IPC or CrPC from the match, default to IPC
          const type = m[0].toUpperCase().includes('CRPC') ? 'CrPC' : 
                       m[0].toUpperCase().includes('BNSS') ? 'BNSS' : 'IPC';
          return `${type} ${num}`;
        }))];

        setDetectedLaws(prev => {
          if (JSON.stringify(prev) === JSON.stringify(sections)) return prev;
          return sections;
        });
        setIsLawSidebarOpen(true);
      }
    }
    // Note: We don't auto-close here to keep the last detected laws visible
  }, [messages.length, streamingText]);

  // Reset sidebars when a new user message is sent
  useEffect(() => {
    const lastMessage = messages.slice(-1)[0];
    if (lastMessage?.role === 'user') {
      setIsLawSidebarOpen(false);
      setDetectedLaws([]);
    }
  }, [messages.length]);

  // Check backend health on mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const health = await checkHealth();
        setIsConnected(health.status === 'ok');
      } catch (err) {
        setIsConnected(false);
      } finally {
        setIsCheckingHealth(false);
      }
    };

    checkBackendHealth();

    // Recheck every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle language change
  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  // Create initial chat if none exists
  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    }
  }, []);

  // Clear input when switching chats
  useEffect(() => {
    setInputValue('');
  }, [currentChatId]);

  // Auto-open sidebar when location is enabled, close when disabled
  useEffect(() => {
    if (isLocationEnabled) {
      setIsNearbyOpen(true);
    } else {
      setIsNearbyOpen(false);
    }
  }, [isLocationEnabled]);



  // Handle sending message
  const handleSendMessage = async (content) => {
    setInputValue('');
    setIsNearbyOpen(false);
    await sendMessage(content);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={createNewChat}
        onSelectChat={switchChat}
        onDeleteChat={deleteChat}
        language={language}
        onLanguageChange={handleLanguageChange}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onClearAllHistory={clearAllHistory}
      />

      {/* Main Content */}
      <main
        className="flex-1 ml-[260px] flex flex-col h-full transition-all duration-300"
        style={{ marginRight: isNearbyOpen ? '300px' : '0' }}
      >
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-40"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-text-primary">
              {chats.find(c => c.id === currentChatId)?.title || t('appName')}
            </h2>
            {isConnected && (
              <span className="flex items-center gap-1.5 text-xs text-accent bg-accent/10 px-2 py-1 rounded-full">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                {t('connected')}
              </span>
            )}
          </div>

          {/* Connection status */}
          {!isCheckingHealth && !isConnected && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <span className="w-2 h-2 bg-red-400 rounded-full" />
              {t('disconnected')}
            </div>
          )}
        </motion.header>

        {/* Chat Window */}
        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          isLoading={isLoading}
          streamingText={streamingText}
          onExampleClick={setInputValue}
        />

        {/* Chat Input */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={!isConnected || isLoading}
          isLocationEnabled={isLocationEnabled}
          isLocationLoading={isLocationLoading}
          onLocationToggle={toggleLocation}
        />
      </main>

      {/* Law Reference Sidebar - Slides from left */}
      <LawReferenceSidebar
        detectedLaws={detectedLaws}
        isOpen={isLawSidebarOpen}
        onClose={() => setIsLawSidebarOpen(false)}
      />

      {/* Right Nearby Offices Sidebar */}
      <NearbyOfficesSidebar
        query={messages.filter(m => m.role === 'user').slice(-1)[0]?.content || ''}
        response={messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || streamingText}
        location={location}
        isOpen={isNearbyOpen}
        onClose={() => setIsNearbyOpen(false)}
        isLocationEnabled={isLocationEnabled}
      />

      {/* Error Toast */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 right-6 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm max-w-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Floating Toggle for Laws Sidebar (when closed) */}
      {!isLawSidebarOpen && (
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsLawSidebarOpen(true)}
          className="fixed left-0 top-[30%] -translate-y-1/2 z-[90] bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-r-2xl shadow-lg border-y border-r border-white/20 backdrop-blur-sm transition-colors group"
          title={t('openLaws')}
        >
          <FiBook className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-sidebar border border-border rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {t('openLaws')}
          </span>
        </motion.button>
      )}
    </div>
  );
}

export default MainApp;
