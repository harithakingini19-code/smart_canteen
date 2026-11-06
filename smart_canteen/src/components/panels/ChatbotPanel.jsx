import React, { useState, useEffect, useRef } from 'react';
import './panels.css';
import './ChatbotPanel.css';
import { useAuth } from '../../context/AuthContext';
import { sendChatMessage, getChatbotInfo } from '../../services/chatbot';
import { getErrorMessage } from '../../services/api';

/**
 * Sprint 6: AI Chatbot Support (PB-06)
 * Real-time AI Assistant for food items, prices, orders, payments, and pickup status.
 */
export default function ChatbotPanel({
  onClose,
  onOpenOrders,
  onOpenQueue,
  onNavigateToLogin,
}) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'What food is available today?',
    'Show menu prices',
    'Show my recent orders',
    'When will my order be ready for pickup?',
  ]);
  const [apiError, setApiError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial welcome greeting on mount
  useEffect(() => {
    async function initChatbot() {
      try {
        const info = await getChatbotInfo();
        const initialText =
          info.greeting ||
          (isAuthenticated
            ? `Hello ${user?.first_name || user?.username || 'there'}! 👋 How can I assist you with your canteen orders or menu today?`
            : 'Hello! 👋 Welcome to Smart Canteen AI Assistant. How can I assist you with our food menu, prices, or orders today?');

        setMessages([
          {
            id: 'welcome-1',
            sender: 'bot',
            text: initialText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        if (info.suggestions && info.suggestions.length > 0) {
          setSuggestions(info.suggestions);
        }
      } catch (err) {
        // Fallback welcome message if backend offline
        setMessages([
          {
            id: 'welcome-fallback',
            sender: 'bot',
            text:
              'Hello! 👋 I am your Smart Canteen AI Assistant. Ask me about available food items, prices, orders, or pickup status!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }

    initChatbot();
    // Focus input on open
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [isAuthenticated, user]);

  const handleSend = async (textToSend) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text || isLoading) return;

    setApiError('');
    const userMsgId = 'user-' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: text,
        timestamp: timeStr,
      },
    ];

    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Build lightweight conversation history for backend context
      const historyPayload = newMessages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await sendChatMessage(text, historyPayload);

      const botReply = res.reply || 'I am ready to help. Please ask another question!';
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setApiError(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-err-' + Date.now(),
          sender: 'bot',
          text: `⚠ Error connecting to server: ${errMsg}. Please ensure the backend is running.`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'reset-1',
        sender: 'bot',
        text: 'Chat history cleared. How else can I assist you with the Smart Canteen?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  /**
   * Simple markdown-like text parser for bold, italic, code, and bullet lists.
   */
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '8px' }} />;
      }

      // Parse bold **text** and code `text`
      const parts = line.split(/(\*\*.*?\*\*|`.*?`|_.*?_)/g);
      const parsedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={pIdx}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('_') && part.endsWith('_')) {
          return <em key={pIdx}>{part.slice(1, -1)}</em>;
        }
        return part;
      });

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={idx} style={{ paddingLeft: '8px', marginBottom: '4px' }}>
            {parsedParts}
          </div>
        );
      }

      return (
        <div key={idx} style={{ marginBottom: '4px' }}>
          {parsedParts}
        </div>
      );
    });
  };

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer chatbot-drawer" style={{ width: '100%', maxWidth: '480px' }}>
        {/* ── Header ── */}
        <div className="panel-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">🤖</div>
            <div className="chatbot-title-box">
              <h2 className="chatbot-title">Smart Canteen AI</h2>
              <span className="chatbot-status">
                <span className="chatbot-status-dot"></span>
                Online • Real-time DB Support
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="panel-btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 10px' }}
              onClick={handleClearChat}
              title="Clear chat messages"
            >
              🗑️ Clear
            </button>
            <button className="panel-close-btn" onClick={onClose} title="Close Chatbot">
              ✕
            </button>
          </div>
        </div>

        {/* ── Messages Container ── */}
        <div className="chatbot-messages-container">
          {/* Welcome Info Box */}
          <div className="chatbot-welcome-card">
            <div className="chatbot-welcome-title">💡 What can you ask me?</div>
            <div>
              • <strong>Menu &amp; Availability:</strong> &ldquo;Is dosa available?&rdquo;, &ldquo;Show vegetarian items&rdquo;
              <br />
              • <strong>Prices:</strong> &ldquo;What is the price of a burger?&rdquo;, &ldquo;Show menu prices&rdquo;
              <br />
              • <strong>Your Orders:</strong> &ldquo;What are my recent orders?&rdquo;
              <br />
              • <strong>Preparation &amp; Pickup:</strong> &ldquo;When will my food be ready?&rdquo;
              <br />
              • <strong>Payments:</strong> &ldquo;Check my payment status&rdquo;
            </div>
          </div>

          {/* Render All Messages */}
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            const showActionButtons =
              !isUser &&
              (m.text.includes('Order') ||
                m.text.includes('queue') ||
                m.text.includes('Token') ||
                m.text.includes('Sign In Required') ||
                m.text.includes('payment'));

            return (
              <div key={m.id} className={`chat-row ${isUser ? 'chat-row-user' : 'chat-row-bot'}`}>
                {!isUser && <div className="chatbot-avatar" style={{ width: 28, height: 28, fontSize: '0.9rem' }}>🤖</div>}

                <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
                  {renderFormattedText(m.text)}

                  {/* Contextual Action Shortcuts */}
                  {showActionButtons && (
                    <div className="chat-action-buttons">
                      {m.text.includes('Sign In Required') && onNavigateToLogin && (
                        <button
                          type="button"
                          className="chat-action-btn"
                          onClick={() => {
                            onClose();
                            onNavigateToLogin();
                          }}
                        >
                          🔐 Login Now
                        </button>
                      )}
                      {(m.text.includes('Order') || m.text.includes('My Orders')) && onOpenOrders && (
                        <button
                          type="button"
                          className="chat-action-btn"
                          onClick={() => {
                            onClose();
                            onOpenOrders();
                          }}
                        >
                          🧾 Open My Orders
                        </button>
                      )}
                      {(m.text.includes('queue') || m.text.includes('Token') || m.text.includes('counter')) &&
                        onOpenQueue && (
                          <button
                            type="button"
                            className="chat-action-btn"
                            onClick={() => {
                              onClose();
                              onOpenQueue();
                            }}
                          >
                            📺 Track in Live Queue
                          </button>
                        )}
                    </div>
                  )}

                  <div className="chat-time">{m.timestamp}</div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="chat-row chat-row-bot">
              <div className="chatbot-avatar" style={{ width: 28, height: 28, fontSize: '0.9rem' }}>🤖</div>
              <div className="chat-bubble chat-bubble-bot typing-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Suggested Questions Carousel ── */}
        {suggestions && suggestions.length > 0 && (
          <div className="chatbot-suggestions-section">
            <div className="chatbot-suggestions-label">Suggested Questions</div>
            <div className="chatbot-suggestions-scroll">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chatbot-chip"
                  disabled={isLoading}
                  onClick={() => handleSend(s)}
                >
                  💬 {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Bar ── */}
        <form
          className="chatbot-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            className="chatbot-input"
            placeholder="Ask about food, prices, orders, payments..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={300}
          />
          <button
            type="submit"
            className="chatbot-send-btn"
            disabled={isLoading || !inputText.trim()}
            title="Send Message"
            aria-label="Send message"
          >
            ➤
          </button>
        </form>
      </div>
    </>
  );
}
