import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMoon, FiSun, FiLogOut, FiDatabase, FiTrash2, FiDownload, FiAlertCircle, FiZap, FiLink, FiGlobe, FiType, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [realtime, setRealtime] = useState(localStorage.getItem('realtime') !== 'off');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [textSize, setTextSize] = useState(localStorage.getItem('textSize') || 'medium');

  // Apply theme on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Toggle theme
  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Toggle Real-time responses
  const handleRealtimeToggle = () => {
    const newRealtime = !realtime;
    setRealtime(newRealtime);
    localStorage.setItem('realtime', newRealtime ? 'on' : 'off');
  };

  // Toggle Language
  const handleLanguageToggle = () => {
    const newLang = language === 'en' ? 'ta' : 'en';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    window.location.reload(); // Reload to apply language globally
  };

  // Cycle Text Size
  const handleTextSizeCycle = () => {
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(textSize);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];
    setTextSize(nextSize);
    localStorage.setItem('textSize', nextSize);
    
    // Apply text size to root element
    if (nextSize === 'small') document.documentElement.style.fontSize = '14px';
    if (nextSize === 'medium') document.documentElement.style.fontSize = '16px';
    if (nextSize === 'large') document.documentElement.style.fontSize = '18px';
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-sidebar border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-xl font-medium text-text-primary">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-hover-bg rounded-full transition-colors text-text-secondary hover:text-text-primary"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(90vh-140px)]">
            
            <div className="px-2 pb-4 pt-2">
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xl font-bold">
                   {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-base font-medium text-text-primary">{user?.name || 'Alpha Legal User'}</span>
                    <span className="text-sm text-text-secondary">{user?.email || ''}</span>
                 </div>
               </div>
            </div>

            <hr className="border-border my-2" />

            {/* Menu Items */}
            <div className="flex flex-col gap-1 pt-2">
              <button 
                onClick={handleThemeToggle}
                className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-hover-bg rounded-lg transition-colors"
               >
                 <div className="flex items-center gap-4 text-text-primary">
                    {theme === 'dark' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
                    <span className="text-[15px]">Dark theme</span>
                 </div>
                 <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-accent' : 'bg-border'}`}>
                    <div className={`absolute top-[2px] w-4 h-4 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-[22px]' : 'left-[2px]'}`}></div>
                 </div>
              </button>

              <button 
                onClick={handleRealtimeToggle}
                className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-hover-bg rounded-lg transition-colors"
               >
                 <div className="flex items-center gap-4 text-text-primary">
                    <FiZap className="w-5 h-5" />
                    <span className="text-[15px]">Real-time responses</span>
                 </div>
                 <div className={`w-10 h-5 rounded-full relative transition-colors ${realtime ? 'bg-accent' : 'bg-border'}`}>
                    <div className={`absolute top-[2px] w-4 h-4 bg-white rounded-full transition-all ${realtime ? 'left-[22px]' : 'left-[2px]'}`}></div>
                 </div>
              </button>

              <button 
                onClick={handleLanguageToggle}
                className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-hover-bg rounded-lg transition-colors"
               >
                 <div className="flex items-center gap-4 text-text-primary">
                    <FiGlobe className="w-5 h-5" />
                    <span className="text-[15px]">Primary Language</span>
                 </div>
                 <div className="text-xs font-semibold px-2 py-1 bg-border rounded-md text-text-secondary">
                    {language === 'en' ? 'English' : 'Tamil'}
                 </div>
              </button>

              <button 
                onClick={handleTextSizeCycle}
                className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-hover-bg rounded-lg transition-colors"
               >
                 <div className="flex items-center gap-4 text-text-primary">
                    <FiType className="w-5 h-5" />
                    <span className="text-[15px]">Reading Text Size</span>
                 </div>
                 <div className="text-xs font-semibold px-2 py-1 bg-border rounded-md text-text-secondary capitalize">
                    {textSize}
                 </div>
              </button>

              <button 
                 onClick={() => alert("Chat history export feature coming soon!")}
                 className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-hover-bg rounded-lg transition-colors">
                 <div className="flex items-center gap-4 text-text-primary">
                    <FiDownload className="w-5 h-5" />
                    <span className="text-[15px]">Export current chat</span>
                 </div>
              </button>

              <button 
                 onClick={() => {
                   if(window.confirm("Are you sure you want to clear all your chat data?")) {
                     localStorage.removeItem('attorneygpt_chats');
                     localStorage.removeItem('attorneygpt_current_chat');
                     alert("Chat data cleared! Please refresh the page.");
                     window.location.reload();
                   }
                 }}
                 className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-red-500/10 rounded-lg transition-colors group">
                 <div className="flex items-center gap-4 text-text-primary group-hover:text-red-500 transition-colors">
                    <FiTrash2 className="w-5 h-5" />
                    <span className="text-[15px]">Clear all chat history</span>
                 </div>
              </button>

              <button 
                 onClick={() => alert("AI LegalGPT is an AI assistant, not a substitute for professional legal advice.")}
                 className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-hover-bg rounded-lg transition-colors">
                 <div className="flex items-center gap-4 text-text-primary">
                    <FiAlertCircle className="w-5 h-5" />
                    <span className="text-[15px]">Legal Disclaimer</span>
                 </div>
              </button>

              <button 
                 onClick={() => window.open("mailto:support@alphalegal.com", "_blank")}
                 className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-hover-bg rounded-lg transition-colors">
                 <div className="flex items-center gap-4 text-text-primary">
                    <FiMessageSquare className="w-5 h-5" />
                    <span className="text-[15px]">Contact Support & Feedback</span>
                 </div>
              </button>

              <button className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-hover-bg rounded-lg transition-colors">
                 <div className="flex items-center gap-4 text-text-primary">
                    <FiDatabase className="w-5 h-5" />
                    <span className="text-[15px]">Your data in AlphaLegal</span>
                 </div>
              </button>
            </div>
          </div>

          <hr className="border-border" />

          {/* Footer - Logout Activity */}
          <div className="flex items-center justify-end px-6 py-4 bg-transparent border-t border-border">
             <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2 text-sm text-text-primary hover:bg-hover-bg rounded-full transition-colors border border-border"
             >
                <FiLogOut className="w-4 h-4" />
                Sign out
             </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsModal;
