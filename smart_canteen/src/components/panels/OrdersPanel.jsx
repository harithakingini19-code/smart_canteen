import React, { useEffect, useState } from 'react';
import './panels.css';
import { useAuth } from '../../context/AuthContext';
import { getOrders, cancelOrder } from '../../services/orders';
import { getErrorMessage } from '../../services/api';
import ReviewModal from './ReviewModal';

const STATUS_MAP = {
  CONFIRMED:        { label: 'Confirmed',        cls: 'confirmed', icon: '✅', stepIndex: 1 },
  PREPARING:        { label: 'Preparing',        cls: 'preparing', icon: '👨‍🍳', stepIndex: 2 },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', cls: 'ready',     icon: '🔔', stepIndex: 3 },
  COMPLETED:        { label: 'Completed',        cls: 'completed', icon: '✔',  stepIndex: 4 },
  CANCELLED:        { label: 'Cancelled',        cls: 'cancelled', icon: '✕',  stepIndex: 0 },
};

const PAY_STATUS_MAP = {
  PENDING:   { label: 'Payment Pending', cls: 'pending' },
  COMPLETED: { label: 'Paid',            cls: 'ready'   },
  FAILED:    { label: 'Payment Failed',  cls: 'cancelled' },
  REFUNDED:  { label: 'Refunded',        cls: 'completed' },
};

