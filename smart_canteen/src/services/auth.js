import api, { getErrorMessage } from './api';

/**
 * Register a new user.
 * Maps frontend form fields to what the Django serializer expects.
 */
export async function register({ fullName, email, phone, password, confirmPassword, role = 'STUDENT' }) {
  // Split fullName into first_name + last_name
  const parts = fullName.trim().split(' ');
  const first_name = parts[0] || '';
  const last_name = parts.slice(1).join(' ') || '';

  // Auto-generate username from email prefix (e.g. john.doe@mail.com → john_doe)
  const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

  const payload = {
    email,
    username,
    first_name,
    last_name,
    phone_number: phone,
    password,
    confirm_password: confirmPassword,
    role: role === 'admin' ? 'STUDENT' : role.toUpperCase(), // prevent public admin creation
  };

  const response = await api.post('/accounts/register/', payload);
  return response.data;
}

/**
 * Login with email + password. Returns user data + tokens.
 */
export async function login({ email, password }) {
  const response = await api.post('/accounts/login/', { email, password });
  const { user, tokens } = response.data;

  // Persist tokens and user
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
  localStorage.setItem('user', JSON.stringify(user));

  return user;
}

/**
 * Logout — blacklists the refresh token on the server.
 */
export async function logout() {
  try {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      await api.post('/accounts/logout/', { refresh });
    }
  } catch {
    // Ignore errors — always clear local state
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
}

/**
 * Get the currently stored user object (from localStorage).
 */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch fresh profile from server and update localStorage.
 */
export async function fetchProfile() {
  const response = await api.get('/accounts/profile/');
  localStorage.setItem('user', JSON.stringify(response.data));
  return response.data;
}

/**
 * Update user profile.
 */
export async function updateProfile(data) {
  const response = await api.patch('/accounts/profile/', data);
  localStorage.setItem('user', JSON.stringify(response.data));
  return response.data;
}

/**
 * Check if user is authenticated (has a stored access token).
 */
export function isAuthenticated() {
  return Boolean(localStorage.getItem('access_token'));
}

/**
 * Request password reset token by email.
 */
export async function requestPasswordReset(email) {
  const response = await api.post('/accounts/forgot-password/', { email });
  return response.data;
}

/**
 * Reset password using token and new password.
 */
export async function confirmPasswordReset({ token, newPassword }) {
  const response = await api.post('/accounts/reset-password/', {
    token,
    new_password: newPassword,
  });
  return response.data;
}

/**
 * Staff Sign In: Name, Email, Password. Returns user data + JWT tokens.
 */
export async function staffLogin({ name, email, password }) {
  const response = await api.post('/accounts/staff/login/', { name, email, password });
  const { user, tokens } = response.data;
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

/**
 * Staff Sign Up: Name, Email, Password.
 */
export async function staffRegister({ name, email, password }) {
  const response = await api.post('/accounts/staff/register/', { name, email, password });
  return response.data;
}

/**
 * Admin Sign In: Email, Password. Returns user data + JWT tokens.
 */
export async function adminLogin({ email, password }) {
  const response = await api.post('/accounts/admin/login/', { email, password });
  const { user, tokens } = response.data;
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

/**
 * Admin Registration: Name, Email, Password, admin_code.
 * The admin_code is validated server-side against ADMIN_REGISTRATION_CODE env variable.
 */
export async function adminRegister({ name, email, password, adminCode }) {
  const response = await api.post('/accounts/admin/register/', {
    name,
    email,
    password,
    admin_code: adminCode,
  });
  return response.data;
}



