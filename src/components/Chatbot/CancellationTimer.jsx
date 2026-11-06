import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getCancellationStatus, cancelOrder } from '../../services/chatbotApi';

/**
 * CancellationTimer
 * Displays a live 10-minute countdown (from 10:00 to 00:00) and a "Cancel Order" button
 * for an order that is still within its cancellation window.
 *
 * Props:
 *   orderId     {number|string}  - The ID of the order.
 *   createdAt   {string}         - ISO 8601 timestamp when the order was created.
 *   orderStatus {string}         - Current order status string (e.g. 'CONFIRMED').
 *   onCancelled {function}       - Callback fired after a successful cancellation.
 */

const CANCEL_WINDOW_SECONDS = 600; // 10 minutes

function padTwo(n) {
  return String(n).padStart(2, '0');
}

function formatMMSS(totalSeconds) {
  if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds <= 0) {
    return '00:00';
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${padTwo(mins)}:${padTwo(secs)}`;
}

function parseTimestamp(ts) {
  if (ts) {
    const t = new Date(ts).getTime();
    if (!isNaN(t)) return t;
  }
  // Default to Date.now() so the timer immediately starts at 10:00 on fresh orders
  return Date.now();
}

function CancellationTimer({ orderId, createdAt, orderStatus = 'CONFIRMED', onCancelled }) {
  const createdAtMs = useRef(parseTimestamp(createdAt));

  const calcSecondsRemaining = useCallback(() => {
    const elapsed = Math.floor((Date.now() - createdAtMs.current) / 1000);
    return Math.max(0, CANCEL_WINDOW_SECONDS - elapsed);
  }, []);

  const [secondsRemaining, setSecondsRemaining] = useState(calcSecondsRemaining);
  const [isCancelling, setIsCancelling]         = useState(false);
  const [cancelSuccess, setCancelSuccess]       = useState(false);
  const [cancelError, setCancelError]           = useState('');
  const [serverStatus, setServerStatus]         = useState(orderStatus ? orderStatus.toUpperCase() : 'CONFIRMED');

  // Re-sync if createdAt prop changes or becomes available
  useEffect(() => {
    if (createdAt) {
      const parsed = new Date(createdAt).getTime();
      if (!isNaN(parsed)) {
        createdAtMs.current = parsed;
        const elapsed = Math.floor((Date.now() - parsed) / 1000);
        setSecondsRemaining(Math.max(0, CANCEL_WINDOW_SECONDS - elapsed));
      }
    }
  }, [createdAt]);

  // Re-sync if orderStatus prop changes
  useEffect(() => {
    if (orderStatus) {
      setServerStatus(orderStatus.toUpperCase());
    }
  }, [orderStatus]);

  // ------------------------------------------------------------------
  // Sync with server on mount to get authoritative status & time left
  // ------------------------------------------------------------------
  useEffect(() => {
    let active = true;

    async function fetchStatus() {
      if (!orderId) return;
      try {
        const data = await getCancellationStatus(orderId);
        if (!active) return;

        if (typeof data.seconds_remaining === 'number') {
          setSecondsRemaining(Math.max(0, data.seconds_remaining));
          const serverElapsed = CANCEL_WINDOW_SECONDS - data.seconds_remaining;
          createdAtMs.current = Date.now() - serverElapsed * 1000;
        }

        if (data.status) {
          setServerStatus(String(data.status).toUpperCase());
        }
      } catch (_err) {
        // Fall back to local countdown
      }
    }

    fetchStatus();
    return () => { active = false; };
  }, [orderId]);

  // ------------------------------------------------------------------
  // Local countdown ticker (every 1 second)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (secondsRemaining <= 0 || cancelSuccess) return;

    const id = setInterval(() => {
      const remaining = calcSecondsRemaining();
      setSecondsRemaining(remaining);
      if (remaining === 0) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [calcSecondsRemaining, cancelSuccess, secondsRemaining]);

  // ------------------------------------------------------------------
  // Cancel handler
  // ------------------------------------------------------------------
  const handleCancel = useCallback(async () => {
    if (!orderId || isCancelling) return;
    setIsCancelling(true);
    setCancelError('');

    try {
      await cancelOrder(orderId);
      setCancelSuccess(true);
      setServerStatus('CANCELLED');
      if (typeof onCancelled === 'function') {
        onCancelled(orderId);
      }
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel order. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  }, [orderId, isCancelling, onCancelled]);

  // ------------------------------------------------------------------
  // Derived state
  // ------------------------------------------------------------------
  const normStatus      = serverStatus ? serverStatus.toUpperCase() : 'CONFIRMED';
  const isExpired       = secondsRemaining <= 0;
  const isPreparing     = normStatus === 'PREPARING';
  const isCancelled     = normStatus === 'CANCELLED' || cancelSuccess;
  const canCancel       = !isExpired && normStatus === 'CONFIRMED' && !cancelSuccess;
  const isLessThan2Min  = secondsRemaining < 120;
  const isLessThan5Min  = secondsRemaining < 300;

  let countdownClass = 'sc-chatbot-timer-countdown';
  if (isLessThan2Min && !isExpired) {
    countdownClass += ' sc-chatbot-timer-danger';
  } else if (isLessThan5Min && !isExpired) {
    countdownClass += ' sc-chatbot-timer-warning';
  }

  return (
    <div className="sc-chatbot-timer-card">
      <div className="sc-chatbot-timer-label">⏱ Cancellation Countdown</div>

      {/* Live 10-minute timer display */}
      <div className={countdownClass} aria-live="polite" aria-atomic="true">
        {formatMMSS(secondsRemaining)}
      </div>

      {/* Status & notices */}
      {isExpired && !isCancelled && (
        <div className="sc-chatbot-timer-expired">
          Cancellation time expired.
        </div>
      )}

      {!isExpired && !isCancelled && !isPreparing && (
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
          Order can be cancelled within the first 10 minutes.
        </div>
      )}

      {isPreparing && !isCancelled && (
        <div style={{ fontSize: 12, color: '#d97706', marginTop: 6, fontWeight: 600 }}>
          👨‍🍳 Order is currently being prepared and can no longer be cancelled.
        </div>
      )}

      {cancelSuccess && (
        <div className="sc-chatbot-cancel-success">
          ✅ Order #{orderId} has been successfully cancelled!
        </div>
      )}

      {cancelError && (
        <div className="sc-chatbot-cancel-error">
          ⚠️ {cancelError}
        </div>
      )}

      {/* Cancel button */}
      {!isCancelled && (
        <button
          className="sc-chatbot-cancel-btn"
          onClick={handleCancel}
          disabled={!canCancel || isCancelling}
          aria-label={`Cancel order ${orderId}`}
          title={isExpired ? 'Cancellation time expired.' : (!canCancel ? 'Cancellation not allowed in current status' : 'Cancel this order')}
        >
          {isCancelling ? 'Cancelling…' : '✖ Cancel Order'}
        </button>
      )}

      {!canCancel && !isExpired && normStatus !== 'CONFIRMED' && !isCancelled && !isPreparing && (
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
          Order cannot be cancelled in its current status ({normStatus}).
        </div>
      )}
    </div>
  );
}

export default CancellationTimer;
