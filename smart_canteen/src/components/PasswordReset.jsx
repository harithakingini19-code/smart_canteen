import React, { useState } from 'react';
import './PasswordReset.css';
import { requestPasswordReset, confirmPasswordReset } from '../services/auth';
import { getErrorMessage } from '../services/api';

export default function PasswordReset({ theme, onToggleTheme, onSwitchToLogin }) {
  // Step 1: 'request' | Step 2: 'reset' | Step 3: 'success'
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [shakeForm, setShakeForm] = useState(false);

  const triggerShake = () => {
    setShakeForm(true);
    setTimeout(() => setShakeForm(false), 500);
  };

  // Password strength logic
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

  const pwStrength = getPasswordStrength(newPassword);

  // Email format validation
  const validateEmail = (val) => {
    if (!val.trim()) return 'Email address is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Please enter a valid email address';
    return '';
  };

  // Step 2 validations
  const validateResetFields = () => {
    const errs = {};
    if (!token.trim()) {
      errs.token = 'Reset token is required';
    }
    if (!newPassword) {
      errs.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errs.newPassword = 'Password must be at least 6 characters long';
    }
    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    return errs;
  };

  // Step 1 Submit: Request Reset Link
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true });

    const emailErr = validateEmail(email);
    if (emailErr) {
      setErrors({ email: emailErr });
      triggerShake();
      return;
    }

    setErrors({});
    setApiError('');
    setIsSubmitting(true);

    try {
      const res = await requestPasswordReset(email.trim());
      setSuccessInfo(res.message || 'Reset token generated successfully.');
      if (res.reset_token) {
        setToken(res.reset_token);
      }
      setStep(2);
    } catch (err) {
      setApiError(getErrorMessage(err));
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Submit: Reset Password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setTouched({ token: true, newPassword: true, confirmPassword: true });

    const errs = validateResetFields();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      triggerShake();
      return;
    }

    setApiError('');
    setIsSubmitting(true);

    try {
      await confirmPasswordReset({
        token: token.trim(),
        newPassword,
      });
      setStep(3);
    } catch (err) {
      setApiError(getErrorMessage(err));
      triggerShake();
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
          <p className="login-brand-tagline">Good Food, Good Mood</p>
        </div>
        <div className="login-illustration">🔐</div>
        <p className="login-left-caption">
          Reset your password securely to regain access to your account.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-right">
        <div className={`login-box ${shakeForm ? 'shake' : ''}`}>
          {/* STEP 1: REQUEST RESET LINK */}
          {step === 1 && (
            <>
              <div className="reset-header">
                <button
                  type="button"
                  className="reset-back-btn"
                  onClick={onSwitchToLogin}
                  title="Back to Login"
                >
                  ← Back to Login
                </button>
                <h1 className="login-heading">Forgot Password?</h1>
                <p className="login-subheading">
                  Enter your registered email address and we'll help you reset your password.
                </p>
              </div>

              <form className="auth-form" onSubmit={handleRequestSubmit} noValidate>
                <div className="form-field">
                  <label htmlFor="reset-email">Registered Email Address</label>
                  <div className={`input-wrap ${touched.email && errors.email ? 'has-error' : ''}`}>
                    <input
                      id="reset-email"
                      name="email"
                      type="email"
                      placeholder="e.g. student@canteen.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setApiError('');
                        if (touched.email) setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, email: true }));
                        setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
                      }}
                      autoComplete="email"
                    />
                  </div>
                  {touched.email && errors.email && (
                    <span className="field-error">⚠ {errors.email}</span>
                  )}
                </div>

                {apiError && (
                  <div className="field-error" style={{ fontSize: '0.88rem', marginTop: '4px' }}>
                    ⚠ {apiError}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><span className="spinner"></span> Sending Reset Link...</>
                  ) : 'Send Reset Link →'}
                </button>
              </form>

              <div className="auth-footer">
                Remember your password?
                <button type="button" onClick={onSwitchToLogin}>Login here</button>
              </div>
            </>
          )}

          {/* STEP 2: ENTER TOKEN & NEW PASSWORD */}
          {step === 2 && (
            <>
              <div className="reset-header">
                <button
                  type="button"
                  className="reset-back-btn"
                  onClick={() => setStep(1)}
                  title="Back to Email"
                >
                  ← Back
                </button>
                <h1 className="login-heading">Create New Password</h1>
                <p className="login-subheading">
                  Please enter the reset token and set your new password below.
                </p>
              </div>

              {successInfo && (
                <div className="reset-banner-success">
                  ✓ {successInfo}
                </div>
              )}

              <form className="auth-form" onSubmit={handleResetSubmit} noValidate style={{ marginTop: '14px' }}>
                {/* Reset Token */}
                <div className="form-field">
                  <label htmlFor="reset-token">Reset Code / Token</label>
                  <div className={`input-wrap ${touched.token && errors.token ? 'has-error' : ''}`}>
                    <input
                      id="reset-token"
                      name="token"
                      type="text"
                      placeholder="Enter reset token"
                      value={token}
                      onChange={(e) => {
                        setToken(e.target.value);
                        setApiError('');
                        if (touched.token && e.target.value.trim()) {
                          setErrors((prev) => ({ ...prev, token: '' }));
                        }
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, token: true }))}
                    />
                  </div>
                  {touched.token && errors.token && (
                    <span className="field-error">⚠ {errors.token}</span>
                  )}
                </div>

                {/* New Password */}
                <div className="form-field">
                  <label htmlFor="new-password">New Password</label>
                  <div className={`input-wrap ${touched.newPassword && errors.newPassword ? 'has-error' : ''}`}>
                    <input
                      id="new-password"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password (min. 6 chars)"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setApiError('');
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, newPassword: true }))}
                      style={{ paddingRight: '42px' }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="input-icon-right"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {newPassword && (
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
                  {touched.newPassword && errors.newPassword && (
                    <span className="field-error">⚠ {errors.newPassword}</span>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="form-field">
                  <label htmlFor="confirm-password">Confirm New Password</label>
                  <div className={`input-wrap ${touched.confirmPassword && errors.confirmPassword ? 'has-error' : ''}`}>
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setApiError('');
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
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

                {apiError && (
                  <div className="field-error" style={{ fontSize: '0.88rem' }}>
                    ⚠ {apiError}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><span className="spinner"></span> Resetting Password...</>
                  ) : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {/* STEP 3: SUCCESS SCREEN */}
          {step === 3 && (
            <div className="success-box">
              <div className="success-icon">✅</div>
              <h2 className="success-title">Password Reset Successful!</h2>
              <p className="success-desc">
                Your password has been reset successfully. You can now log in using your new password.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={onSwitchToLogin}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
