import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../services/AuthService';
import { X, Send } from 'lucide-react';
import './DefectChatbot.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DefectChatbotProps {
  defectId: string;
  defectType: string;
  location: string;
  severity: string;
  controlSystemSign?: string;
  droneSign?: string;
  onClose: () => void;
}

interface ChatServiceResponse {
  response: string;
}

/**
 * Mini chatbot component for defect-specific recommendations
 */
const DefectChatbot: React.FC<DefectChatbotProps> = ({
  defectId,
  defectType,
  location,
  severity,
  controlSystemSign = "Unknown",
  droneSign = "Unknown",
  onClose
}) => {
  const { authService } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch initial detailed message from backend
  useEffect(() => {
    const fetchInitialMessage = async () => {
      setIsInitializing(true);
      try {
        const token = authService.getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch('/api/chat/initial-defect-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            defect_type: defectType,
            location: location,
            severity: severity,
            control_system_sign: controlSystemSign,
            drone_sign: droneSign
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch initial message');
        }

        const data: ChatServiceResponse = await response.json();
        const initialMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages([initialMessage]);
      } catch (err) {
        console.error('Failed to fetch initial message:', err);
        // Fallback to simple welcome message
        const fallbackMessage: ChatMessage = {
          role: 'assistant',
          content: `I'm here to help with **${defectId}** - ${defectType} at ${location}.\n\nSeverity: **${severity}**\n\nWhat would you like to know about fixing this issue?`,
          timestamp: new Date()
        };
        setMessages([fallbackMessage]);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchInitialMessage();
  }, [defectId, defectType, location, severity, controlSystemSign, droneSign]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // Store the original message for display (without language prefix)
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
      // Send message (sendChatMessage will add language prefix internally)
      const response = await sendChatMessage(trimmedInput);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const sendChatMessage = async (message: string): Promise<string> => {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Send defect information to backend - let backend build the context
    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: message,
        sensor_context: '',
        ml_status_context: '',
        defect_id: defectId,
        defect_type: defectType,
        defect_location: location,
        defect_severity: severity,
        control_system_sign: controlSystemSign,
        drone_sign: droneSign
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const data: ChatServiceResponse = await response.json();
    return data.response;
  };

  const quickQuestions = [
    "What are the step-by-step repair procedures?",
    "What tools and materials do I need?",
    "What safety precautions should I take?",
    "How long will the repair take?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="defect-chatbot-overlay" onClick={onClose}>
      <div className="defect-chatbot-container" onClick={(e) => e.stopPropagation()}>
        <div className="defect-chatbot-header">
          <div className="defect-chatbot-title">
            <span className="chatbot-icon">🤖</span>
            <div>
              <h3>Repair Assistant</h3>
              <p className="defect-info">{defectId} - {defectType}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close chatbot">
            <X size={20} />
          </button>
        </div>

        <div className="defect-chatbot-messages">
          {isInitializing && (
            <div className="chatbot-message chatbot-message-assistant">
              <div className="chatbot-message-content">
                <div className="chatbot-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Loading defect analysis...
                </p>
              </div>
            </div>
          )}

          {!isInitializing && messages.length === 1 && (
            <div className="quick-questions">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {!isInitializing && messages.map((message, index) => (
            <div key={index} className={`chatbot-message chatbot-message-${message.role}`}>
              <div className="chatbot-message-content">
                {message.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chatbot-message chatbot-message-assistant">
              <div className="chatbot-message-content">
                <div className="chatbot-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="chatbot-error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="defect-chatbot-input" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about fixing this defect..."
            className="chatbot-input-field"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="chatbot-send-btn"
            disabled={isLoading || !inputValue.trim()}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DefectChatbot;

