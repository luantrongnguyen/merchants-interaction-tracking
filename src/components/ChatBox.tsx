import React, { useState, useRef, useEffect } from 'react';
import { MerchantWithStatus } from '../types/merchant';
import apiService from '../services/apiService';
import './ChatBox.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBoxProps {
  merchants: MerchantWithStatus[];
  isOpen: boolean;
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ merchants, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you analyze merchant data and provide insights. Ask me anything about your merchants, interactions, trends, or statistics!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiService.getAIInsight(input.trim(), merchants);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.insight || 'I apologize, but I couldn\'t generate an insight at this time.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI insight:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    'What are the top merchants by interactions?',
    'Show me trends in terminal issues',
    'What are the most common categories?',
    'Give me insights about merchant activity',
  ];

  const handleQuickQuestion = async (question: string) => {
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiService.getAIInsight(question, merchants);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.insight || 'I apologize, but I couldn\'t generate an insight at this time.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI insight:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chatbox-overlay" onClick={onClose}>
      <div className="chatbox-container" onClick={(e) => e.stopPropagation()}>
        <div className="chatbox-header">
          <div className="chatbox-header-content">
            <div className="chatbox-avatar">
              <span role="img" aria-label="AI">🤖</span>
            </div>
            <div className="chatbox-title">
              <h3>AI Assistant</h3>
              <p>Ask me about your merchant data</p>
            </div>
          </div>
          <button className="chatbox-close" onClick={onClose} aria-label="Close chat">
            ×
          </button>
        </div>

        <div className="chatbox-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chatbox-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? (
                  <span role="img" aria-label="User">👤</span>
                ) : (
                  <span role="img" aria-label="AI">🤖</span>
                )}
              </div>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chatbox-message assistant-message">
              <div className="message-avatar">
                <span role="img" aria-label="AI">🤖</span>
              </div>
              <div className="message-content">
                <div className="message-text">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="chatbox-quick-questions">
            <p>Quick questions:</p>
            <div className="quick-questions-list">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chatbox-input-container">
          <input
            ref={inputRef}
            type="text"
            className="chatbox-input"
            placeholder="Ask me anything about your merchant data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            className="chatbox-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <span>➤</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;

