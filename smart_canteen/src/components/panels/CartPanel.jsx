import React, { useEffect, useState } from 'react';
import './panels.css';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { API_BASE_URL } from '../../services/api';
import { getFoodItemImage } from '../../services/menu';

export default function CartPanel({ onClose, onPlaceOrder }) {
  const { cart, loading, totalCount, totalPrice, updateItem, removeItem, clearAll } = useCart();
  const { isAuthenticated } = useAuth();
  const [actionError, setActionError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  if (!isAuthenticated) {
    return (
      <>
        <div className="panel-overlay" onClick={onClose} />
        <div className="panel-drawer">
          <div className="panel-header">
            <h2 className="panel-title">🛒 My Cart</h2>
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="panel-body">
            <div className="panel-empty">
              <div className="panel-empty-icon">🔐</div>
              <p className="panel-empty-title">Login Required</p>
              <p className="panel-empty-desc">Please sign in to view your cart.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const handleQty = async (itemId, newQty) => {
    setUpdatingId(itemId);
    setActionError('');
    try {
      if (newQty <= 0) {
        await removeItem(itemId);
      } else {
        await updateItem(itemId, newQty);
      }
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClear = async () => {
    setActionError('');
    try {
      await clearAll();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const items = cart?.items || [];

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer">
        <div className="panel-header">
          <h2 className="panel-title">🛒 My Cart {totalCount > 0 && <span style={{ fontSize: '0.8rem', background: 'var(--primary)', color: '#fff', borderRadius: '100px', padding: '2px 8px' }}>{totalCount}</span>}</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {items.length > 0 && (
              <button className="panel-btn-danger" onClick={handleClear} title="Clear cart">🗑 Clear</button>
            )}
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="panel-body">
          {loading && (
            <div className="panel-loading">
              <div className="panel-spinner" />
              <span>Loading cart…</span>
            </div>
          )}

          {actionError && <div className="panel-error">⚠ {actionError}</div>}

          {!loading && items.length === 0 && (
            <div className="panel-empty">
              <div className="panel-empty-icon">🛒</div>
              <p className="panel-empty-title">Your cart is empty</p>
              <p className="panel-empty-desc">Browse the menu and add some food to get started!</p>
            </div>
          )}

          {items.map((item) => {
            const food = item.food_item;
            const isUpdating = updatingId === item.id;
            const isOutOfStock = food && !food.is_available;
            const imgUrl = getFoodItemImage(food);
            return (
              <div key={item.id} className="panel-card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', opacity: isUpdating ? 0.6 : 1, transition: 'opacity 0.2s', border: isOutOfStock ? '1px solid #fca5a5' : undefined, background: isOutOfStock ? 'rgba(239,68,68,0.04)' : undefined }}>
                <div className="panel-food-img">
                  {imgUrl ? <img src={imgUrl} alt={food.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : '🍽️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{food.name}</span>
                    {isOutOfStock && (
                      <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>₹{food.price} each</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="panel-qty-controls">
                      <button className="panel-qty-btn" onClick={() => handleQty(item.id, item.quantity - 1)} disabled={isUpdating}>−</button>
                      <span className="panel-qty-num">{item.quantity}</span>
                      <button className="panel-qty-btn" onClick={() => handleQty(item.id, item.quantity + 1)} disabled={isUpdating || isOutOfStock}>+</button>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      ₹{parseFloat(item.subtotal).toFixed(2)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleQty(item.id, 0)}
                  disabled={isUpdating}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', padding: '2px', flexShrink: 0 }}
                  title="Remove item"
                >✕</button>
              </div>
            );
          })}
        </div>

        {items.length > 0 && (
          <div className="panel-footer">
            {items.some(i => i.food_item && !i.food_item.is_available) && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, marginBottom: 12 }}>
                ⚠️ Some items in your cart are currently out of stock. Please remove them to place your order.
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              {cart?.discount_amount && parseFloat(cart.discount_amount) > 0 && (
                <div className="panel-row">
                  <span className="panel-label">Subtotal</span>
                  <span className="panel-value">₹{parseFloat(cart.total_price).toFixed(2)}</span>
                </div>
              )}
              {cart?.discount_amount && parseFloat(cart.discount_amount) > 0 && (
                <div className="panel-row">
                  <span className="panel-label">Discount</span>
                  <span style={{ fontWeight: 700, color: '#4ade80' }}>−₹{parseFloat(cart.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="panel-row" style={{ fontSize: '1rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--text)' }}>Total</span>
                <span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <button
              className="panel-btn-primary"
              onClick={onPlaceOrder}
              disabled={loading || items.some(i => i.food_item && !i.food_item.is_available)}
              style={items.some(i => i.food_item && !i.food_item.is_available) ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              Place Order →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
