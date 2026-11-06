import React, { useState } from 'react';
import './panels.css';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/auth';
import { getErrorMessage } from '../../services/api';

export default function ProfilePanel({ onClose, onNavigateToLogin }) {
  const { user, logout, setUser, isAuthenticated } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthenticated) {
    return (
      <>
        <div className="panel-overlay" onClick={onClose} />
        <div className="panel-drawer">
          <div className="panel-header">
            <h2 className="panel-title">👤 Profile</h2>
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="panel-body">
            <div className="panel-empty">
              <div className="panel-empty-icon">🔐</div>
              <p className="panel-empty-title">Not logged in</p>
              <p className="panel-empty-desc">Sign in to view your profile.</p>
            </div>
            <button className="panel-btn-primary" onClick={() => { onClose(); onNavigateToLogin && onNavigateToLogin(); }}>
              Login →
            </button>
          </div>
        </div>
      </>
    );
  }

  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || user?.email?.split('@')[0];
  const initials = displayName.charAt(0).toUpperCase();
  const roleBadge = { ADMIN: '🛡 Admin', STAFF: '👨‍🍳 Staff', FACULTY: '👨‍🏫 Faculty', STUDENT: '🎓 Student', CUSTOMER: '🎓 Student' }[user?.role] || '🎓 Student';

  async function handleSave() {
    setLoading(true);
    setError('');
    try {
      const updated = await updateProfile(form);
      setUser(updated);
      setSuccessMsg('Profile updated!');
      setEditing(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    if (!window.confirm('Are you sure you want to log out?')) return;
    await logout();
    onClose();
  }

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer">
        <div className="panel-header">
          <h2 className="panel-title">👤 My Profile</h2>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="panel-body">
          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: 12,
              boxShadow: '0 4px 20px rgba(34,197,94,0.4)'
            }}>
              {initials}
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)' }}>{displayName}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
            <span className="status-badge ready" style={{ marginTop: 8 }}>{roleBadge}</span>
          </div>

          {error && <div className="panel-error">⚠ {error}</div>}
          {successMsg && <div className="panel-success">✅ {successMsg}</div>}

          {/* Profile details */}
          <div className="panel-card" style={{ marginBottom: 20 }}>
            <div className="panel-row">
              <span className="panel-label">Email</span>
              <span className="panel-value" style={{ fontSize: '0.85rem' }}>{user?.email}</span>
            </div>
            <div className="panel-row">
              <span className="panel-label">Username</span>
              <span className="panel-value">{user?.username}</span>
            </div>
            <div className="panel-row">
              <span className="panel-label">Phone</span>
              <span className="panel-value">{user?.phone_number || '—'}</span>
            </div>
            <div className="panel-row">
              <span className="panel-label">Member since</span>
              <span className="panel-value">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</span>
            </div>
          </div>

          {/* Edit form */}
          {editing ? (
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Edit Profile</h3>
              {[
                { label: 'First Name', key: 'first_name', type: 'text' },
                { label: 'Last Name', key: 'last_name', type: 'text' },
                { label: 'Phone Number', key: 'phone_number', type: 'tel' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: '1px solid var(--border, rgba(255,255,255,0.12))',
                      background: 'var(--surface-alt, rgba(255,255,255,0.04))',
                      color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'inherit',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="panel-btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
                <button className="panel-btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <button className="panel-btn-secondary" style={{ width: '100%', marginBottom: 12 }} onClick={() => setEditing(true)}>
              ✏ Edit Profile
            </button>
          )}

          <hr className="panel-divider" />

          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '12px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontWeight: 700, fontSize: '0.9rem',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.2)'}
            onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.1)'}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );
}
