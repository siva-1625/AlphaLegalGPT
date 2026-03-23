import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FiSend, 
  FiMic, 
  FiFile as FiFileIcon, 
  FiX,
  FiMapPin as FiMapPinIcon
} from 'react-icons/fi';
import { uploadDocument } from '../services/api';

const ChatInput = ({ value: message, onChange: setMessage, onSendMessage, isLoading, disabled, isLocationEnabled, isLocationLoading, onLocationToggle }) => {
  const { t } = useTranslation();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage((prev) => prev ? prev + ' ' + transcript : transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [setMessage]);

  const toggleRecording = () => {
    if (disabled) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        // Use selected language for speech recognition
        const lang = localStorage.getItem('language') === 'ta' ? 'ta-IN' : 'en-US';
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        alert('Speech recognition is not supported in this browser.');
      }
    }
  };

  const handleDocumentClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const data = await uploadDocument(file);
      if (data && data.text) {
        const docContext = `\n\n[Attached Document: ${file.name}]\n${data.text}\n`;
        setMessage((prev) => prev + docContext);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to upload document: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      // MainApp handles clearing state
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t border-border p-4"
    >
      <div className="max-w-[900px] mx-auto">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-input-bg rounded-2xl border border-border focus-within:border-accent/50 transition-colors"
        >
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('typeMessage')}
              disabled={disabled}
              rows={1}
              className="w-full bg-transparent px-4 py-3 text-[15px] text-text-primary placeholder:text-text-secondary resize-none disabled:opacity-50"
              style={{ minHeight: '24px', maxHeight: '200px' }}
            />
            
            {/* Clear button */}
            {message && (
              <button
                type="button"
                onClick={() => setMessage('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-hover-bg rounded-full transition-colors"
              >
                <FiX className="w-4 h-4 text-text-secondary" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 pr-2 pb-2">
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.txt" 
              className="hidden" 
            />

            {/* Location Toggle with Status Label */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={onLocationToggle}
                disabled={disabled || isLocationLoading}
                className={`p-2.5 rounded-xl transition-colors ${
                  isLocationEnabled ? 'text-accent bg-accent/10 border border-accent/20' : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={t('locationAccess')}
              >
                {isLocationLoading ? (
                  <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                ) : (
                  <FiMapPinIcon className="w-5 h-5" />
                )}
              </button>
              {isLocationEnabled && !isLocationLoading && (
                <span className="text-[9px] font-bold text-accent uppercase tracking-tighter mt-0.5 animate-pulse">
                  {t('locationOn')}
                </span>
              )}
            </div>

            {/* Voice Input */}
            <button
              type="button"
              onClick={toggleRecording}
              disabled={disabled}
              className={`p-2.5 rounded-xl transition-colors ${
                isRecording ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={t('voiceInput')}
            >
              <FiMic className="w-5 h-5" />
            </button>

            {/* PDF Upload */}
            <button
              type="button"
              onClick={handleDocumentClick}
              disabled={disabled || isUploading}
              className={`p-2.5 rounded-xl transition-colors ${
                isUploading ? 'text-accent animate-pulse' : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={t('pdfUpload')}
            >
              <FiFileIcon className="w-5 h-5" />
            </button>

            {/* Send Button */}
            <motion.button
              type="submit"
              disabled={disabled || !message.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2.5 rounded-xl transition-colors ${
                message.trim() && !disabled
                  ? 'bg-accent text-white hover:bg-accent-hover'
                  : 'bg-hover-bg text-text-secondary'
              } disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiSend className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </form>

        {/* Disclaimer */}
        <p className="text-center text-xs text-text-secondary mt-2">
          {t('legalDisclaimer')}
        </p>
      </div>
    </motion.div>
  );
};

export default ChatInput;
