import React from 'react';
import { ChatMessage } from '../types';
import { IChatService, ChatService } from '../services/ChatService';
import { BackendService } from '../services/BackendService';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { TextDirectionDetector } from '../utils/textDirection';
import '../styles/AIModeTab.css';

interface Props {
  isDarkMode: boolean;
}

interface State {
  messages: ChatMessage[];
  inputValue: string;
  isLoading: boolean;
  error: string | null;
}

export class AIModeTab extends React.Component<Props, State> {
  private chatService: IChatService;
  private messagesEndRef: React.RefObject<HTMLDivElement>;

  constructor(props: Props) {
    super(props);
    this.state = {
      messages: [],
      inputValue: '',
      isLoading: false,
      error: null
    };
    
    const backendService = new BackendService();
    this.chatService = new ChatService(backendService);
    this.messagesEndRef = React.createRef();
  }

  componentDidUpdate(_: Props, prevState: State): void {
    if (prevState.messages.length !== this.state.messages.length) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    this.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  private handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    this.setState({ inputValue: e.target.value });
  };

  private handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    const { inputValue, messages } = this.state;
    if (!inputValue.trim() || this.state.isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    this.setState({
      messages: [...messages, userMessage],
      inputValue: '',
      isLoading: true,
      error: null
    });

    try {
      const response = await this.chatService.sendMessage(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        showActions: !userMessage.content.trim().toUpperCase().startsWith('REPORT') && 
                     !userMessage.content.trim().startsWith('گزارش')
      };

      this.setState(prev => ({
        messages: [...prev.messages, assistantMessage],
        isLoading: false
      }));
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to get response',
        isLoading: false
      });
    }
  };

  private handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSubmit(e);
    }
  };

  private handleStarterClick = (question: string): void => {
    this.setState({ inputValue: question });
  };

  private handleActionClick = async (action: 'report' | 'summary', isPersian: boolean = false): Promise<void> => {
    if (this.state.isLoading) return;

    const message = action === 'report'
      ? (isPersian ? 'گزارش کامل' : 'REPORT MODE')
      : (isPersian ? 'پاسخ قبلی را به طور خلاصه خلاصه کن' : 'Summarize the previous response briefly');

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    this.setState({
      messages: [...this.state.messages, userMessage],
      isLoading: true,
      error: null
    });

    try {
      const response = await this.chatService.sendMessage(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        showActions: action === 'report' ? false : true
      };

      this.setState(prev => ({
        messages: [...prev.messages, assistantMessage],
        isLoading: false
      }));
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to get response',
        isLoading: false
      });
    }
  };

  render() {
    const { messages, inputValue, isLoading, error } = this.state;

    const starterQuestions = [
      "What's the current system status?",
      "Generate maintenance report",
      "Explain the sensor readings"
    ];

    return (
      <div className="ai-mode-tab">
        <div className="ai-container">
          <div className="chat-container">
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="empty-state">
                <h3>AI Assistant for pump PDM Analysis</h3>
                <p>Ask about anomalies, warnings, RUL estimation, or maintenance actions based on live sensor data.</p>
                <div className="starter-questions">
                  {starterQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="starter-question"
                      onClick={() => this.handleStarterClick(question)}
                      disabled={isLoading}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => {
              const direction = TextDirectionDetector.getDirection(message.content);
              const isPersian = TextDirectionDetector.isRTL(message.content);
              return (
                <div key={index} className={`message message-${message.role}`}>
                  <div className="message-content">
                    <div className="message-text" dir={direction}>
                      {message.role === 'assistant' ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        message.content
                      )}
                    </div>
                    {message.role === 'assistant' && message.showActions && (
                      <div className="message-actions" dir={direction}>
                        <button
                          className="action-button"
                          onClick={() => this.handleActionClick('report', isPersian)}
                          disabled={isLoading}
                        >
                          {isPersian ? 'گزارش کامل' : 'Full Report'}
                        </button>
                        <button
                          className="action-button"
                          onClick={() => this.handleActionClick('summary', isPersian)}
                          disabled={isLoading}
                        >
                          {isPersian ? 'خلاصه' : 'Summary'}
                        </button>
                      </div>
                    )}
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

            <div ref={this.messagesEndRef} />
          </div>

          <form className="input-container" onSubmit={this.handleSubmit}>
            <div className="input-wrapper">
              <textarea
                value={inputValue}
                onChange={this.handleInputChange}
                onKeyDown={this.handleKeyDown}
                placeholder="Ask anything"
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
  }
}
