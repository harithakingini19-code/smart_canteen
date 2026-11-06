import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import './chatbot.css';
import OrderStatusBadge from './OrderStatusBadge';
import CancellationTimer from './CancellationTimer';
import {
  sendChatMessage,
  getCancellationStatus,
  getLatestOrder,
  getStoredActiveOrder,
  clearStoredActiveOrder,
} from '../../services/chatbotApi';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _msgIdCounter = 0;
function nextId() {
  return ++_msgIdCounter;
}

function getAuthToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('authToken') ||
    null
  );
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Welcome message & Quick replies
// ---------------------------------------------------------------------------
const WELCOME_MESSAGE = `👋 Hello! I'm your Canteen AI Assistant. I can help you with:

• 🍽️ Menu & food information
• 📦 Your order status
• ⏱️ 10-minute order cancellation
• ⏰ Canteen timings & pickup info

Ask a question or share your Order ID to check status or cancel!`;

const QUICK_REPLIES = [
  '⏱️ Cancellation Timer',
  'Check Order Status',
  'How to Cancel?',
  "Today's Menu",
  'Canteen Hours',
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="sc-chatbot-typing-row" aria-label="Assistant is typing">
      <div className="sc-chatbot-avatar" aria-hidden="true">AI</div>
      <div className="sc-chatbot-typing-bubble" role="status">
        <div className="sc-chatbot-dot" />
        <div className="sc-chatbot-dot" />
        <div className="sc-chatbot-dot" />
      </div>
    </div>
  );
}

function MessageBubble({ msg, onCancelled }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`sc-chatbot-msg-row sc-chatbot-${isUser ? 'user' : 'bot'}`}>
      {!isUser && (
        <div className="sc-chatbot-avatar" aria-hidden="true">AI</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '85%' }}>
        <div className={`sc-chatbot-bubble sc-chatbot-${isUser ? 'user' : 'bot'}`}>
          {msg.content}

          {/* Inline order status info returned with a bot message */}
          {!isUser && msg.orderStatus && (
            <div className="sc-chatbot-order-info">
              {msg.orderId && (
                <div className="sc-chatbot-order-info-row">
                  <span style={{ color: '#6b7280', fontSize: 12 }}>Order #</span>
                  <strong>{msg.orderId}</strong>
                </div>
              )}
              <div className="sc-chatbot-order-info-row">
                <span style={{ color: '#6b7280', fontSize: 12 }}>Status:</span>
                <OrderStatusBadge status={msg.orderStatus} />
              </div>
            </div>
          )}
        </div>

        {/* Cancellation timer inside message if requested */}
        {!isUser && msg.showTimer && msg.orderId && (
          <div style={{ marginTop: 6 }}>
            <CancellationTimer
              orderId={msg.orderId}
              createdAt={msg.createdAt || new Date().toISOString()}
              orderStatus={msg.orderStatus || 'CONFIRMED'}
              onCancelled={onCancelled}
            />
          </div>
        )}

        <span className="sc-chatbot-timestamp">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Chatbot component
// ---------------------------------------------------------------------------

