/**
 * chatbotApi.js
 * API service module for the Smart Canteen Chatbot & Order Cancellation feature.
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Retrieve the stored authentication token from localStorage.
 * Tries multiple common key names in order.
 * @returns {string} The token string, or empty string if not found.
 */
function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('authToken') ||
    ''
  );
}

/**
 * Build common request headers including the Authorization header.
 * Falls back gracefully when no token is present.
 * @returns {HeadersInit}
 */
function buildHeaders() {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Send a chat message to the backend chatbot endpoint.
 * @param {string} message   The user's message text.
 * @param {number|null} orderId  An optional active order ID for context.
 * @returns {Promise<Object>} Parsed JSON response from the server.
 */
export async function sendChatMessage(message, orderId = null) {
  const body = { message };
  if (orderId !== null && orderId !== undefined) {
    body.order_id = orderId;
  }

  const response = await fetch(`${BASE_URL}/api/chatbot/chat/`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = `Server error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
    } catch (_) {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Fetch the user's latest active order and countdown status from the server.
 * @returns {Promise<Object>}
 */
export async function getLatestOrder() {
  const response = await fetch(`${BASE_URL}/api/chatbot/latest-order/`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch the real-time cancellation status for a given order from the server.
 * @param {number|string} orderId  The order ID to query.
 * @returns {Promise<Object>} Parsed JSON with fields: can_cancel, seconds_remaining, status, created_at.
 */
export async function getCancellationStatus(orderId) {
  const response = await fetch(
    `${BASE_URL}/api/chatbot/cancellation-status/${orderId}/`,
    {
      method: 'GET',
      headers: buildHeaders(),
    }
  );

  if (!response.ok) {
    let errorMessage = `Server error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
    } catch (_) {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Request cancellation for the given order.
 * @param {number|string} orderId  The order ID to cancel.
 * @returns {Promise<Object>} Parsed JSON response confirming cancellation.
 */
export async function cancelOrder(orderId) {
  const response = await fetch(
    `${BASE_URL}/api/chatbot/cancel-order/${orderId}/`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({}),
    }
  );

  if (!response.ok) {
    let errorMessage = `Server error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
    } catch (_) {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Store the active order and notify any active listeners (including Chatbot).
 * Call this in your food ordering checkout flow right after an order is successfully created.
 * @param {Object} order  Order object containing at least { id/order_id, created_at/createdAt, status }
 */
export function notifyOrderPlaced(order) {
  if (!order) return;
  try {
    const payload = {
      orderId: order.id ?? order.order_id ?? order.orderId,
      createdAt: order.created_at ?? order.createdAt ?? order.order_time ?? new Date().toISOString(),
      status: (order.status ?? 'CONFIRMED').toUpperCase(),
    };
    localStorage.setItem('canteen_active_order', JSON.stringify(payload));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('canteen_order_placed', { detail: payload }));
      window.dispatchEvent(new CustomEvent('orderPlaced', { detail: payload }));
    }
  } catch (err) {
    console.error('Failed to notify order placed:', err);
  }
}

/**
 * Retrieve the active order stored in localStorage if any.
 * @returns {Object|null}
 */
export function getStoredActiveOrder() {
  try {
    const raw = localStorage.getItem('canteen_active_order') ||
                localStorage.getItem('latest_order') ||
                localStorage.getItem('activeOrder');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      orderId: parsed.orderId ?? parsed.id ?? parsed.order_id,
      createdAt: parsed.createdAt ?? parsed.created_at ?? parsed.order_time,
      status: (parsed.status ?? 'CONFIRMED').toUpperCase(),
    };
  } catch (_) {
    return null;
  }
}

/**
 * Clear the stored active order from localStorage.
 */
export function clearStoredActiveOrder() {
  try {
    localStorage.removeItem('canteen_active_order');
  } catch (_) {}
}
