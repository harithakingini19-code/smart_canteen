import React from 'react';
import './panels.css';

export default function OrderConfirmationModal({ order, onClose, onTrackOrder }) {
  if (!order) return null;

  const formatDate = (iso) => {
    if (!iso) return new Date().toLocaleString();
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const items = order.items || [];

  return (
    <>
      <div className="panel-overlay" onClick={onClose} style={{ zIndex: 1100 }} />
      <div
        className="panel-drawer"
        style={{
          zIndex: 1101,
          maxWidth: '480px',
          height: 'auto',
          maxHeight: '90vh',
          borderRadius: 'var(--radius-lg)',
          margin: 'auto',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          position: 'fixed',
        }}
      >
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="panel-title" style={{ color: 'var(--success)' }}>
            🎉 Order Confirmed!
          </h2>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="panel-body" style={{ padding: '20px 24px' }}>
          {/* Order Banner */}
          <div
            className="panel-card"
            style={{
              textAlign: 'center',
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              marginBottom: '20px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Order Reference Number
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', margin: '4px 0 6px' }}>
              {order.order_number}
            </div>
            {order.queue_number && (
              <div style={{ margin: '6px 0' }}>
                <span style={{
                  fontSize: '0.9rem', fontWeight: 800, background: 'var(--primary)',
                  color: '#fff', padding: '4px 12px', borderRadius: 8
                }}>
                  Queue Token #{order.queue_number}
                </span>
              </div>
            )}
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Placed on {formatDate(order.created_at)}
            </div>
          </div>

          {/* Details Summary */}
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
            📦 Ordered Items ({items.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {items.map((item) => (
              <div
                key={item.id || item.food_item_name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.9rem',
                  padding: '8px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{item.quantity}× </span>
                  <span style={{ color: 'var(--text)' }}>{item.food_item_name || item.name}</span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  ₹{parseFloat(item.subtotal || item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Prep time & Payment info */}
          <div className="panel-card" style={{ marginBottom: '20px' }}>
            <div className="panel-row">
              <span className="panel-label">Estimated Preparation</span>
              <span className="panel-value" style={{ color: 'var(--warning)', fontWeight: 700 }}>
                ~{order.estimated_prep_time_minutes || 15} mins
              </span>
            </div>
            <div className="panel-row">
              <span className="panel-label">Scheduled Pickup</span>
              <span className="panel-value">{order.pickup_time || 'ASAP'}</span>
            </div>
            <div className="panel-row">
              <span className="panel-label">Payment Status</span>
              <span className="panel-value" style={{ color: 'var(--success)', fontWeight: 700 }}>
                {order.payment_status === 'COMPLETED' ? '✓ Paid' : 'Pending'}
              </span>
            </div>
            <div className="panel-row" style={{ fontSize: '1rem', fontWeight: 800, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text)' }}>Total Paid</span>
              <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>
                ₹{parseFloat(order.final_amount || order.total_amount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="panel-btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="panel-btn-primary"
              style={{ flex: 1.5 }}
              onClick={() => {
                onClose();
                if (onTrackOrder) onTrackOrder(order);
              }}
            >
              📺 Track Order →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
