import React, { useEffect, useState } from 'react';
import './panels.css';
import { useAuth } from '../../context/AuthContext';
import { getPaymentHistory, processPayment, topUpWallet } from '../../services/payments';
import { getOrders } from '../../services/orders';
import { getErrorMessage } from '../../services/api';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

const STATUS_MAP = {
  COMPLETED: { cls: 'ready', label: 'Paid' },
  PENDING:   { cls: 'pending', label: 'Pending' },
  FAILED:    { cls: 'cancelled', label: 'Failed' },
  REFUNDED:  { cls: 'completed', label: 'Refunded' },
};

export default function WalletPanel({ onClose }) {
  const { isAuthenticated, user, setUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [payMethod, setPayMethod] = useState('WALLET');
  const [toppingUp, setToppingUp] = useState(false);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [pData, oData] = await Promise.all([getPaymentHistory(), getOrders()]);
      setPayments(pData);
      setUnpaidOrders(oData.filter(o => o.payment_status === 'PENDING' && o.status !== 'CANCELLED'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleTopUp(amount) {
    setToppingUp(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await topUpWallet(amount);
      if (res.user) setUser(res.user);
      setSuccessMsg(`Added ₹${amount} to wallet!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setToppingUp(false);
    }
  }

  async function handlePay(orderId) {
    setPayingOrderId(orderId);
    setError('');
    setSuccessMsg('');
    try {
      await processPayment(orderId, payMethod);
      setSuccessMsg('Payment processed successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPayingOrderId(null);
    }
  }

  // Total spent
  const totalSpent = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  if (!isAuthenticated) {
    return (
      <>
        <div className="panel-overlay" onClick={onClose} />
        <div className="panel-drawer">
          <div className="panel-header">
            <h2 className="panel-title">💳 Wallet &amp; Payments</h2>
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="panel-body">
            <div className="panel-empty">
              <div className="panel-empty-icon">🔐</div>
              <p className="panel-empty-title">Login Required</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer">
        <div className="panel-header">
          <h2 className="panel-title">💳 Wallet &amp; Payments</h2>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="panel-body">
          {loading && (
            <div className="panel-loading">
              <div className="panel-spinner" />
              <span>Loading payment data…</span>
            </div>
          )}

          {error && <div className="panel-error">⚠ {error}</div>}
          {successMsg && <div className="panel-success">✅ {successMsg}</div>}

          {!loading && (
            <>
              {/* Wallet Balance Card */}
              <div className="panel-card" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(59,130,246,0.12))', borderColor: 'rgba(34,197,94,0.3)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Wallet Balance</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary)' }}>
                      ₹{parseFloat(user?.wallet_balance || 0).toFixed(2)}
                    </div>
                  </div>
                  <span style={{ fontSize: '2.5rem' }}>💳</span>
                </div>

                {/* Top-up buttons */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>Add Funds to Wallet:</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[100, 200, 500].map(amt => (
                      <button
                        key={amt}
                        onClick={() => handleTopUp(amt)}
                        disabled={toppingUp}
                        style={{
                          flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid var(--primary)',
                          background: 'rgba(34,197,94,0.1)', color: 'var(--primary)', fontWeight: 700,
                          fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit'
                        }}
                      >
                        + ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Spent Summary card */}
              <div className="panel-card" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Spent at Canteen</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>₹{totalSpent.toFixed(2)}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{payments.filter(p => p.status === 'COMPLETED').length} completed payments</div>
              </div>

              {/* Unpaid orders */}
              {unpaidOrders.length > 0 && (
                <>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    ⚠ Pending Payments
                  </h3>

                  {/* Payment method selector */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {[
                      { m: 'WALLET', label: '👛 Wallet' },
                      { m: 'ONLINE', label: '💳 Online' },
                      { m: 'CASH', label: '💵 Cash' },
                    ].map(({ m, label }) => (
                      <button
                        key={m}
                        onClick={() => setPayMethod(m)}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: 8, border: `2px solid ${payMethod === m ? 'var(--primary)' : 'var(--border, rgba(255,255,255,0.1))'}`,
                          background: payMethod === m ? 'rgba(34,197,94,0.1)' : 'transparent',
                          color: payMethod === m ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.2s'
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {payMethod === 'ONLINE' && (
                    <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', fontSize: '0.78rem', color: '#fbbf24', marginBottom: 12 }}>
                      ⚠ TEST MODE — No real payment will occur.
                    </div>
                  )}

                  {unpaidOrders.map(order => (
                    <div key={order.id} className="panel-card" style={{ borderColor: 'rgba(251,191,36,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{order.order_number}</div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{parseFloat(order.final_amount).toFixed(2)}</div>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>{formatDate(order.created_at)}</div>
                      <button
                        className="panel-btn-primary"
                        onClick={() => handlePay(order.id)}
                        disabled={payingOrderId === order.id}
                      >
                        {payingOrderId === order.id ? 'Processing…' : `Pay Now →`}
                      </button>
                    </div>
                  ))}
                  <hr className="panel-divider" />
                </>
              )}

              {/* Payment history */}
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Transaction History
              </h3>

              {payments.length === 0 && (
                <div className="panel-empty" style={{ padding: '30px 20px' }}>
                  <div className="panel-empty-icon">💸</div>
                  <p className="panel-empty-title">No transactions yet</p>
                </div>
              )}

              {payments.map(payment => {
                const st = STATUS_MAP[payment.status] || { cls: 'pending', label: payment.status };
                const method = payment.payment_method === 'ONLINE' ? '💳 Online' : '💵 Cash';
                return (
                  <div key={payment.id} className="panel-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem' }}>{payment.order?.order_number || `Order #${payment.order}`}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>{method} · {formatDate(payment.timestamp)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>₹{parseFloat(payment.amount).toFixed(2)}</div>
                        <span className={`status-badge ${st.cls}`} style={{ marginTop: 4, display: 'inline-block' }}>{st.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                      Txn: {payment.transaction_id?.toString().slice(0, 12)}…
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </>
  );
}
