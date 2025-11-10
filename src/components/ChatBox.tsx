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
  onSyncCallLogs?: (passcode: string) => Promise<void>;
  isSyncing?: boolean;
  syncProgress?: number;
  syncStatus?: string;
  syncResults?: {
    matched: number;
    updated: number;
    errors: number;
    totalCallLogsAdded: number;
  } | null;
}

const ChatBox: React.FC<ChatBoxProps> = ({ 
  merchants, 
  isOpen, 
  onClose, 
  onSyncCallLogs,
  isSyncing = false,
  syncProgress = 0,
  syncStatus = '',
  syncResults = null,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Merchants AI Assistance. I can help you analyze merchant data and provide insights. Ask me anything about your merchants, interactions, trends, or statistics!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsPasscode, setNeedsPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const passcodeInputRef = useRef<HTMLInputElement>(null);

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

  // Reset passcode input when sync completes
  useEffect(() => {
    if (syncResults && !isSyncing) {
      setNeedsPasscode(false);
      setPasscode('');
      setPasscodeError('');
    }
  }, [syncResults, isSyncing]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history (exclude the initial greeting message and current message)
      const conversationHistory = messages
        .filter(msg => msg.id !== '1') // Exclude initial greeting
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // Check if user is asking to sync call logs - more flexible detection
      const syncKeywords = ['sync', 'đồng bộ', 'cập nhật', 'update', 'refresh', 'tải lại', 'đồng bộ lại', 'bắt đầu sync', 'bảo'];
      const callLogKeywords = ['call log', 'call logs', 'lịch sử cuộc gọi', 'cuộc gọi', 'call', 'logs'];
      const inputLower = currentInput.toLowerCase().trim();
      
      // Check for various sync request patterns
      // Pattern 1: Direct request: "sync call logs", "đồng bộ call logs"
      // Pattern 2: With agent: "agent sync call logs", "bảo agent sync call logs"
      // Pattern 3: With "toàn bộ": "sync toàn bộ call log", "agent sync toàn bộ call log"
      // Pattern 4: Just "sync call log" or "sync logs"
      const hasSyncKeyword = syncKeywords.some(keyword => inputLower.includes(keyword));
      const hasCallLogKeyword = callLogKeywords.some(keyword => inputLower.includes(keyword));
      const hasAgentKeyword = inputLower.includes('agent');
      const hasToanBoKeyword = inputLower.includes('toàn bộ') || inputLower.includes('all');
      
      // More permissive detection:
      // - If contains "sync" and "call log" (or just "log" if also has "call")
      // - If contains "agent", "sync", and any call log keyword
      // - If contains "toàn bộ" and "sync" and call log keyword
      // - If contains "bảo agent sync" and call log keyword
      const hasSyncAndCallLog = hasSyncKeyword && (hasCallLogKeyword || (inputLower.includes('call') && inputLower.includes('log')));
      const hasAgentSync = hasAgentKeyword && hasSyncKeyword && (hasCallLogKeyword || inputLower.includes('call') || inputLower.includes('log'));
      const hasToanBoSync = hasToanBoKeyword && hasSyncKeyword && (hasCallLogKeyword || inputLower.includes('call') || inputLower.includes('log'));
      
      const isSyncRequest = hasSyncAndCallLog || hasAgentSync || hasToanBoSync;

      if (isSyncRequest && onSyncCallLogs) {
        // Request passcode for sync
        setNeedsPasscode(true);
        setPasscode('');
        setPasscodeError('');
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Để đồng bộ call logs, vui lòng nhập authentication code:',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setTimeout(() => {
          passcodeInputRef.current?.focus();
        }, 100);
      } else {
        const response = await apiService.getAIInsight(currentInput, merchants, conversationHistory);
        const insight = response.insight || 'I apologize, but I couldn\'t generate an insight at this time.';
        
        // Check if AI response suggests syncing or contains trigger phrases
        const insightLower = insight.toLowerCase();
        const syncTriggerPhrases = [
          'i\'ll help you sync',
          'sync the call logs',
          'bắt đầu sync',
          'đồng bộ call logs',
          'trigger the sync',
          'start syncing',
          'sync process will start'
        ];
        const shouldSync = syncTriggerPhrases.some(phrase => insightLower.includes(phrase)) ||
                          ((insightLower.includes('sync') || insightLower.includes('đồng bộ')) && 
                           (insightLower.includes('call log') || insightLower.includes('call logs')));
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: insight,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // If AI suggests syncing and we have the function, request passcode
        if (shouldSync && onSyncCallLogs) {
          setTimeout(() => {
            setNeedsPasscode(true);
            setPasscode('');
            setPasscodeError('');
            const passcodeMessage: Message = {
              id: (Date.now() + 2).toString(),
              role: 'assistant',
              content: 'Để đồng bộ call logs, vui lòng nhập authentication code:',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, passcodeMessage]);
            setTimeout(() => {
              passcodeInputRef.current?.focus();
            }, 100);
          }, 1000);
        }
      }
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
      if (needsPasscode) {
        handlePasscodeSubmit();
      } else {
        handleSend();
      }
    }
  };

  const handlePasscodeSubmit = async () => {
    if (!passcode.trim() || !onSyncCallLogs) return;

    try {
      setPasscodeError('');
      await onSyncCallLogs(passcode.trim());
      setNeedsPasscode(false);
      setPasscode('');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Invalid authentication code';
      setPasscodeError(errorMsg);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ ${errorMsg}. Vui lòng thử lại.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handlePasscodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePasscodeSubmit();
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
      // Build conversation history (exclude the initial greeting message and current message)
      const conversationHistory = messages
        .filter(msg => msg.id !== '1') // Exclude initial greeting
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // Check if question is about syncing call logs - more flexible detection
      const syncKeywords = ['sync', 'đồng bộ', 'cập nhật', 'update', 'refresh', 'tải lại', 'đồng bộ lại', 'bắt đầu sync', 'bảo'];
      const callLogKeywords = ['call log', 'call logs', 'lịch sử cuộc gọi', 'cuộc gọi', 'call', 'logs'];
      const questionLower = question.toLowerCase().trim();
      
      // Check for various sync request patterns
      const hasSyncKeyword = syncKeywords.some(keyword => questionLower.includes(keyword));
      const hasCallLogKeyword = callLogKeywords.some(keyword => questionLower.includes(keyword));
      const hasAgentKeyword = questionLower.includes('agent');
      const hasToanBoKeyword = questionLower.includes('toàn bộ') || questionLower.includes('all');
      
      // More permissive detection
      const hasSyncAndCallLog = hasSyncKeyword && (hasCallLogKeyword || (questionLower.includes('call') && questionLower.includes('log')));
      const hasAgentSync = hasAgentKeyword && hasSyncKeyword && (hasCallLogKeyword || questionLower.includes('call') || questionLower.includes('log'));
      const hasToanBoSync = hasToanBoKeyword && hasSyncKeyword && (hasCallLogKeyword || questionLower.includes('call') || questionLower.includes('log'));
      
      const isSyncRequest = hasSyncAndCallLog || hasAgentSync || hasToanBoSync;

      if (isSyncRequest && onSyncCallLogs) {
        // Request passcode for sync
        setNeedsPasscode(true);
        setPasscode('');
        setPasscodeError('');
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Để đồng bộ call logs, vui lòng nhập authentication code:',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setTimeout(() => {
          passcodeInputRef.current?.focus();
        }, 100);
      } else {
        const response = await apiService.getAIInsight(question, merchants, conversationHistory);
        const insight = response.insight || 'I apologize, but I couldn\'t generate an insight at this time.';
        
        // Check if AI response suggests syncing or contains trigger phrases
        const insightLower = insight.toLowerCase();
        const syncTriggerPhrases = [
          'i\'ll help you sync',
          'sync the call logs',
          'bắt đầu sync',
          'đồng bộ call logs',
          'trigger the sync',
          'start syncing',
          'sync process will start'
        ];
        const shouldSync = syncTriggerPhrases.some(phrase => insightLower.includes(phrase)) ||
                          ((insightLower.includes('sync') || insightLower.includes('đồng bộ')) && 
                           (insightLower.includes('call log') || insightLower.includes('call logs')));
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: insight,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // If AI suggests syncing and we have the function, request passcode
        if (shouldSync && onSyncCallLogs) {
          setTimeout(() => {
            setNeedsPasscode(true);
            setPasscode('');
            setPasscodeError('');
            const passcodeMessage: Message = {
              id: (Date.now() + 2).toString(),
              role: 'assistant',
              content: 'Để đồng bộ call logs, vui lòng nhập authentication code:',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, passcodeMessage]);
            setTimeout(() => {
              passcodeInputRef.current?.focus();
            }, 100);
          }, 1000);
        }
      }
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
              <h3>Merchants AI Assistance</h3>
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
          {/* Sync Progress Display */}
          {isSyncing && (
            <div className="chatbox-sync-progress">
              <div className="sync-progress-header">
                <span className="sync-progress-icon">🔄</span>
                <span className="sync-progress-text">{syncStatus || 'Đang đồng bộ call logs...'}</span>
                <span className="sync-progress-percent">{syncProgress}%</span>
              </div>
              <div className="sync-progress-bar-container">
                <div 
                  className="sync-progress-bar-fill" 
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Sync Results Display */}
          {syncResults && !isSyncing && (
            <div className="chatbox-sync-results">
              <div className="sync-results-header">
                <span className="sync-results-icon">✅</span>
                <span className="sync-results-title">Đồng bộ hoàn thành!</span>
              </div>
              <div className="sync-results-content">
                <div className="sync-result-item">
                  <span className="sync-result-label">Matched:</span>
                  <span className="sync-result-value">{syncResults.matched}</span>
                </div>
                <div className="sync-result-item">
                  <span className="sync-result-label">Updated:</span>
                  <span className="sync-result-value">{syncResults.updated}</span>
                </div>
                <div className="sync-result-item">
                  <span className="sync-result-label">Call Logs Added:</span>
                  <span className="sync-result-value success">{syncResults.totalCallLogsAdded}</span>
                </div>
                {syncResults.errors > 0 && (
                  <div className="sync-result-item">
                    <span className="sync-result-label">Errors:</span>
                    <span className="sync-result-value error">{syncResults.errors}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && !needsPasscode && !isSyncing && (
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

        {/* Passcode Input */}
        {needsPasscode && !isSyncing && (
          <div className="chatbox-passcode-container">
            <div className="chatbox-passcode-input-wrapper">
              <input
                ref={passcodeInputRef}
                type="password"
                className="chatbox-passcode-input"
                placeholder="Nhập authentication code..."
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPasscodeError('');
                }}
                onKeyPress={handlePasscodeKeyPress}
                disabled={isLoading}
              />
              <button
                className="chatbox-passcode-submit"
                onClick={handlePasscodeSubmit}
                disabled={!passcode.trim() || isLoading}
                aria-label="Submit passcode"
              >
                <span>✓</span>
              </button>
            </div>
            {passcodeError && (
              <div className="chatbox-passcode-error">{passcodeError}</div>
            )}
          </div>
        )}

        {/* Regular Input */}
        {!needsPasscode && (
          <div className="chatbox-input-container">
            <input
              ref={inputRef}
              type="text"
              className="chatbox-input"
              placeholder="Ask me anything about your merchant data..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isSyncing}
            />
            <button
              className="chatbox-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isSyncing}
              aria-label="Send message"
            >
              <span>➤</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBox;

