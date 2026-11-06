import React, { useEffect, useState } from 'react';
import './panels.css';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/notifications';
import { getErrorMessage } from '../../services/api';

function formatTimestamp(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function NotificationsPanel({ onClose, onOpenQueue, onOpenOrders }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    setError('');
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  }

  async function handleMarkAllRead() {
    setActionLoading(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer" style={{ width: '100%', maxWidth: '460px' }}>
        <div className="panel-header">
          <h2 className="panel-title">
            🔔 Notifications {unreadCount > 0 && <span style={{ fontSize: '0.8rem', background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 10, marginLeft: 6 }}>{unreadCount} new</span>}
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button
                className="panel-btn-secondary"
                style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                onClick={handleMarkAllRead}
                disabled={actionLoading}
              >
                Mark all read
              </button>
            )}
            <button
              className="panel-btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 10px' }}
              onClick={loadNotifications}
              title="Refresh"
            >
              🔄
            </button>
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="panel-body">
          {loading && (
            <div className="panel-loading">
              <div className="panel-spinner" />
              <span>Loading notifications…</span>
            </div>
          )}

          {error && <div className="panel-error">⚠ {error}</div>}

          {!loading && notifications.length === 0 && (
            <div className="panel-empty">
              <div className="panel-empty-icon">🔔</div>
              <p className="panel-empty-title">No notifications</p>
              <p className="panel-empty-desc">You will receive updates when your food is ready or orders change status.</p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications.map((n) => {
                const isFoodReady = (n.message || '').toLowerCase().includes('ready') || (n.title || '').toLowerCase().includes('ready');

                return (
                  <div
                    key={n.id}
                    className="panel-card"
                    style={{
                      background: n.is_read ? 'var(--surface-2)' : 'rgba(34, 197, 94, 0.08)',
                      borderColor: !n.is_read ? 'rgba(34, 197, 94, 0.35)' : 'var(--border)',
                      borderLeft: isFoodReady ? '4px solid #22c55e' : '4px solid var(--primary)',
                      padding: '12px 14px',
                    }}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '1.1rem' }}>{isFoodReady ? '🎉' : '📢'}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isFoodReady ? '#16a34a' : 'var(--text)' }}>
                          {n.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {formatTimestamp(n.created_at)}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: '4px 0 8px', lineHeight: 1.4 }}>
                      {n.message}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Channel: {n.channel || 'IN-APP'}
                      </span>
                      {isFoodReady && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            if (onOpenQueue) onOpenQueue();
                          }}
                          style={{
                            background: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          View Queue Token →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
