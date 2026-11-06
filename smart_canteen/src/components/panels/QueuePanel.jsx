import React, { useEffect, useState, useRef } from 'react';
import './panels.css';
import { useAuth } from '../../context/AuthContext';
import { getLiveQueue, getAllQueueTokens } from '../../services/queue';
import { getErrorMessage } from '../../services/api';

const TOKEN_STATUS_MAP = {
  WAITING:   { label: 'Waiting',          cls: 'waiting',   icon: '⏳' },
  PREPARING: { label: 'Preparing',        cls: 'preparing', icon: '👨‍🍳' },
  READY:     { label: 'Ready for Pickup', cls: 'ready',     icon: '🔔' },
  PICKED_UP: { label: 'Picked Up',        cls: 'completed', icon: '✔' },
  CANCELLED: { label: 'Cancelled',        cls: 'cancelled', icon: '✕' },
};

export default function QueuePanel({ onClose }) {
  const { isAuthenticated, user } = useAuth();
  const [liveData, setLiveData] = useState(null);
  const [myTokens, setMyTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    loadQueue();
    // Fast refresh every 10 seconds for real-time order tracking
    intervalRef.current = setInterval(loadQueue, 10000);
    return () => clearInterval(intervalRef.current);
  }, [isAuthenticated]);

  async function loadQueue() {
    setError('');
    try {
      const live = await getLiveQueue();
      setLiveData(live);

      if (isAuthenticated) {
        const allTokens = await getAllQueueTokens();
        setMyTokens(allTokens.filter(t => t.user === user?.id || t.user_id === user?.id || t.order?.user === user?.id).slice(0, 5));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const waitingCount = liveData?.waiting_count ?? 0;
  const estimatedWait = liveData?.estimated_wait_time_minutes ?? 10;
  const preparing = liveData?.preparing || [];
  const readyForPickup = liveData?.ready_for_pickup || [];

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer" style={{ width: '100%', maxWidth: '480px' }}>
        <div className="panel-header">
          <h2 className="panel-title">📺 Live Order Tracker &amp; Queue</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="panel-btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 10px' }}
              onClick={loadQueue}
              title="Refresh Queue"
            >
              🔄 Refresh
            </button>
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="panel-body">
          {loading && (
            <div className="panel-loading">
              <div className="panel-spinner" />
              <span>Fetching live order status…</span>
            </div>
          )}

          {error && <div className="panel-error">⚠ {error}</div>}

          {!loading && (
            <>
              {/* Canteen Queue Overview Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div className="panel-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{waitingCount}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Orders Waiting</div>
                </div>
                <div className="panel-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fbbf24' }}>{estimatedWait}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Min Est. Wait</div>
                </div>
              </div>

              {/* My active tokens */}
              {isAuthenticated && myTokens.length > 0 && (
                <>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    🎯 Your Orders in Progress
                  </h3>
                  {myTokens.map((t, idx) => {
                    const stInfo = TOKEN_STATUS_MAP[t.status] || { label: t.status, cls: 'pending', icon: '⏳' };
                    return (
                      <div key={t.id} className="panel-card" style={{ borderColor: 'rgba(34,197,94,0.3)', marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1.05rem' }}>Token #{t.token_number || t.queue_number}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.order_number || t.order?.order_number || `Order #${t.order?.id || t.order}`}</div>
                          </div>
                          <span className={`status-badge ${stInfo.cls}`}>{stInfo.icon} {stInfo.label}</span>
                        </div>

                        {/* Order Progress Line */}
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <span>Queue Position: <strong>#{idx + 1}</strong></span>
                            <span>Est. Prep: <strong>{t.estimated_wait_time_minutes} mins</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <hr className="panel-divider" />
                </>
              )}

              {/* Ready for pickup */}
              {readyForPickup.length > 0 && (
                <>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    🔔 Ready for Pickup Counter
                  </h3>
                  {readyForPickup.map(t => (
                    <div key={t.id} className="panel-card" style={{ borderColor: 'rgba(74,222,128,0.3)', background: 'rgba(34,197,94,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>Token #{t.token_number}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.order?.order_number || `Order #${t.order}`}</div>
                        </div>
                        <span className="status-badge ready">🔔 Ready for Collection!</span>
                      </div>
                    </div>
                  ))}
                  <hr className="panel-divider" />
                </>
              )}

              {/* Preparing */}
              {preparing.length > 0 && (
                <>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    👨‍🍳 Currently Preparing in Kitchen
                  </h3>
                  {preparing.map(t => (
                    <div key={t.id} className="panel-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>Token #{t.token_number}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.order?.order_number || `Order #${t.order}`}</div>
                        </div>
                        <span className="status-badge preparing">👨‍🍳 Preparing</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        ~{t.estimated_wait_time_minutes} mins estimated remaining
                      </div>
                    </div>
                  ))}
                  <hr className="panel-divider" />
                </>
              )}

              {readyForPickup.length === 0 && preparing.length === 0 && (
                <div className="panel-empty" style={{ padding: '30px 20px' }}>
                  <div className="panel-empty-icon">😴</div>
                  <p className="panel-empty-title">Queue is quiet</p>
                  <p className="panel-empty-desc">No active orders in preparation right now.</p>
                </div>
              )}

              {/* Auto-refresh indicator */}
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 16 }}>
                ⚡ Real-time status sync active (Refreshes automatically)
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
