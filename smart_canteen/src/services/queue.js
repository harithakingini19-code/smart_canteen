import api from './api';

/**
 * Get live queue status (all preparing, ready, waiting tokens).
 * This endpoint is public and does not require authentication.
 */
export async function getLiveQueue() {
  const response = await api.get('/queue/live_status/');
  return response.data;
}

/**
 * Get the queue token for a specific order.
 * @param {number} orderId
 */
export async function getQueueTokenForOrder(orderId) {
  // The queue viewset lists all tokens accessible to the user
  const response = await api.get('/queue/');
  const data = response.data;
  const tokens = Array.isArray(data) ? data : (data.results || []);
  return tokens.find((t) => t.order === orderId || t.order?.id === orderId) || null;
}

/** Get all queue tokens (staff/public board view) */
export async function getAllQueueTokens() {
  const response = await api.get('/queue/');
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}
