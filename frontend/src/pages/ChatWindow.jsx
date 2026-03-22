import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiCpu } from 'react-icons/fi';
import ChatMessage from '../components/ChatMessage';

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex gap-4 mb-6">
    <div className="flex-shrink-0">
      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
        <FiCpu className="w-5 h-5 text-accent" />
      </div>
    </div>
    <div className="flex items-center">
      <div className="bg-ai-message rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-text-secondary rounded-full typing-dot" />
          <div className="w-2 h-2 bg-text-secondary rounded-full typing-dot" />
          <div className="w-2 h-2 bg-text-secondary rounded-full typing-dot" />
        </div>
      </div>
    </div>
  </div>
);

// Welcome screen
const WelcomeScreen = ({ onExampleClick }) => {
  const { t } = useTranslation();
  const [randomExamples, setRandomExamples] = useState([]);

  useEffect(() => {
    const allExamples = t('examples', { returnObjects: true });
    if (Array.isArray(allExamples)) {
      // Create a copy, shuffle, and take first 4 to display randomized dynamic questions
      const shuffled = [...allExamples].sort(() => 0.5 - Math.random());
      setRandomExamples(shuffled.slice(0, 4));
    } else {
      setRandomExamples([]);
    }
  }, [t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      {/* Logo */}
      <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center mb-6">
        <FiCpu className="w-10 h-10 text-accent" />
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-text-primary mb-3">
        {t('welcomeTitle')}
      </h2>

      {/* Description */}
      <p className="text-text-secondary text-lg max-w-lg mb-8">
        {t('welcomeMessage')}
      </p>

      {/* Example Questions */}
      <div className="max-w-lg w-full">
        <p className="text-sm font-medium text-text-secondary mb-4">
          {t('exampleQuestionsText')}
        </p>
        <div className="grid gap-3">
          {randomExamples.map((example, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(45, 45, 45, 0.8)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onExampleClick(example)}
              className="text-left p-4 bg-ai-message hover:bg-hover-bg rounded-xl border border-border transition-colors"
            >
              <span className="text-text-primary">{example}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const ChatWindow = ({ messages, isTyping, isLoading, streamingText, onExampleClick }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto smooth-scroll pb-24">
      <div className="max-w-[900px] mx-auto px-4 pt-6">
        {/* Show welcome screen if no messages */}
        {messages.length === 0 && !streamingText ? (
          <WelcomeScreen onExampleClick={onExampleClick} />
        ) : (
          <div className="stagger-children">
            {/* Messages */}
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={false}
              />
            ))}

            {/* Streaming text */}
            {streamingText && (
              <ChatMessage
                message={{ 
                  id: 'streaming', 
                  role: 'assistant', 
                  content: streamingText,
                  citations: [],
                  confidence: 0
                }}
                isStreaming={true}
              />
            )}

            {/* Typing indicator */}
            {isTyping && !streamingText && (
              <TypingIndicator />
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;

