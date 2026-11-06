import React, { useState } from 'react';
import './panels.css';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { placeOrder } from '../../services/orders';
import { processPayment } from '../../services/payments';
import { getErrorMessage } from '../../services/api';
import { decrementFoodQuantities } from '../../services/menu';
import OrderConfirmationModal from './OrderConfirmationModal';

const STEPS = ['Cart Review', 'Instructions', 'Payment', 'Done'];

export default function PreOrderPanel({ onClose, onSuccess }) {
  const { isAuthenticated, user } = useAuth();
  const { cart, totalPrice, loadCart, updateItem, removeItem } = useCart();
  const [step, setStep] = useState(0);
  const [instructions, setInstructions] = useState('');
  const [pickupTime, setPickupTime] = useState('ASAP (~15 mins)');
  const [payMethod, setPayMethod] = useState('ONLINE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const items = cart?.items || [];

  async function handleQty(itemId, newQty) {
    try {
      if (newQty <= 0) {
        await removeItem(itemId);
      } else {
        await updateItem(itemId, newQty);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="panel-overlay" onClick={onClose} />
        <div className="panel-drawer">
          <div className="panel-header">
            <h2 className="panel-title">📦 Pre-Order</h2>
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="panel-body">
            <div className="panel-empty">
              <div className="panel-empty-icon">🔐</div>
              <p className="panel-empty-title">Login Required</p>
              <p className="panel-empty-desc">Please sign in to place a pre-order.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (items.length === 0 && step === 0) {
    return (
      <>
        <div className="panel-overlay" onClick={onClose} />
        <div className="panel-drawer">
          <div className="panel-header">
            <h2 className="panel-title">📦 Pre-Order</h2>
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="panel-body">
            <div className="panel-empty">
              <div className="panel-empty-icon">🛒</div>
              <p className="panel-empty-title">Cart is empty</p>
              <p className="panel-empty-desc">Add items from the menu first, then come back to pre-order.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  async function handlePlaceOrder() {
    setLoading(true);
    setError('');
    try {
      const order = await placeOrder(instructions, pickupTime);
      setPlacedOrder(order);
      decrementFoodQuantities(order.items || order.order_items || []);
      await loadCart();
      setStep(2); // Go to payment step
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    if (!placedOrder) return;
    setLoading(true);
    setError('');

    // Wallet balance validation
    if (payMethod === 'WALLET') {
      const walletBal = parseFloat(user?.wallet_balance || 0);
      const orderAmt = parseFloat(placedOrder.final_amount || 0);
      if (walletBal < orderAmt) {
        setError(`Insufficient wallet balance (₹${walletBal.toFixed(2)} available). Please top up or choose Online/Cash payment.`);
        setLoading(false);
        return;
      }
    }

    try {
      await processPayment(placedOrder.id, payMethod);
      setStep(3); // Done
      setShowConfirmationModal(true);
      if (onSuccess) onSuccess(placedOrder);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Progress indicator
  const StepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: i <= step ? 'var(--primary)' : 'var(--surface-alt, rgba(255,255,255,0.06))',
            color: i <= step ? '#fff' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, transition: 'background 0.3s'
          }}>{i + 1}</div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < step ? 'var(--primary)' : 'var(--border, rgba(255,255,255,0.08))', transition: 'background 0.3s' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer">
        <div className="panel-header">
          <h2 className="panel-title">📦 Pre-Order</h2>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="panel-body">
          <StepIndicator />

          {error && <div className="panel-error">⚠ {error}</div>}

          {/* Step 0: Cart review with quantity selection */}
          {step === 0 && (
            <>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Select Items &amp; Quantity</h3>
              {items.some(i => i.food_item && !i.food_item.is_available) && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, marginBottom: 14 }}>
                  ⚠️ One or more items in your cart are currently out of stock. Please remove them to proceed.
                </div>
              )}
              {items.map(item => {
                const isOutOfStock = item.food_item && !item.food_item.is_available;
                return (
                  <div key={item.id} className="panel-card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: isOutOfStock ? '1px solid #fca5a5' : undefined, background: isOutOfStock ? 'rgba(239,68,68,0.04)' : undefined }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{item.food_item?.name}</span>
                        {isOutOfStock && (
                          <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{item.food_item?.price} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="panel-qty-controls">
                        <button className="panel-qty-btn" onClick={() => handleQty(item.id, item.quantity - 1)}>−</button>
                        <span className="panel-qty-num">{item.quantity}</span>
                        <button className="panel-qty-btn" onClick={() => handleQty(item.id, item.quantity + 1)} disabled={isOutOfStock}>+</button>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem', width: 60, textAlign: 'right' }}>
                        ₹{parseFloat(item.subtotal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Scheduled Pickup Time</h3>
                <select
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: '1px solid var(--border, rgba(255,255,255,0.12))',
                    background: 'var(--surface-alt, rgba(255,255,255,0.04))',
                    color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'inherit',
                    outline: 'none', marginBottom: 14
                  }}
                >
                  <option value="ASAP (~15 mins)">ASAP (~15 mins)</option>
                  <option value="In 30 mins">In 30 mins</option>
                  <option value="In 45 mins">In 45 mins</option>
                  <option value="In 1 hour">In 1 hour</option>
                </select>
              </div>

              <hr className="panel-divider" />
              <div className="panel-row" style={{ fontSize: '1rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>Total Amount</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>₹{totalPrice.toFixed(2)}</span>
              </div>
            </>
          )}

          {/* Step 1: Instructions */}
          {step === 1 && (
            <>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Special Instructions</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Any special requests for the canteen staff? (optional)
              </p>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="E.g. Less spicy, extra sauce, pack separately..."
                rows={4}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--border, rgba(255,255,255,0.12))',
                  background: 'var(--surface-alt, rgba(255,255,255,0.04))', color: 'var(--text)', fontSize: '0.9rem',
                  fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 16
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="panel-card">
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 2 }}>Pickup Time</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem' }}>{pickupTime}</div>
                </div>
                <div className="panel-card">
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 2 }}>Total Price</div>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>₹{totalPrice.toFixed(2)}</div>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Payment */}
          {step === 2 && placedOrder && (
            <>
              <div className="panel-success" style={{ marginBottom: 20 }}>
                ✅ Order created! <strong>{placedOrder.order_number}</strong>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Payment Method</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Amount due: <strong style={{ color: 'var(--primary)' }}>₹{parseFloat(placedOrder.final_amount).toFixed(2)}</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {[
                  { value: 'ONLINE', icon: '💳', label: 'Online Payment (UPI/Card)', note: 'Instant payment verification' },
                  { value: 'WALLET', icon: '👛', label: 'Wallet Balance', note: `Available balance: ₹${parseFloat(user?.wallet_balance || 0).toFixed(2)}` },
                  { value: 'CASH', icon: '💵', label: 'Cash on Counter', note: 'Pay when you collect your order' },
                ].map(opt => (
                  <label key={opt.value} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px',
                    borderRadius: 12, border: `2px solid ${payMethod === opt.value ? 'var(--primary)' : 'var(--border, rgba(255,255,255,0.1))'}`,
                    background: payMethod === opt.value ? 'rgba(34,197,94,0.07)' : 'transparent',
                    cursor: 'pointer', transition: 'border-color 0.2s'
                  }}>
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

              {payMethod === 'ONLINE' && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', fontSize: '0.8rem', color: '#fbbf24', marginBottom: 16 }}>
                  ⚠ Digital payment simulation. Immediate confirmation upon click.
                </div>
              )}
            </>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>Order Confirmed!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
                {placedOrder?.order_number} has been placed and payment recorded.
              </p>
              <div className="panel-card" style={{ textAlign: 'left', marginBottom: 20 }}>
                <div className="panel-row">
                  <span className="panel-label">Order Reference</span>
                  <span className="panel-value">{placedOrder?.order_number}</span>
                </div>
                <div className="panel-row">
                  <span className="panel-label">Amount Paid</span>
                  <span className="panel-value" style={{ color: 'var(--primary)' }}>₹{parseFloat(placedOrder?.final_amount || 0).toFixed(2)}</span>
                </div>
                <div className="panel-row">
                  <span className="panel-label">Est. Preparation</span>
                  <span className="panel-value">{placedOrder?.estimated_prep_time_minutes} min</span>
                </div>
              </div>
              <button className="panel-btn-primary" onClick={onClose}>
                Track in Live Queue →
              </button>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        {step < 3 && (
          <div className="panel-footer">
            <div style={{ display: 'flex', gap: 10 }}>
              {step > 0 && step < 2 && (
                <button className="panel-btn-secondary" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>← Back</button>
              )}
              {step === 0 && (
                <button
                  className="panel-btn-primary"
                  style={{
                    flex: 1,
                    opacity: items.some(i => i.food_item && !i.food_item.is_available) ? 0.5 : 1,
                    cursor: items.some(i => i.food_item && !i.food_item.is_available) ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => setStep(1)}
                  disabled={items.some(i => i.food_item && !i.food_item.is_available)}
                >
                  Next: Instructions →
                </button>
              )}
              {step === 1 && (
                <button className="panel-btn-primary" style={{ flex: 1 }} onClick={handlePlaceOrder} disabled={loading}>
                  {loading ? <><span className="panel-spinner" style={{ width: 16, height: 16, borderWidth: 2, display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />Placing…</> : 'Place Order →'}
                </button>
              )}
              {step === 2 && (
                <button className="panel-btn-primary" style={{ flex: 1 }} onClick={handlePayment} disabled={loading}>
                  {loading ? 'Processing…' : `Pay ₹${parseFloat(placedOrder?.final_amount || 0).toFixed(2)} →`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showConfirmationModal && (
        <OrderConfirmationModal
          order={placedOrder}
          onClose={() => setShowConfirmationModal(false)}
          onTrackOrder={() => {
            setShowConfirmationModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
