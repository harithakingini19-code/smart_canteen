import axios from 'axios';

export const API_BASE_URL =
  typeof window !== 'undefined' && window.location.port === '5173'
    ? '/api'
    : 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ── Request interceptor: attach JWT access token ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-refresh expired access token ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already tried to refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('refresh_token')
    ) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
          refresh: localStorage.getItem('refresh_token'),
        });
        const newAccess = refreshRes.data.access;
        localStorage.setItem('access_token', newAccess);
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshErr) {
        // Refresh failed — clear tokens and let app handle
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extracts a human-readable error message from an Axios error response.
 */
export function getErrorMessage(error) {
  if (!error.response) {
    return 'Cannot connect to server. Please check your internet connection or make sure the Django server is running.';
  }
  const { status, data } = error.response;
  if (status === 401) return 'Session expired. Please log in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';

  // For all errors (including 500), try to extract a JSON error body first
  if (data) {
    if (typeof data === 'string' && !data.includes('<!DOCTYPE')) return data;
    if (data.detail) return data.detail;
    if (data.error) return data.error;
    if (data.message) return data.message;
    // Flatten field-level errors (DRF validation errors)
    if (status !== 500) {
      const fieldErrors = Object.entries(data)
        .map(([field, msgs]) => {
          const msg = Array.isArray(msgs) ? msgs[0] : msgs;
          return `${field}: ${msg}`;
        })
        .join(' | ');
      if (fieldErrors) return fieldErrors;
    }
  }

  if (status === 500) return 'Server error. Please try again later.';
  return 'An unexpected error occurred. Please try again.';
}

export default api;
