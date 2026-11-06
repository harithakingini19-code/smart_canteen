import React, { useState } from 'react';
import './Login.css';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export default function StaffLogin({ theme, onToggleTheme, onLoginSuccess, onSwitchToSignup, onSwitchToMainLogin, onForgotPassword }) {
  const { staffLogin } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  const validate = (name, value) => {
    if (name === 'email') {
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setApiError('');
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = {
      email: validate('email', formData.email),
      password: validate('password', formData.password),
    };
    const clean = Object.fromEntries(Object.entries(errs).filter(([, v]) => v));
    setErrors(clean);
    if (Object.keys(clean).length > 0) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      return;
    }
    setIsSubmitting(true);
    setApiError('');
    try {
      await staffLogin({ email: formData.email, password: formData.password });
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setApiError(getErrorMessage(err));
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {/* Floating Theme Toggle */}
      <button
        type="button"
        className="theme-toggle-btn page-theme-toggle"
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* ── Left green branding panel ── */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-logo">
            Smart<span>Canteen</span>
          </div>
          <p className="login-brand-tagline">Staff Management Portal</p>
        </div>
        <div className="login-illustration">👨‍🍳</div>
        <p className="login-left-caption">
          Manage orders, track queues, and keep the canteen running smoothly.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-right">
        <div className={`login-box ${shakeForm ? 'shake' : ''}`}>
          <h1 className="login-heading">Staff Login</h1>
          <p className="login-subheading">Login to access the staff dashboard</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-field">
              <label htmlFor="staff-email">Email Address</label>
              <div className={`input-wrap ${touched.email && errors.email ? 'has-error' : ''}`}>
                <input
                  id="staff-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && (
                <span className="field-error">⚠ {errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="form-field">
              <label htmlFor="staff-password">Password</label>
              <div className={`input-wrap ${touched.password && errors.password ? 'has-error' : ''}`}>
                <input
                  id="staff-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  style={{ paddingRight: '42px' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
              {touched.password && errors.password && (
                <span className="field-error">⚠ {errors.password}</span>
              )}
            </div>

            {/* Forgot Password */}
            <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={onForgotPassword}
                style={{
                  background: 'none', border: 'none', color: 'var(--primary)',
                  fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
                  padding: 0, textDecoration: 'underline'
                }}
              >
                Forgot Password?
              </button>
            </div>

            {apiError && (
              <div className="field-error" style={{ marginBottom: '4px', fontSize: '0.88rem' }}>
                ⚠ {apiError}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <><span className="spinner"></span> Logging in...</>
              ) : 'Staff Login'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have a staff account?
            <button type="button" onClick={onSwitchToSignup}>Register here</button>
          </div>

          {onSwitchToMainLogin && (
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                onClick={onSwitchToMainLogin}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                ← Back to Student / Faculty Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
