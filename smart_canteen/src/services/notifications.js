import api from './api';

/**
 * Fetch all notifications for the authenticated user.
 */
export async function fetchNotifications() {
  const response = await api.get('/notifications/');
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Mark a single notification as read.
 * @param {number} id - Notification ID
 */
export async function markNotificationRead(id) {
  const response = await api.patch(`/notifications/${id}/mark_read/`);
  return response.data;
}

/**
 * Mark all notifications as read for current user.
 */
export async function markAllNotificationsRead() {
  const response = await api.post('/notifications/mark_all_read/');
  return response.data;
}
