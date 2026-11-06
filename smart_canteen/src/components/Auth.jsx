import React, { useState, useEffect } from 'react';
import './Auth.css';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

const DEPARTMENTS = [
  { value: 'cs',    label: 'Computer Science & Engg.' },
  { value: 'ec',    label: 'Electronics & Comm.' },
  { value: 'me',    label: 'Mechanical Engg.' },
  { value: 'ce',    label: 'Civil Engg.' },
  { value: 'mba',   label: 'Business Admin (MBA)' },
  { value: 'staff', label: 'Faculty / Staff Member' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' },
  { value: 'mr', label: 'Marathi' },
];

export default function Auth({
  initialMode = 'login',
  theme,
  onToggleTheme,
  onForgotPassword,
  onAuthSuccess,
  onNavigate,
}) {
  const { login, register } = useAuth();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState(initialMode);
  // Role: 'student' | 'staff' | 'admin'
  const [role, setRole] = useState('student');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'cs',
    language: 'en',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  // Sync mode with initialMode prop when popstate changes
  useEffect(() => {
    setMode(initialMode);
    setErrors({});
    setApiError('');
    setTouched({});
  }, [initialMode]);

  // Trigger shake animation on form errors
  const triggerShake = () => {
    setShakeForm(true);
    setTimeout(() => setShakeForm(false), 500);
  };

  // Password strength calculation
  const getPasswordStrength = (pw) => {
    if (!pw) return { label: '', cls: '', score: 0 };
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { label: 'Weak', cls: 'weak', score: 1 };
    if (s <= 3) return { label: 'Medium', cls: 'medium', score: 2 };
    return { label: 'Strong', cls: 'strong', score: 3 };
  };

  const pwStrength = getPasswordStrength(formData.password);

  // Field validation logic
  const validateField = (name, value, allValues = formData) => {
    if (mode === 'login') {
      if (name === 'email' && !value.trim()) return 'Email or Phone is required';
      if (name === 'password' && !value) return 'Password is required';
      return '';
    }

    // Register mode validations
    if (name === 'fullName' && !value.trim()) return 'Full name is required';
    if (name === 'email') {
      if (!value.trim()) return 'Email address is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
    }
    if (name === 'phone') {
      if (!value.trim()) return 'Phone number is required';
      if (!/^[0-9]{10}$/.test(value.replace(/[\s-]/g, ''))) return 'Enter a valid 10-digit mobile number';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters long';
    }
    if (name === 'confirmPassword') {
      if (!value) return 'Please confirm your password';
      if (value !== allValues.password) return 'Passwords do not match';
    }
    if (name === 'agreeTerms' && !value) return 'You must accept the terms & conditions';

    return '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    const updated = { ...formData, [name]: val };
    setFormData(updated);
    setApiError('');

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, val, updated) }));
    }
    if (name === 'password' && touched.confirmPassword && mode === 'register') {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField('confirmPassword', formData.confirmPassword, updated),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, val, formData) }));
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setErrors({});
    setApiError('');
    setTouched({});
    if (onNavigate) {
      onNavigate(newMode === 'register' ? 'signup' : 'login');
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark relevant fields touched
    const fieldsToTouch = mode === 'login'
      ? ['email', 'password']
      : ['fullName', 'email', 'phone', 'password', 'confirmPassword', 'agreeTerms'];

    const newTouched = {};
    fieldsToTouch.forEach((f) => { newTouched[f] = true; });
    setTouched(newTouched);

    const errs = {};
    fieldsToTouch.forEach((f) => {
      const err = validateField(f, formData[f], formData);
      if (err) errs[f] = err;
    });

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      triggerShake();
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      if (mode === 'login') {
        // Perform Login
        const userData = await login({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (onAuthSuccess) {
          onAuthSuccess(userData);
        }
      } else {
        // Perform Register
        const registerPayload = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: role,
        };

        await register(registerPayload);

        // Auto-login after successful registration
        try {
          const userData = await login({
            email: formData.email.trim(),
            password: formData.password,
          });
          if (onAuthSuccess) onAuthSuccess(userData);
        } catch {
          setMode('login');
          setApiError('');
          if (onNavigate) onNavigate('login');
        }
      }
    } catch (err) {
      setApiError(getErrorMessage(err));
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
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

      {/* ── Left Green Branding Panel ── */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-logo">
            Smart<span>Canteen</span>
          </div>
          <p className="auth-brand-tagline">Good Food, Good Mood</p>
        </div>

        <div className="auth-illustration">🧑‍🍳</div>

        <p className="auth-left-caption">
          Pre-order fresh meals and skip the queue at your campus canteen!
        </p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-right">
        <div className={`auth-box ${shakeForm ? 'shake' : ''}`}>

          <h1 className="auth-heading">
            {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h1>
          <p className="auth-subheading">
            {mode === 'login' ? 'Login to continue' : 'Join our Canteen today!'}
          </p>

          {/* Role Tabs (Student | Faculty | Admin) */}
          <div className="role-tabs" style={{ marginBottom: '22px' }}>
            {[
              { id: 'student', label: 'Student' },
              { id: 'staff', label: 'Faculty' },
              { id: 'admin', label: 'Admin' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                className={`role-tab ${role === r.id ? 'active' : ''}`}
                onClick={() => setRole(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            
            {/* REGISTER MODE ADDITIONAL FIELDS */}
            {mode === 'register' && (
              <>
                {/* Full Name & Phone Row */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label htmlFor="auth-fullName">Full Name</label>
                    <div className={`input-wrap ${touched.fullName && errors.fullName ? 'has-error' : ''}`}>
                      <input
                        id="auth-fullName"
                        name="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>
                    {touched.fullName && errors.fullName && (
                      <span className="field-error">⚠ {errors.fullName}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="auth-phone">Phone Number</label>
                    <div className={`input-wrap ${touched.phone && errors.phone ? 'has-error' : ''}`}>
                      <input
                        id="auth-phone"
                        name="phone"
                        type="tel"
                        placeholder="Enter 10-digit phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>
                    {touched.phone && errors.phone && (
                      <span className="field-error">⚠ {errors.phone}</span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Email Field (Shared) */}
            <div className="form-field">
              <label htmlFor="auth-email">
                {mode === 'login' ? 'Email or Phone' : 'Email Address'}
              </label>
              <div className={`input-wrap ${touched.email && errors.email ? 'has-error' : ''}`}>
                <input
                  id="auth-email"
                  name="email"
                  type={mode === 'login' ? 'text' : 'email'}
                  placeholder={mode === 'login' ? 'Enter email or phone' : 'Enter your email address'}
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

            {/* REGISTER MODE: Department & Language */}
            {mode === 'register' && (
              <div className="form-row-2">
                <div className="form-field">
                  <label htmlFor="auth-dept">
                    {role === 'staff' ? 'Faculty Department' : 'Department / Branch'}
                  </label>
                  <select
                    id="auth-dept"
                    name="department"
                    className="form-select"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="auth-lang">Preferred Language</label>
                  <select
                    id="auth-lang"
                    name="language"
                    className="form-select"
                    value={formData.language}
                    onChange={handleChange}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Password Field (Shared) */}
            <div className="form-field">
              <label htmlFor="auth-password">Password</label>
              <div className={`input-wrap ${touched.password && errors.password ? 'has-error' : ''}`}>
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'login' ? 'Enter password' : 'Create a password'}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  style={{ paddingRight: '42px' }}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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

              {mode === 'register' && formData.password && (
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

            {/* REGISTER MODE: Confirm Password */}
            {mode === 'register' && (
              <div className="form-field">
                <label htmlFor="auth-confirmPassword">Confirm Password</label>
                <div className={`input-wrap ${touched.confirmPassword && errors.confirmPassword ? 'has-error' : ''}`}>
                  <input
                    id="auth-confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <span className="field-error">⚠ {errors.confirmPassword}</span>
                )}
              </div>
            )}

            {/* LOGIN MODE: Forgot Password */}
            {mode === 'login' && (
              <div className="forgot-row">
                <button
                  type="button"
                  className="forgot-link"
                  onClick={onForgotPassword}
                >
                  🔑 Forgot Password?
                </button>
              </div>
            )}

            {/* REGISTER MODE: Terms Checkbox */}
            {mode === 'register' && (
              <div className="form-field">
                <label className="terms-row">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    className="terms-cb"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <span>
                    I agree to the{' '}
                    <a href="#terms" className="terms-link">Smart Canteen Terms &amp; Rules</a>
                  </span>
                </label>
                {touched.agreeTerms && errors.agreeTerms && (
                  <span className="field-error">⚠ {errors.agreeTerms}</span>
                )}
              </div>
            )}

            {/* API Error Notification */}
            {apiError && (
              <div className="field-error" style={{ marginBottom: '14px', fontSize: '0.88rem' }}>
                ⚠ {apiError}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  {mode === 'login' ? 'Logging in...' : 'Creating Account...'}
                </>
              ) : mode === 'login' ? (
                'Login'
              ) : (
                'Register'
              )}
            </button>
          </form>

          {/* Footer Switcher */}
          <div className="auth-footer">
            {mode === 'login' ? (
              <>
                Don't have an account?
                <button type="button" onClick={() => handleModeSwitch('register')}>
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?
                <button type="button" onClick={() => handleModeSwitch('login')}>
                  Login here
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
