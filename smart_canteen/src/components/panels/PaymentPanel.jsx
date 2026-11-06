import React, { useState } from 'react';
import './panels.css';
import { useAuth } from '../../context/AuthContext';
import { processPayment } from '../../services/payments';
import { getErrorMessage } from '../../services/api';

export default function PaymentPanel({ order, onClose, onSuccess }) {
  const { user } = useAuth();
  const [payMethod, setPayMethod] = useState('ONLINE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);

  if (!order) return null;

  const amount = parseFloat(order.final_amount || order.total_amount || 0);

  async function handlePay() {
    setError('');

    // Wallet balance validation
    if (payMethod === 'WALLET') {
      const walletBal = parseFloat(user?.wallet_balance || 0);
      if (walletBal < amount) {
        setError(`Insufficient wallet balance. Available: ₹${walletBal.toFixed(2)}. Please top up or choose another method.`);
        return;
      }
    }

    setLoading(true);
    try {
      await processPayment(order.id, payMethod);
      setPaid(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const PAY_OPTIONS = [
    { value: 'ONLINE', icon: '💳', label: 'Online Payment (UPI / Card)', note: 'Instant confirmation' },
    { value: 'WALLET', icon: '👛', label: 'Wallet Balance', note: `Available: ₹${parseFloat(user?.wallet_balance || 0).toFixed(2)}` },
    { value: 'CASH',   icon: '💵', label: 'Cash on Counter', note: 'Pay when you collect your order' },
  ];

  return (
    <>
      <div className="panel-overlay" onClick={onClose} style={{ zIndex: 1100 }} />
      <div
        className="panel-drawer"
        style={{
          zIndex: 1101,
          maxWidth: '460px',
          height: 'auto',
          maxHeight: '90vh',
          borderRadius: 'var(--radius-lg)',
          margin: 'auto',
          top: 0, bottom: 0, left: 0, right: 0,
          position: 'fixed',
        }}
      >
        <div className="panel-header">
          <h2 className="panel-title">💳 Make Payment</h2>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="panel-body" style={{ padding: '20px 24px' }}>
          {paid ? (
            /* ── Success Screen ── */
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
                Payment Successful!
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
                Order <strong>{order.order_number}</strong> has been paid successfully.
              </p>
              <div className="panel-card" style={{ textAlign: 'left', marginBottom: 20 }}>
                <div className="panel-row">
                  <span className="panel-label">Order Ref</span>
                  <span className="panel-value">{order.order_number}</span>
                </div>
                <div className="panel-row">
                  <span className="panel-label">Amount Paid</span>
                  <span className="panel-value" style={{ color: 'var(--primary)' }}>₹{amount.toFixed(2)}</span>
                </div>
                <div className="panel-row">
                  <span className="panel-label">Method</span>
                  <span className="panel-value">{payMethod}</span>
                </div>
              </div>
              <button className="panel-btn-primary" onClick={onClose}>
                ✓ Done — View Orders
              </button>
            </div>
          ) : (
            <>
              {/* Order Summary */}
              <div className="panel-card" style={{ marginBottom: 20, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Order Reference
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', marginBottom: 4 }}>
                  {order.order_number}
                </div>
                <div className="panel-row" style={{ marginTop: 10, fontSize: '1rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text)' }}>Amount Due</span>
                  <span style={{ color: 'var(--primary)', fontSize: '1.3rem', fontWeight: 900 }}>
                    ₹{amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              {order.items && order.items.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                    📦 Items Ordered
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {order.items.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text)' }}>{item.quantity}× {item.food_item_name}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{parseFloat(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
                  🔐 Select Payment Method
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PAY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px',
                        borderRadius: 12,
                        border: `2px solid ${payMethod === opt.value ? 'var(--primary)' : 'var(--border, rgba(255,255,255,0.1))'}`,
                        background: payMethod === opt.value ? 'rgba(34,197,94,0.07)' : 'transparent',
                        cursor: 'pointer', transition: 'border-color 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        value={opt.value}
                        checked={payMethod === opt.value}
                        onChange={() => setPayMethod(opt.value)}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.93rem' }}>{opt.icon} {opt.label}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{opt.note}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {payMethod === 'ONLINE' && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', fontSize: '0.8rem', color: '#fbbf24', marginBottom: 16 }}>
                  ⚠ Simulated online payment — confirmed immediately on click.
                </div>
              )}

              {error && <div className="panel-error" style={{ marginBottom: 14 }}>⚠ {error}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="panel-btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                  Cancel
                </button>
                <button className="panel-btn-primary" style={{ flex: 1.5 }} onClick={handlePay} disabled={loading}>
                  {loading ? 'Processing…' : `Pay ₹${amount.toFixed(2)} →`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
