import React from 'react';
import './CreateAccount.css';

/**
 * CreateAccount – Role Selection Page
 * Shown after clicking "Register" on the Home Page.
 * Presents four options: Student, Faculty, Staff, Admin.
 *
 * Navigation:
 *  Student  → onSelectStudentFaculty('STUDENT')
 *  Faculty  → onSelectStudentFaculty('FACULTY')
 *  Staff    → onSelectStaff()
 *  Admin    → onSelectAdmin()
 */
export default function CreateAccount({
  theme,
  onToggleTheme,
  onSelectStudentFaculty,
  onSelectStaff,
  onSelectAdmin,
  onBackToHome,
}) {
  const roles = [
    {
      id: 'student',
      icon: '🎓',
      label: 'Student',
      description: 'Register as a student to pre-order meals and skip the queue.',
      color: '#dcfce7',
      iconBg: '#16a34a',
      onClick: () => onSelectStudentFaculty && onSelectStudentFaculty('STUDENT'),
    },
    {
      id: 'faculty',
      icon: '👨‍🏫',
      label: 'Faculty',
      description: 'Register as faculty to access the canteen with faculty privileges.',
      color: '#dbeafe',
      iconBg: '#2563eb',
      onClick: () => onSelectStudentFaculty && onSelectStudentFaculty('FACULTY'),
    },
    {
      id: 'staff',
      icon: '👨‍🍳',
      label: 'Staff',
      description: 'Register as canteen staff to manage orders and keep things running.',
      color: '#fef9c3',
      iconBg: '#d97706',
      onClick: () => onSelectStaff && onSelectStaff(),
    },
    {
      id: 'admin',
      icon: '🛡️',
      label: 'Admin',
      description: 'Register as an administrator to manage the entire canteen system.',
      color: '#fee2e2',
      iconBg: '#dc2626',
      onClick: () => onSelectAdmin && onSelectAdmin(),
    },
  ];

  return (
    <div className="create-account-page">
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
      <div className="create-account-left">
        <div className="ca-brand">
          <div className="ca-brand-logo">
            Smart<span>Canteen</span>
          </div>
        </div>
        <div className="ca-illustration">🥗</div>
        <p className="ca-left-caption">
          Fresh, Healthy &amp; Delicious Food<br />Delivered to you!
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="create-account-right">
        <div className="create-account-box">
          <h1 className="ca-heading">Create Account</h1>
          <p className="ca-subheading">Join our Canteen today!</p>

          <div className="ca-role-grid">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                className="ca-role-card"
                onClick={r.onClick}
                aria-label={`Register as ${r.label}`}
              >
                <div
                  className="ca-role-icon"
                  style={{ background: r.color, color: r.iconBg }}
                >
                  {r.icon}
                </div>
                <div className="ca-role-info">
                  <span className="ca-role-label">{r.label}</span>
                  <span className="ca-role-desc">{r.description}</span>
                </div>
                <span className="ca-role-arrow">›</span>
              </button>
            ))}
          </div>

          <div className="ca-footer">
            Already have an account?
            <button type="button" onClick={onBackToHome}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
