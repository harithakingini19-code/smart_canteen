import React, { useState } from 'react';
import './Login.css';
import { getErrorMessage } from '../services/api';
import api from '../services/api';

/**
 * AdminSignup – Separate Admin Registration Page
 *
 * Admin registration requires backend approval — in a real deployment
 * an existing super-admin would grant admin access. Here we send the
 * registration request to /api/accounts/register/ with role=ADMIN but
 * the serializer safely demotes it to STUDENT unless done via a
 * privileged endpoint. This page serves as the UI placeholder; update
 * the endpoint below if your backend supports direct admin self-registration.
 *
 * Props:
 *   theme, onToggleTheme  – theme controls
 *   onSwitchToLogin       – navigate to Admin login
 *   onSwitchToMain        – navigate back to Create Account page
 */
export default function AdminSignup({ theme, onToggleTheme, onSwitchToLogin, onSwitchToMain }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminCode: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const getPasswordStrength = (pw) => {
    if (!pw) return { label: '', cls: '' };
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { label: 'Weak', cls: 'weak' };
    if (s <= 3) return { label: 'Medium', cls: 'medium' };
    return { label: 'Strong', cls: 'strong' };
  };

  const pwStrength = getPasswordStrength(formData.password);

  const validate = (name, value) => {
    if (name === 'name') {
      if (!value.trim()) return 'Full name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
    }
    if (name === 'email') {
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
    }
    if (name === 'confirmPassword') {
      if (!value) return 'Please confirm your password';
      if (value !== formData.password) return 'Passwords do not match';
    }
    if (name === 'adminCode') {
      if (!value.trim()) return 'Admin authorization code is required';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setApiError('');
    if (touched[name]) setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true, adminCode: true });
    const errs = {
      name: validate('name', formData.name),
      email: validate('email', formData.email),
      password: validate('password', formData.password),
      confirmPassword: validate('confirmPassword', formData.confirmPassword),
      adminCode: validate('adminCode', formData.adminCode),
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
      // Split name into first/last
      const parts = formData.name.trim().split(' ');
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';

      await api.post('/accounts/admin/register/', {
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
        admin_code: formData.adminCode,
      });
      setSuccessMsg('Admin account created successfully! You can now sign in with your admin credentials.');
    } catch (err) {
      setApiError(getErrorMessage(err));
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ──
  if (successMsg) {
    return (
      <div className="login-page">
        <div className="login-left" style={{ background: 'linear-gradient(160deg, #1e40af 0%, #1d4ed8 60%, #1e3a8a 100%)' }}>
          <div className="login-brand">
            <div className="login-brand-logo">Smart<span>Canteen</span></div>
            <p className="login-brand-tagline">Administrator Portal</p>
          </div>
          <div className="login-illustration">🛡️</div>
        </div>
        <div className="login-right">
          <div className="login-box">
            <div className="success-box">
              <div className="success-icon">✅</div>
              <h2 className="success-title">Request Submitted!</h2>
              <p className="success-desc">{successMsg}</p>
              <button className="btn-primary" style={{ background: '#1d4ed8', boxShadow: '0 4px 14px rgba(29,78,216,0.4)' }} onClick={onSwitchToLogin}>
                Go to Admin Login →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      {/* Theme toggle */}
      <button
        type="button"
        className="theme-toggle-btn page-theme-toggle"
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* ── Left blue panel ── */}
      <div className="login-left" style={{ background: 'linear-gradient(160deg, #1e40af 0%, #1d4ed8 60%, #1e3a8a 100%)' }}>
        <div className="login-brand">
          <div className="login-brand-logo">Smart<span>Canteen</span></div>
          <p className="login-brand-tagline">Administrator Portal</p>
        </div>
        <div className="login-illustration">🛡️</div>
        <p className="login-left-caption">
          Secure access for canteen administrators only.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-right">
        <div className={`login-box ${shakeForm ? 'shake' : ''}`}>
          <h1 className="login-heading">Admin Registration</h1>
          <p className="login-subheading">Create your administrator account</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="form-field">
              <label htmlFor="adm-name">Full Name</label>
              <div className={`input-wrap ${touched.name && errors.name ? 'has-error' : ''}`}>
                <input
                  id="adm-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="name"
                />
              </div>
              {touched.name && errors.name && <span className="field-error">⚠ {errors.name}</span>}
            </div>

            {/* Email */}
            <div className="form-field">
              <label htmlFor="adm-email">Admin Email</label>
              <div className={`input-wrap ${touched.email && errors.email ? 'has-error' : ''}`}>
                <input
                  id="adm-email"
                  name="email"
                  type="email"
                  placeholder="Enter admin email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && <span className="field-error">⚠ {errors.email}</span>}
            </div>

            {/* Admin Authorization Code */}
            <div className="form-field">
              <label htmlFor="adm-code">Admin Authorization Code</label>
              <div className={`input-wrap ${touched.adminCode && errors.adminCode ? 'has-error' : ''}`}>
                <input
                  id="adm-code"
                  name="adminCode"
                  type="text"
                  placeholder="Enter the admin access code"
                  value={formData.adminCode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {touched.adminCode && errors.adminCode && <span className="field-error">⚠ {errors.adminCode}</span>}
            </div>

            {/* Password */}
            <div className="form-field">
              <label htmlFor="adm-password">Password</label>
              <div className={`input-wrap ${touched.password && errors.password ? 'has-error' : ''}`}>
                <input
                  id="adm-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  style={{ paddingRight: '42px' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
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
              {touched.password && errors.password && <span className="field-error">⚠ {errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="form-field">
              <label htmlFor="adm-confirm">Confirm Password</label>
              <div className={`input-wrap ${touched.confirmPassword && errors.confirmPassword ? 'has-error' : ''}`}>
                <input
                  id="adm-confirm"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  style={{ paddingRight: '42px' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <span className="field-error">⚠ {errors.confirmPassword}</span>
              )}
            </div>

            {apiError && (
              <div className="field-error" style={{ marginBottom: '4px', fontSize: '0.88rem' }}>
                ⚠ {apiError}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ background: '#1d4ed8', boxShadow: '0 4px 14px rgba(29,78,216,0.4)' }}
            >
              {isSubmitting ? (
                <><span className="spinner"></span> Creating account...</>
              ) : 'Create Admin Account'}
            </button>
          </form>

          <div className="auth-footer" style={{ marginTop: 16 }}>
            Already have an admin account?
            <button type="button" onClick={onSwitchToLogin}>Login</button>
          </div>

          {onSwitchToMain && (
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                onClick={onSwitchToMain}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ← Back to Account Type Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
