import api from './api';

/**
 * Sprint 5: Admin Management API Services
 */

/**
 * Task S.1: Fetch registered students with search and optional status filtering.
 * @param {Object} params - { search, is_active }
 */
export async function fetchAdminStudents(params = {}) {
  const query = { role: 'STUDENT', ...params };
  const response = await api.get('/accounts/admin/users/', { params: query });
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Task S.1: Fetch individual student profile details and recent orders.
 * @param {number|string} id - User ID
 */
export async function fetchStudentDetail(id) {
  const response = await api.get(`/accounts/admin/users/${id}/`);
  return response.data;
}

/**
 * Task S.2: Fetch existing staff accounts (STAFF and ADMIN).
 * @param {Object} params - { search, is_active }
 */
export async function fetchAdminStaff(params = {}) {
  const query = { role: 'STAFF,ADMIN', ...params };
  const response = await api.get('/accounts/admin/users/', { params: query });
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Task S.2: Create a new staff account.
 * @param {Object} data - { first_name, last_name, email, password, role, phone_number }
 */
export async function createStaffAccount(data) {
  const response = await api.post('/accounts/admin/users/', data);
  return response.data;
}

/**
 * Task S.2: Update an existing staff account's role, info, or password.
 * @param {number|string} id - User ID
 * @param {Object} data - fields to update
 */
export async function updateStaffAccount(id, data) {
  const response = await api.patch(`/accounts/admin/users/${id}/`, data);
  return response.data;
}

/**
 * Task S.2: Toggle user account active status (activate / deactivate).
 * @param {number|string} id - User ID
 */
export async function toggleUserStatus(id) {
  const response = await api.post(`/accounts/admin/users/${id}/toggle-status/`);
  return response.data;
}

/**
 * Task S.2: Remove staff access safely (delete user account).
 * @param {number|string} id - User ID
 */
export async function deleteUserAccount(id) {
  const response = await api.delete(`/accounts/admin/users/${id}/`);
  return response.data;
}

/**
 * Fetch overall user counts / statistics across roles.
 */
export async function fetchUserStats() {
  const response = await api.get('/accounts/admin/users/stats/');
  return response.data;
}

/**
 * Task S.3: Fetch payment transactions history with filtering and search.
 * @param {Object} params - { status, method, date, search }
 */
export async function fetchAdminTransactions(params = {}) {
  const response = await api.get('/payments/admin/transactions/', { params });
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Build daily sales breakdown from a flat list of transactions (client-side fallback).
 */
function buildDailySalesFromTransactions(transactions) {
  const completed = transactions.filter(
    (t) => (t.status || '').toUpperCase() === 'COMPLETED'
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const dailyMap = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    dailyMap[key] = {
      date: key,
      day_name: dayNames[d.getDay()],
      orders_count: 0,
      revenue: 0,
    };
  }

  for (const tx of completed) {
    const ts = tx.timestamp || tx.created_at || '';
    const dateKey = ts.slice(0, 10); // YYYY-MM-DD
    if (dailyMap[dateKey]) {
      dailyMap[dateKey].orders_count += 1;
      dailyMap[dateKey].revenue += parseFloat(tx.amount || 0);
    }
  }

  return Object.values(dailyMap);
}

/**
 * Build method breakdown from a flat list of transactions (client-side fallback).
 */
function buildMethodBreakdown(transactions) {
  const completed = transactions.filter(
    (t) => (t.status || '').toUpperCase() === 'COMPLETED'
  );
  const map = {};
  for (const tx of completed) {
    const method = tx.payment_method || 'ONLINE';
    if (!map[method]) {
      map[method] = { payment_method: method, total_amount: 0, count: 0 };
    }
    map[method].total_amount += parseFloat(tx.amount || 0);
    map[method].count += 1;
  }
  return Object.values(map);
}

/**
 * Task S.3: Fetch financial analytics and daily sales breakdown based on real DB records.
 * Includes client-side fallback: if backend analytics returns all-zero daily_sales but
 * we have transactions, recompute from the transaction list.
 */
export async function fetchAdminPaymentAnalytics(transactions = null) {
  let analytics;

  try {
    const response = await api.get('/payments/admin/transactions/analytics/');
    analytics = response.data;
  } catch {
    analytics = null;
  }

  // Check if daily_sales came back but all entries are zero (MySQL TZ bug)
  const dailySalesAllZero =
    analytics?.daily_sales &&
    analytics.daily_sales.length > 0 &&
    analytics.daily_sales.every((d) => d.revenue === 0 && d.orders_count === 0);

  // If analytics failed entirely OR daily_sales are all zero despite real transactions existing
  if (
    !analytics ||
    (dailySalesAllZero && (analytics.total_revenue > 0 || analytics.completed_count > 0))
  ) {
    // Try to build from transactions
    let txList = transactions;
    if (!txList) {
      try {
        txList = await fetchAdminTransactions();
      } catch {
        txList = [];
      }
    }

    const completed = (txList || []).filter(
      (t) => (t.status || '').toUpperCase() === 'COMPLETED'
    );
    const totalRevenue = completed.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCompleted = completed.filter(
      (t) => (t.timestamp || t.created_at || '').slice(0, 10) === todayStr
    );
    const todayRevenue = todayCompleted.reduce((s, t) => s + parseFloat(t.amount || 0), 0);

    const fallback = {
      total_revenue: analytics?.total_revenue || totalRevenue,
      completed_count: analytics?.completed_count || completed.length,
      total_transactions: analytics?.total_transactions || txList.length,
      pending_count: analytics?.pending_count || 0,
      failed_count: analytics?.failed_count || 0,
      refunded_count: analytics?.refunded_count || 0,
      today_revenue: analytics?.today_revenue > 0 ? analytics.today_revenue : todayRevenue,
      today_orders_count: analytics?.today_orders_count > 0 ? analytics.today_orders_count : todayCompleted.length,
      average_order_value:
        analytics?.average_order_value > 0
          ? analytics.average_order_value
          : completed.length > 0
          ? Math.round((totalRevenue / completed.length) * 100) / 100
          : 0,
      method_breakdown:
        analytics?.method_breakdown?.length > 0
          ? analytics.method_breakdown
          : buildMethodBreakdown(txList),
      daily_sales: buildDailySalesFromTransactions(txList),
    };

    return fallback;
  }

  return analytics;
}
