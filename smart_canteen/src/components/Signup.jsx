import React, { useState } from 'react';
import './Signup.css';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

const DEPARTMENTS = [
  { value: 'cs',    label: 'Computer Science' },
  { value: 'ec',    label: 'Electronics & Comm.' },
  { value: 'me',    label: 'Mechanical Engg.' },
  { value: 'ce',    label: 'Civil Engg.' },
  { value: 'mba',   label: 'Business Admin (MBA)' },
  { value: 'staff', label: 'Faculty / Staff' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' },
  { value: 'mr', label: 'Marathi' },
];

export default function Signup({ theme, onToggleTheme, onSwitchToLogin, onSignupSuccess, onNavigateToStaffSignup, initialRole }) {
  const { register } = useAuth();
  // initialRole comes from CreateAccount (e.g. 'STUDENT' or 'FACULTY') — normalise to lowercase
  const [role, setRole] = useState(() => (initialRole ? initialRole.toLowerCase() : 'student'));
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'cs',
    language: 'en',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

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

  const validate = (name, value, allValues = formData) => {
    if (name === 'fullName' && !value.trim()) return 'Full name is required';
    if (name === 'email') {
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email';
    }
    if (name === 'phone') {
      if (!value.trim()) return 'Phone number is required';
      if (!/^[0-9]{10}$/.test(value.replace(/[\s-]/g, ''))) return 'Enter a valid 10-digit number';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'At least 8 characters required';
    }
    if (name === 'confirmPassword') {
      if (!value) return 'Please confirm your password';
      if (value !== allValues.password) return 'Passwords do not match';
    }
    if (name === 'agreeTerms' && !value) return 'You must accept the terms';
    return '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    const updated = { ...formData, [name]: val };
    setFormData(updated);
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validate(name, val, updated) }));
    if (name === 'password' && touched.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validate('confirmPassword', formData.confirmPassword, updated) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validate(name, val, formData) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(formData).map(k => [k, true]));
    setTouched(allTouched);
    const errs = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, validate(k, v, formData)]).filter(([, v]) => v)
    );
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      return;
    }
    setIsSubmitting(true);
    setApiError('');
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: role,
      });
      setIsSubmitted(true);
      if (onSignupSuccess) onSignupSuccess({ fullName: formData.fullName, email: formData.email, role });
    } catch (err) {
      setApiError(getErrorMessage(err));
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
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
      <div className="signup-left">
        <div className="signup-brand">
          <div className="signup-brand-logo">
            Smart<span>Canteen</span>
          </div>
        </div>
        <div className="signup-illustration">🥗</div>
        <p className="signup-left-caption">
          Fresh, Healthy &amp; Delicious Food Delivered to you!
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="signup-right">
        <div className={`signup-box ${shakeForm ? 'shake' : ''}`}>
          {!isSubmitted ? (
            <>
              <h1 className="signup-heading">Create Account</h1>
              <p className="signup-subheading">Join our Canteen today!</p>

              {/* Role Tabs */}
              <div className="role-tabs" style={{ marginBottom: '22px' }}>
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
                  onClick={() => onNavigateToStaffSignup && onNavigateToStaffSignup()}
                  title="Switch to Staff Registration"
                >
                  Staff 👨‍🍳
                </button>
              </div>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {/* Name & Phone */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Full Name</label>
                    <div className={`input-wrap ${touched.fullName && errors.fullName ? 'has-error' : ''}`}>
                      <input
                        name="fullName"
                        type="text"
                        placeholder="John Doe"
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
                    <label>Phone</label>
                    <div className={`input-wrap ${touched.phone && errors.phone ? 'has-error' : ''}`}>
                      <input
                        name="phone"
                        type="tel"
                        placeholder="9876543210"
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

                {/* Email */}
                <div className="form-field">
                  <label>Email</label>
                  <div className={`input-wrap ${touched.email && errors.email ? 'has-error' : ''}`}>
                    <input
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  {touched.email && errors.email && (
                    <span className="field-error">⚠ {errors.email}</span>
                  )}
                </div>

                {/* Password */}
                <div className="form-field">
                  <label>Password</label>
                  <div className={`input-wrap ${touched.password && errors.password ? 'has-error' : ''}`}>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      style={{ paddingRight: '42px' }}
                    />
                    <button
                      type="button"
                      className="input-icon-right"
                      onClick={() => setShowPassword(!showPassword)}
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
                  {touched.password && errors.password && (
                    <span className="field-error">⚠ {errors.password}</span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-field">
                  <label>Confirm Password</label>
                  <div className={`input-wrap ${touched.confirmPassword && errors.confirmPassword ? 'has-error' : ''}`}>
                    <input
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <span className="field-error">⚠ {errors.confirmPassword}</span>
                  )}
                </div>

                {/* Preferred Language */}
                <div className="form-field">
                  <label>Preferred Language</label>
                  <select
                    name="language"
                    className="form-select"
                    value={formData.language}
                    onChange={handleChange}
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>

                {/* Canteen / Department */}
                <div className="form-field">
                  <label>Department / Branch</label>
                  <select
                    name="department"
                    className="form-select"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Terms */}
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

                {apiError && (
                  <div className="field-error" style={{ marginBottom: '14px', fontSize: '0.88rem' }}>
                    ⚠ {apiError}
                  </div>
                )}

                {/* Submit */}
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><span className="spinner"></span> Creating Account...</>
                  ) : 'Register'}
                </button>
              </form>

              <div className="auth-footer">
                Already have an account?
                <button type="button" onClick={onSwitchToLogin}>Login</button>
              </div>
            </>
          ) : (
            /* ── Success Screen ── */
            <div className="signup-success">
              <div className="signup-success-icon">🎉</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                Registration Complete!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.93rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Your Smart Canteen account for <strong style={{ color: 'var(--text)' }}>{formData.email}</strong> is now active.
              </p>
              <button className="btn-primary" onClick={onSwitchToLogin}>
                Proceed to Sign In →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
