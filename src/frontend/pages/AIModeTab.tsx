import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../services/AuthService';
import './AIModeTab.css';

// Types
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIModeTabProps {}

interface ChatServiceResponse {
  response: string;
}

/**
 * AI Mode Tab component - Chat interface with GPT integration
 */
const AIModeTab: React.FC<AIModeTabProps> = () => {
  const { authService } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmedInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(trimmedInput);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        showActions: !trimmedInput.toUpperCase().startsWith('REPORT') &&
                     !trimmedInput.startsWith('گزارش')
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleStarterClick = (question: string) => {
    setInputValue(question);
  };

  const sendChatMessage = async (message: string): Promise<string> => {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message,
        sensor_context: '',
        ml_status_context: ''
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const data: ChatServiceResponse = await response.json();
    return data.response;
  };

  const getDirection = (text: string): string => {
    // Simple RTL detection - check for Persian/Arabic characters
    const rtlChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlChars.test(text) ? 'rtl' : 'ltr';
  };

  const isRTL = (text: string): boolean => {
    return getDirection(text) === 'rtl';
  };

  const starterQuestions = [
    "Check for any signs of pipeline leakage",
    "Analyze current pressure and flow readings",
    "What maintenance actions are needed?"
  ];

  return (
    <div className="ai-mode-tab">
      <div className="ai-container">
        <div className="chat-container">
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="empty-state">
                <h3>AI Pipeline Inspector</h3>
                <p>Ask me about pipeline conditions, leak detection, sensor analysis, and maintenance recommendations for gas and oil pipelines.</p>
                <div className="starter-questions">
                  {starterQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="starter-question"
                      onClick={() => handleStarterClick(question)}
                      disabled={isLoading}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => {
              const direction = getDirection(message.content);
              const persian = isRTL(message.content);
              return (
                <div key={index} className={`message message-${message.role}`}>
                  <div className="message-content">
                    <div className="message-text" dir={direction}>
                      {message.role === 'assistant' ? (
                        <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }} />
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="message message-assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="input-container" onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <textarea
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about the pipeline system..."
                className="message-input"
                disabled={isLoading}
                rows={1}
              />
              <button
                type="submit"
                className="send-button"
                disabled={isLoading || !inputValue.trim()}
                title="Send message"
              >
                ↑
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIModeTab;