const TRACK_STEPS = [
  { key: 'CONFIRMED',        label: 'Confirmed',  icon: '✅' },
  { key: 'PREPARING',        label: 'Preparing',  icon: '👨‍🍳' },
  { key: 'READY_FOR_PICKUP', label: 'Ready',      icon: '🔔' },
  { key: 'COMPLETED',        label: 'Delivered',  icon: '✔' },
];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function OrdersPanel({ onClose, onPayOrder }) {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab]   = useState('all'); // 'all' | 'active' | 'completed'

  // Review modal state
  const [selectedItemForReview, setSelectedItemForReview] = useState(null);
  const [reviewOrderId, setReviewOrderId]                 = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  async function loadOrders() {
    setError('');
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(orderId) {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      await loadOrders();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="panel-overlay" onClick={onClose} />
        <div className="panel-drawer">
          <div className="panel-header">
            <h2 className="panel-title">🧾 My Orders</h2>
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="panel-body">
            <div className="panel-empty">
              <div className="panel-empty-icon">🔐</div>
              <p className="panel-empty-title">Login Required</p>
              <p className="panel-empty-desc">Please sign in to view your order history.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Tab filter
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'active')    return !['COMPLETED', 'CANCELLED'].includes(o.status);
    if (activeTab === 'completed') return ['COMPLETED', 'CANCELLED'].includes(o.status);
    return true;
  });

  const activeCount    = orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length;
  const completedCount = orders.filter((o) => ['COMPLETED', 'CANCELLED'].includes(o.status)).length;

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer" style={{ width: '100%', maxWidth: '480px' }}>
        <div className="panel-header">
          <h2 className="panel-title">🧾 My Orders</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="panel-btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 10px' }}
              onClick={loadOrders}
              title="Refresh Orders"
            >
              🔄 Refresh
            </button>
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── Tab Filter ── */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          {[
            { key: 'all',       label: `All (${orders.length})` },
            { key: 'active',    label: `Active (${activeCount})` },
            { key: 'completed', label: `History (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '10px 6px', border: 'none',
                background: activeTab === tab.key ? 'rgba(34,197,94,0.1)' : 'transparent',
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="panel-body">
          {loading && (
            <div className="panel-loading">
              <div className="panel-spinner" />
              <span>Loading order history…</span>
            </div>
          )}

          {error && <div className="panel-error">⚠ {error}</div>}

          {!loading && filteredOrders.length === 0 && (
            <div className="panel-empty">
              <div className="panel-empty-icon">🧾</div>
              <p className="panel-empty-title">No orders found</p>
              <p className="panel-empty-desc">
                {activeTab === 'active'
                  ? 'You have no active orders right now.'
                  : activeTab === 'completed'
                  ? 'No completed or cancelled orders yet.'
                  : 'Your placed orders and order history will appear here.'}
              </p>
            </div>
          )}

          {filteredOrders.map((order) => {
            const status    = STATUS_MAP[order.status] || { label: order.status, cls: 'pending', icon: '●', stepIndex: 1 };
            const payStatus = PAY_STATUS_MAP[order.payment_status] || {};
            const isExpanded  = expandedId === order.id;
            const isConfirmed = order.status === 'CONFIRMED';
            const isCompleted = order.status === 'COMPLETED';
            const isCancelled = order.status === 'CANCELLED';
            const needsPayment = order.payment_status === 'PENDING' && !isCancelled;

            return (
              <div key={order.id} className="panel-card" style={{ marginBottom: 14 }}>

                {/* ── Pay Now Banner (prominent) ── */}
                {needsPayment && (
                  <div style={{
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 10,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.88rem' }}>💳 Payment Required</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount due: ₹{parseFloat(order.final_amount).toFixed(2)}</div>
                    </div>
                    <button
                      className="panel-btn-primary"
                      style={{ width: 'auto', padding: '8px 16px', fontSize: '0.82rem' }}
                      onClick={() => onPayOrder && onPayOrder(order)}
                    >
                      Pay Now →
                    </button>
                  </div>
                )}

                {/* ── Order Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>
                        {order.order_number}
                      </span>
                      {order.queue_number && (
                        <span style={{
                          fontSize: '0.75rem', background: 'rgba(34,197,94,0.15)',
                          color: 'var(--primary)', padding: '2px 8px', borderRadius: 6, fontWeight: 700
                        }}>
                          Token #{order.queue_number}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatDate(order.created_at)}
                      {order.estimated_prep_time_minutes && !isCompleted && !isCancelled && (
                        <span> • ⏱ Est. Wait: ~{order.estimated_prep_time_minutes} min</span>
                      )}
                    </div>
                  </div>
                  <span className={`status-badge ${status.cls}`}>
                    {status.icon} {status.label}
                  </span>
                </div>

                {/* ── 3.8: Track Order — Visual Progress Tracker ── */}
                {!isCancelled && (
                  <div style={{
                    background: 'var(--surface-2)', padding: '12px 14px',
                    borderRadius: 'var(--radius-md)', margin: '10px 0',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📍 Order Status Tracker
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                      {TRACK_STEPS.map((st, idx) => {
                        const isCurrent = order.status === st.key;
                        const isPassed  = status.stepIndex > (idx + 1);
                        return (
                          <React.Fragment key={st.key}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: isCurrent ? 'var(--primary)' : isPassed ? 'var(--primary-dark, #16a34a)' : 'var(--border)',
                                color: isCurrent || isPassed ? '#fff' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.75rem', fontWeight: 700, marginBottom: 4,
                                transition: 'all 0.3s',
                                boxShadow: isCurrent ? '0 0 8px rgba(34,197,94,0.5)' : 'none',
                              }}>
                                {isPassed ? '✓' : isCurrent ? st.icon : idx + 1}
                              </div>
                              <span style={{
                                fontSize: '0.65rem', fontWeight: isCurrent ? 700 : 500,
                                color: isCurrent ? 'var(--primary)' : isPassed ? 'var(--text)' : 'var(--text-muted)',
                                textAlign: 'center', whiteSpace: 'nowrap',
                              }}>
                                {st.label}
                              </span>
                            </div>
                            {idx < TRACK_STEPS.length - 1 && (
                              <div style={{
                                flex: 1, height: 3, margin: '0 2px', marginBottom: 18,
                                background: isPassed ? 'var(--primary)' : 'var(--border)',
                                borderRadius: 2, transition: 'background 0.3s',
                              }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Cancelled badge ── */}
                {isCancelled && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: '0.82rem', color: '#f87171' }}>
                    ✕ This order was cancelled
                  </div>
                )}

                {/* ── Items summary ── */}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                  {order.items?.slice(0, 2).map(i => `${i.quantity}× ${i.food_item_name}`).join(', ')}
                  {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                </div>

                {/* ── Price + Payment Status ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>
                    ₹{parseFloat(order.final_amount).toFixed(2)}
                  </span>
                  <span className={`status-badge ${payStatus.cls || 'pending'}`}>
                    {payStatus.label || order.payment_status}
                  </span>
                </div>

                {/* ── Expand/collapse details ── */}
                <button
                  className="panel-btn-secondary"
                  style={{ width: '100%', marginBottom: 8, fontSize: '0.8rem' }}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  {isExpanded ? '▲ Hide Details' : '▼ View Full Order Details'}
                </button>

                {isExpanded && (
                  <div style={{ marginBottom: 10 }}>
                    <hr className="panel-divider" />
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                      Items Breakdown
                    </div>
                    {order.items?.map(item => (
                      <div key={item.id} style={{ marginBottom: 10 }}>
                        <div className="panel-row">
                          <span className="panel-label" style={{ fontWeight: 600, color: 'var(--text)' }}>
                            {item.quantity}× {item.food_item_name}
                          </span>
                          <span className="panel-value">₹{parseFloat(item.subtotal).toFixed(2)}</span>
                        </div>

                        {/* 3.10 Rate button for completed order items */}
                        {isCompleted && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                            <button
                              onClick={() => { setSelectedItemForReview(item); setReviewOrderId(order.id); }}
                              style={{
                                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)',
                                color: '#f59e0b', fontSize: '0.75rem', padding: '4px 12px',
                                borderRadius: 20, cursor: 'pointer', fontWeight: 700,
                                fontFamily: 'inherit', transition: 'background 0.2s',
                              }}
                            >
                              ⭐ Rate This Item
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    <hr className="panel-divider" />
                    <div className="panel-row">
                      <span className="panel-label">Scheduled Pickup</span>
                      <span className="panel-value">{order.pickup_time || 'ASAP'}</span>
                    </div>
                    <div className="panel-row">
                      <span className="panel-label">Est. Preparation</span>
                      <span className="panel-value">{order.estimated_prep_time_minutes} mins</span>
                    </div>
                    <div className="panel-row" style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 6 }}>
                      <span style={{ color: 'var(--text)' }}>Total Paid</span>
                      <span style={{ color: 'var(--primary)' }}>₹{parseFloat(order.final_amount).toFixed(2)}</span>
                    </div>
                    {order.special_instructions && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 8 }}>
                        📝 Note: {order.special_instructions}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Actions: Pay / Cancel ── */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {needsPayment && (
                    <button
                      className="panel-btn-primary"
                      style={{ flex: 1, padding: '9px 12px', fontSize: '0.85rem' }}
                      onClick={() => onPayOrder && onPayOrder(order)}
                    >
                      💳 Pay Now
                    </button>
                  )}
                  {/* 3.9 Cancel Order — only when CONFIRMED */}
                  {isConfirmed && (
                    <button
                      className="panel-btn-danger"
                      style={{ flex: needsPayment ? 'none' : 1 }}
                      onClick={() => handleCancel(order.id)}
                      disabled={cancellingId === order.id}
                    >
                      {cancellingId === order.id ? 'Cancelling…' : '✕ Cancel Order'}
                    </button>
                  )}
                  {/* 3.10 Rate Order (whole order) when completed */}
                  {isCompleted && (
                    <button
                      className="panel-btn-secondary"
                      style={{ flex: 1, fontSize: '0.82rem', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)' }}
                      onClick={() => {
                        if (order.items?.length > 0) {
                          setSelectedItemForReview(order.items[0]);
                          setReviewOrderId(order.id);
                        }
                      }}
                    >
                      ⭐ Rate Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3.10 Review Modal */}
      {selectedItemForReview && (
        <ReviewModal
          key={`order-review-${selectedItemForReview.food_item || selectedItemForReview.id}`}
          orderItem={selectedItemForReview}
          selectedFoodName={selectedItemForReview.food_item_name}
          orderId={reviewOrderId}
          onClose={() => setSelectedItemForReview(null)}
          onSuccess={() => { loadOrders(); setSelectedItemForReview(null); }}
        />
      )}
    </>
  );
}
