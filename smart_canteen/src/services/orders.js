import api from './api';

/**
 * Place an order from the current cart.
 * @param {string} specialInstructions - Optional note to the kitchen
 * @param {string} pickupTime - Scheduled pickup time
 */
export async function placeOrder(specialInstructions = '', pickupTime = 'ASAP') {
  const response = await api.post('/orders/place-order/', {
    special_instructions: specialInstructions,
    pickup_time: pickupTime,
  });
  return response.data;
}

/** Get all orders for the current user */
export async function getOrders() {
  const response = await api.get('/orders/');
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}

/** Get a specific order by ID */
export async function getOrder(id) {
  const response = await api.get(`/orders/${id}/`);
  return response.data;
}

/** Cancel an order (only allowed if status is CONFIRMED) */
export async function cancelOrder(id) {
  const response = await api.post(`/orders/${id}/cancel/`);
  return response.data;
}

/**
 * Admin/Staff: Update status of an order.
 * @param {number} id - Order ID
 * @param {string} status - 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED'
 */
export async function updateOrderStatus(id, status) {
  const response = await api.patch(`/orders/${id}/update_status/`, { status });
  return response.data;
}

/**
 * Admin/Staff: Get incoming active orders.
 */
export async function getIncomingOrders() {
  const response = await api.get('/orders/incoming_orders/');
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}