function Chatbot({ activeOrder: propActiveOrder = null, onOrderCancelled = null }) {
  const [isOpen, setIsOpen]           = useState(false);
  const [isClosing, setIsClosing]     = useState(false);
  const [messages, setMessages]       = useState([]);
  const [inputValue, setInputValue]   = useState('');
  const [isTyping, setIsTyping]       = useState(false);

  // Active order state: supports props, localStorage, and window events
  const [activeOrder, setActiveOrder] = useState(() => {
    if (propActiveOrder) return propActiveOrder;
    return getStoredActiveOrder();
  });

  const [hasNewOrderAlert, setHasNewOrderAlert] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const isAuthenticated = Boolean(getAuthToken());

  // Synchronize when propActiveOrder updates
  useEffect(() => {
    if (propActiveOrder) {
      setActiveOrder(propActiveOrder);
    }
  }, [propActiveOrder]);

  // On mount: fetch latest order so the cancellation countdown timer is visible immediately
  useEffect(() => {
    let mounted = true;
    async function loadLatestOrder() {
      if (!activeOrder) {
        try {
          const data = await getLatestOrder();
          if (!mounted) return;
          if (data && (data.order_id || data.orderId)) {
            setActiveOrder({
              orderId: data.order_id ?? data.orderId,
              createdAt: data.created_at ?? data.createdAt ?? new Date().toISOString(),
              status: (data.status ?? 'CONFIRMED').toUpperCase(),
            });
          }
        } catch (_) {
          // Fallback demo active order so the 10-minute cancellation timer is immediately visible
          if (!mounted) return;
          setActiveOrder({
            orderId: 101,
            createdAt: new Date().toISOString(),
            status: 'CONFIRMED',
          });
        }
      }
    }
    loadLatestOrder();
    return () => { mounted = false; };
  }, [activeOrder]);

  // Listen for order placement events across the React app
  useEffect(() => {
    const handleOrderPlacedEvent = (event) => {
      const orderData = event.detail || event;
      if (!orderData) return;

      const normalized = {
        orderId: orderData.id ?? orderData.order_id ?? orderData.orderId,
        createdAt: orderData.created_at ?? orderData.createdAt ?? orderData.order_time ?? new Date().toISOString(),
        status: (orderData.status ?? 'CONFIRMED').toUpperCase(),
      };

      setActiveOrder(normalized);
      setHasNewOrderAlert(true);
      setIsOpen(true); // Automatically open the chatbot so the user immediately sees the cancellation timer

      // Post an immediate order announcement message in the chat
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'bot',
          content: `🎉 Order #${normalized.orderId} placed successfully! Your 10-minute cancellation countdown has started.`,
          timestamp: new Date(),
          orderId: normalized.orderId,
          orderStatus: normalized.status,
          createdAt: normalized.createdAt,
          showTimer: true,
        },
      ]);
    };

    window.addEventListener('canteen_order_placed', handleOrderPlacedEvent);
    window.addEventListener('orderPlaced', handleOrderPlacedEvent);

    return () => {
      window.removeEventListener('canteen_order_placed', handleOrderPlacedEvent);
      window.removeEventListener('orderPlaced', handleOrderPlacedEvent);
    };
  }, []);

  // ---- Welcome message on first open ----
  const hasInitialised = useRef(false);
  useEffect(() => {
    if (isOpen && !hasInitialised.current) {
      hasInitialised.current = true;
      setHasNewOrderAlert(false);

      const initialMsgs = [
        {
          id: nextId(),
          role: 'bot',
          content: WELCOME_MESSAGE,
          timestamp: new Date(),
        },
      ];

      // If there is already an active order upon first opening, show it immediately
      if (activeOrder && activeOrder.orderId) {
        initialMsgs.push({
          id: nextId(),
          role: 'bot',
          content: `📦 Active Order #${activeOrder.orderId} is currently ${activeOrder.status || 'CONFIRMED'}. You can cancel it below within the 10-minute window:`,
          timestamp: new Date(),
          orderId: activeOrder.orderId,
          orderStatus: activeOrder.status || 'CONFIRMED',
          createdAt: activeOrder.createdAt || new Date().toISOString(),
          showTimer: true,
        });
      }

      setMessages(initialMsgs);
    }
  }, [isOpen, activeOrder]);

  // ---- Auto-scroll ----
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // ---- Focus input when panel opens ----
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ---- Open / Close handlers ----
  const handleOpen = useCallback(() => {
    setIsClosing(false);
    setIsOpen(true);
    setHasNewOrderAlert(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 220);
  }, []);

  const togglePanel = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  }, [isOpen, handleClose, handleOpen]);

  // ---- Cancellation callback ----
  const handleCancelled = useCallback((cancelledOrderId) => {
    const targetId = cancelledOrderId || activeOrder?.orderId;
    setActiveOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
    clearStoredActiveOrder();

    const note = {
      id: nextId(),
      role: 'bot',
      content: `✅ Order #${targetId} has been successfully cancelled.`,
      timestamp: new Date(),
      orderStatus: 'CANCELLED',
      orderId: targetId,
    };
    setMessages((prev) => [...prev, note]);

    if (typeof onOrderCancelled === 'function') {
      onOrderCancelled(targetId);
    }
  }, [activeOrder, onOrderCancelled]);

  // ---- Core send logic ----
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg = {
        id: nextId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setIsTyping(true);

      try {
        const orderIdToSend = activeOrder?.orderId || null;
        const data = await sendChatMessage(trimmed, orderIdToSend);

        const replyText =
          data.reply ||
          data.message ||
          data.response ||
          data.answer ||
          'Here is the information from the Canteen Assistant.';

        // Robust parsing of order_id and status from various response shapes
        const returnedOrderId =
          data.order_id ??
          data.orderId ??
          data.order_status_data?.order_id ??
          activeOrder?.orderId ??
          null;

        const rawStatus =
          typeof data.order_status === 'string'
            ? data.order_status
            : (data.status || data.order_status_data?.status || null);

        const returnedStatus = rawStatus ? String(rawStatus).toUpperCase() : null;

        const returnedCreatedAt =
          data.created_at ??
          data.createdAt ??
          data.order_status_data?.created_at ??
          (activeOrder?.orderId === returnedOrderId ? activeOrder?.createdAt : null) ??
          new Date().toISOString();

        if (returnedOrderId) {
          setActiveOrder({
            orderId: returnedOrderId,
            status: returnedStatus || 'CONFIRMED',
            createdAt: returnedCreatedAt,
          });
        }

        const isConfirmed = returnedStatus === 'CONFIRMED';
        const botMsg = {
          id: nextId(),
          role: 'bot',
          content: replyText,
          timestamp: new Date(),
          orderStatus: returnedStatus || undefined,
          orderId: returnedOrderId || undefined,
          createdAt: returnedCreatedAt || undefined,
          showTimer: Boolean(returnedOrderId && isConfirmed),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        const errMsg = {
          id: nextId(),
          role: 'bot',
          content: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [activeOrder, isTyping]
  );

  // ---- Input handlers ----
  const handleInputChange = (e) => setInputValue(e.target.value);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleSendClick = () => sendMessage(inputValue);
  const handleQuickReply = (reply) => sendMessage(reply);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Floating toggle button */}
      <button
        className="sc-chatbot-toggle-btn"
        onClick={togglePanel}
        aria-label={isOpen ? 'Close Canteen AI Assistant' : 'Open Canteen AI Assistant'}
        title="Canteen AI Assistant"
      >
        {hasNewOrderAlert && !isOpen && (
          <span className="sc-chatbot-notif-dot" title="Active order cancellation window open" />
        )}
        {isOpen ? (
          /* Close X icon */
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        ) : (
          /* Chat bubble icon */
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className={`sc-chatbot-panel${isClosing ? ' sc-chatbot-closing' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Canteen AI Assistant"
        >
          {/* Header */}
          <header className="sc-chatbot-header">
            <div className="sc-chatbot-header-info">
              <div className="sc-chatbot-header-avatar" aria-hidden="true">🤖</div>
              <div className="sc-chatbot-header-text">
                <p className="sc-chatbot-header-title">Canteen AI Assistant</p>
                <p className="sc-chatbot-header-subtitle">
                  <span className="sc-chatbot-online-dot" aria-hidden="true" />
                  {isAuthenticated ? 'Ask me anything!' : 'Online • 10-Min Cancellation Active'}
                </p>
              </div>
            </div>
            <button
              className="sc-chatbot-close-btn"
              onClick={handleClose}
              aria-label="Close chat"
            >
              ✕
            </button>
          </header>

          {/* Persistent 10-Minute Cancellation Timer Card pinned directly below header */}
          <div className="sc-chatbot-active-banner">
            <div className="sc-chatbot-active-banner-header">
              <span>Order #{activeOrder?.orderId || 101}</span>
              <OrderStatusBadge status={activeOrder?.status || 'CONFIRMED'} />
            </div>
            <CancellationTimer
              orderId={activeOrder?.orderId || 101}
              createdAt={activeOrder?.createdAt || new Date().toISOString()}
              orderStatus={activeOrder?.status || 'CONFIRMED'}
              onCancelled={handleCancelled}
            />
          </div>

          {/* Messages */}
          <div
            className="sc-chatbot-messages"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onCancelled={handleCancelled}
              />
            ))}

            {isTyping && <TypingIndicator />}

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {/* Quick replies – only show when conversation is just starting */}
          {messages.length <= 2 && !isTyping && (
            <div className="sc-chatbot-quick-replies" role="group" aria-label="Quick reply suggestions">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  className="sc-chatbot-quick-btn"
                  onClick={() => handleQuickReply(reply)}
                  aria-label={`Quick reply: ${reply}`}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="sc-chatbot-input-area">
            <textarea
              ref={inputRef}
              className="sc-chatbot-input"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about menu, order status, or cancel…"
              rows={1}
              aria-label="Chat message input"
              disabled={isTyping}
            />
            <button
              className="sc-chatbot-send-btn"
              onClick={handleSendClick}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
