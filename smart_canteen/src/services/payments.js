import api from './api';

/**
 * Process/complete a payment for an order.
 * For testing: use payment_method = 'ONLINE' to immediately complete.
 * @param {number} orderId
 * @param {string} paymentMethod - 'ONLINE' | 'CASH'
 */
export async function processPayment(orderId, paymentMethod = 'ONLINE') {
  const response = await api.post('/payments/process/', {
    order_id: orderId,
    payment_method: paymentMethod,
  });
  return response.data;
}

/** Get payment history for the current user */
export async function getPaymentHistory() {
  const response = await api.get('/payments/history/');
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}

/** Top up user wallet balance */
export async function topUpWallet(amount) {
  const response = await api.post('/accounts/topup-wallet/', { amount });
  return response.data;
}
