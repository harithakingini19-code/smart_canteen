import React, { useState } from 'react';
import './Login.css';
import { staffRegister } from '../services/auth';
import { getErrorMessage } from '../services/api';

export default function StaffSignup({ theme, onToggleTheme, onSwitchToLogin, onSwitchToMainLogin }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    const errs = {
      name: validate('name', formData.name),
      email: validate('email', formData.email),
      password: validate('password', formData.password),
      confirmPassword: validate('confirmPassword', formData.confirmPassword),
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
      await staffRegister({ name: formData.name, email: formData.email, password: formData.password });
      setSuccessMsg('Staff account created successfully! You can now sign in.');
    } catch (err) {
      setApiError(getErrorMessage(err));
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMsg) {
    return (
      <div className="login-page">
        <div className="login-left">
          <div className="login-brand">
            <div className="login-brand-logo">Smart<span>Canteen</span></div>
            <p className="login-brand-tagline">Staff Management Portal</p>
          </div>
          <div className="login-illustration">👨‍🍳</div>
        </div>
        <div className="login-right">
          <div className="login-box">
            <div className="success-box">
              <div className="success-icon">✅</div>
              <h2 className="success-title">Account Created!</h2>
              <p className="success-desc">{successMsg}</p>
              <button className="btn-primary" onClick={onSwitchToLogin}>
                Go to Staff Login →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <button
        type="button"
        className="theme-toggle-btn page-theme-toggle"
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-logo">Smart<span>Canteen</span></div>
          <p className="login-brand-tagline">Staff Management Portal</p>
        </div>
        <div className="login-illustration">👨‍🍳</div>
        <p className="login-left-caption">
          Create your staff account to manage orders and keep the canteen running.
        </p>
      </div>

      <div className="login-right">
        <div className={`login-box ${shakeForm ? 'shake' : ''}`}>
          <h1 className="login-heading">Staff Registration</h1>
          <p className="login-subheading">Create your staff account</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="form-field">
              <label htmlFor="ssu-name">Full Name</label>
              <div className={`input-wrap ${touched.name && errors.name ? 'has-error' : ''}`}>
                <input
                  id="ssu-name"
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
              <label htmlFor="ssu-email">Email Address</label>
              <div className={`input-wrap ${touched.email && errors.email ? 'has-error' : ''}`}>
                <input
                  id="ssu-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && <span className="field-error">⚠ {errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-field">
              <label htmlFor="ssu-password">Password</label>
              <div className={`input-wrap ${touched.password && errors.password ? 'has-error' : ''}`}>
                <input
                  id="ssu-password"
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
              <label htmlFor="ssu-confirm">Confirm Password</label>
              <div className={`input-wrap ${touched.confirmPassword && errors.confirmPassword ? 'has-error' : ''}`}>
                <input
                  id="ssu-confirm"
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

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <><span className="spinner"></span> Creating account...</>
              ) : 'Create Staff Account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have a staff account?
            <button type="button" onClick={onSwitchToLogin}>Login</button>
          </div>


        </div>
      </div>
    </div>
  );
}
