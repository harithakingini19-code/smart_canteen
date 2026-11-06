import React, { useState } from 'react';
import './Login.css';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export default function Login({ theme, onToggleTheme, onSwitchToSignup, onLoginSuccess, onForgotPassword, onNavigateToStaffLogin, onNavigateToAdminLogin }) {
  const { login } = useAuth();
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');

  const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, label: '', cls: '' };
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { score: s, label: 'Weak', cls: 'weak' };
    if (s <= 3) return { score: s, label: 'Medium', cls: 'medium' };
    return { score: s, label: 'Strong', cls: 'strong' };
  };

  const pwStrength = getPasswordStrength(formData.password);

  const validate = (name, value) => {
    if (name === 'email') {
      if (!value.trim()) return 'Email is required';
      if (value.length < 3) return 'Too short';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    setApiError('');
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validate(name, val) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = { email: validate('email', formData.email), password: validate('password', formData.password) };
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
      const userData = await login({ email: formData.email, password: formData.password });
      setIsSubmitted(true);
      if (onLoginSuccess) onLoginSuccess(userData);
    } catch (err) {
      setApiError(getErrorMessage(err));
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = (e) => {
    e.preventDefault();
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      if (!formData.email) {
        setErrors(prev => ({ ...prev, email: 'Enter your email first' }));
        setTouched(prev => ({ ...prev, email: true }));
        return;
      }
      setForgotMsg(`Reset link sent to ${formData.email}`);
      setTimeout(() => setForgotMsg(''), 5000);
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
          <p className="login-brand-tagline">Good Food, Good Mood</p>
        </div>
        <div className="login-illustration">🧑‍🍳</div>
        <p className="login-left-caption">
          Pre-order fresh meals and skip the queue at your campus canteen!
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-right">
        <div className={`login-box ${shakeForm ? 'shake' : ''}`}>
          {!isSubmitted ? (
            <>
              <h1 className="login-heading">Welcome Back!</h1>
              <p className="login-subheading">Login to continue</p>

              {/* Role Tabs */}
              <div className="role-tabs" style={{ marginBottom: '20px' }}>
                <button
                  type="button"
                  className={`role-tab ${role === 'student' ? 'active' : ''}`}
                  onClick={() => setRole('student')}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={`role-tab ${role === 'faculty' ? 'active' : ''}`}
                  onClick={() => setRole('faculty')}
                >
                  Faculty
                </button>
                <button
                  type="button"
                  className="role-tab"
                  onClick={() => onNavigateToStaffLogin && onNavigateToStaffLogin()}
                  title="Switch to Staff Sign In"
                >
                  Staff 👨‍🍳
                </button>
                <button
                  type="button"
                  className="role-tab"
                  onClick={() => onNavigateToAdminLogin && onNavigateToAdminLogin()}
                  title="Switch to Admin Login"
                >
                  Admin 🛡️
                </button>
              </div>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {/* Email / Phone */}
                <div className="form-field">
                  <label htmlFor="login-email">Email or Phone</label>
                  <div className={`input-wrap ${touched.email && errors.email ? 'has-error' : ''}`}>
                    <input
                      id="login-email"
                      name="email"
                      type="text"
                      placeholder="Enter email or phone"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="username"
                    />
                  </div>
                  {touched.email && errors.email && (
                    <span className="field-error">⚠ {errors.email}</span>
                  )}
                </div>

                {/* Password */}
                <div className="form-field">
                  <label htmlFor="login-password">Password</label>
                  <div className={`input-wrap ${touched.password && errors.password ? 'has-error' : ''}`}>
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
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
                  {formData.password && (
                    <div>
                      <div className="strength-bar-bg">
                        <div className={`strength-bar-fill ${pwStrength.cls}`}></div>
                      </div>
                      <div className="strength-label">
                        <span>Strength</span>
                        <span style={{ fontWeight: 600 }}>{pwStrength.label}</span>
                      </div>
                    </div>
                  )}
                  {touched.password && errors.password && (
                    <span className="field-error">⚠ {errors.password}</span>
                  )}
                </div>

                {/* Forgot Password */}
                <div className="forgot-row">
                  <button type="button" className="forgot-link" onClick={handleForgot}>
                    🔑 Forgot Password?
                  </button>
                </div>

                {forgotMsg && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--success)', marginTop: '-6px' }}>
                    ✓ {forgotMsg}
                  </p>
                )}

                {apiError && (
                  <div className="field-error" style={{ marginBottom: '14px', fontSize: '0.88rem' }}>
                    ⚠ {apiError}
                  </div>
                )}

                {/* Submit */}
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><span className="spinner"></span> Logging in...</>
                  ) : 'Login'}
                </button>
              </form>

              <div className="auth-footer">
                Don't have an account?
                <button type="button" onClick={onSwitchToSignup}>Register here</button>
              </div>

              {(onNavigateToStaffLogin || onNavigateToAdminLogin) && (
                <div style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                }}>
                  {onNavigateToStaffLogin && (
                    <button
                      type="button"
                      onClick={onNavigateToStaffLogin}
                      style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 6px', borderRadius: 6,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      👨‍🍳 Staff Portal
                    </button>
                  )}
                  {onNavigateToAdminLogin && (
                    <button
                      type="button"
                      onClick={onNavigateToAdminLogin}
                      style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 6px', borderRadius: 6,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#1d4ed8'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      🛡️ Admin Portal
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            /* ── Success Screen ── */
            <div className="success-box">
              <div className="success-icon">✅</div>
              <h2 className="success-title">Login Successful!</h2>
              <p className="success-desc">
                Welcome back to Smart Canteen. Ready to pre-order your meal?
              </p>
              <div className="info-card">
                <div className="info-row">
                  <span className="info-label">Account</span>
                  <span className="info-val">{formData.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Role</span>
                  <span className="info-val" style={{ textTransform: 'capitalize' }}>{role}</span>
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={() => onLoginSuccess && onLoginSuccess({ email: formData.email, role })}
              >
                Go to Canteen Menu →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
