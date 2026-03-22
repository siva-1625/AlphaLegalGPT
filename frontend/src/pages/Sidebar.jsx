import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FiPlus, 
  FiMessageSquare, 
  FiSettings, 
  FiTrash2,
  FiGlobe,
  FiUser,
  FiLogOut
} from 'react-icons/fi';
import { FaGavel } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ 
  chats, 
  currentChatId, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  language,
  onLanguageChange,
  onSettingsClick 
}) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: 'en', name: 'English', label: 'EN' },
    { code: 'ta', name: 'தமிழ்', label: 'TA' },
  ];

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed left-0 top-0 h-full w-[260px] bg-sidebar border-r border-border flex flex-col z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <FaGavel className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">{t('appName')}</h1>
            <p className="text-xs text-text-secondary">{t('appSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          {t('newChat')}
        </motion.button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider px-2 py-2">
          {t('chatHistory')}
        </div>
        
        {chats.length === 0 ? (
          <div className="text-sm text-text-secondary px-2 py-4 text-center">
            {t('noChats')}
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  currentChatId === chat.id 
                    ? 'bg-hover-bg active' 
                    : 'hover:bg-hover-bg'
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FiMessageSquare className="w-4 h-4 text-text-secondary flex-shrink-0" />
                  <span className="text-sm text-text-primary truncate">
                    {chat.title}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all"
                >
                  <FiTrash2 className="w-4 h-4 text-red-400" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border relative" ref={menuRef}>
        {/* Language Toggle - Redesigned as a Segmented Control */}
        <div className="mb-4 px-1">
          <div className="bg-hover-bg/30 p-1 rounded-xl flex items-center relative h-11 border border-border/50">
            {/* Animated Slider */}
            <motion.div
              initial={false}
              animate={{
                x: language === 'en' ? 0 : '100%'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-accent rounded-lg shadow-lg z-0"
            />
            
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-1.5 transition-colors duration-200 ${
                  language === lang.code ? 'text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="text-sm font-bold">{lang.label}</span>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  {lang.code === 'en' ? 'English' : 'தமிழ்'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* User Dropdown Menu */}
        <AnimatePresence>
          {isUserMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-16 left-3 right-3 bg-sidebar border border-border shadow-2xl rounded-xl overflow-hidden z-50 flex flex-col"
            >
              {/* User Details */}
              <div className="px-4 py-3 border-b border-border bg-hover-bg/50">
                <p className="text-sm font-semibold text-text-primary capitalize truncate">
                  {user?.name || "Alpha User"}
                </p>
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  {user?.email || "user@alphalegal.com"}
                </p>
              </div>

              {/* Balance Placeholder removed per user request */}

              {/* Action Buttons */}
              <div className="p-1.5 flex flex-col">
                <button 
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onSettingsClick();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-hover-bg rounded-lg transition-colors text-text-secondary hover:text-text-primary text-sm"
                >
                  <FiSettings className="w-4 h-4 flex-shrink-0" />
                  <span>{t('settings')}</span>
                </button>
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-hover-bg rounded-lg transition-colors text-red-500 hover:text-red-400 text-sm"
                >
                  <FiLogOut className="w-4 h-4 flex-shrink-0" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Trigger Button */}
        <button 
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isUserMenuOpen ? 'bg-hover-bg text-text-primary' : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <FiUser className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm font-medium truncate capitalize">{user?.name || "User"}</span>
          </div>
          <svg className={`w-4 h-4 flex-shrink-0 text-text-secondary transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
