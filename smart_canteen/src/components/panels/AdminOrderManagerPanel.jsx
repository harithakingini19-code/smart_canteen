import React, { useEffect, useState } from 'react';
import './panels.css';
import { useAuth } from '../../context/AuthContext';
import { getIncomingOrders, updateOrderStatus } from '../../services/orders';
import { fetchFoodItems, toggleFoodAvailability } from '../../services/menu';
import { getErrorMessage } from '../../services/api';

const STATUS_OPTIONS = [
  { value: 'CONFIRMED', label: 'Confirmed', icon: '✅' },
  { value: 'PREPARING', label: 'Preparing', icon: '👨‍🍳' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: '🔔' },
  { value: 'COMPLETED', label: 'Completed', icon: '✔' },
  { value: 'CANCELLED', label: 'Cancelled', icon: '✕' },
];

export default function AdminOrderManagerPanel({ onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'stock'

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderError, setOrderError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [statusSuccessMsg, setStatusSuccessMsg] = useState('');

  // Stock State
  const [foodItems, setFoodItems] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockError, setStockError] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [togglingItemId, setTogglingItemId] = useState(null);
  const [stockSuccessMsg, setStockSuccessMsg] = useState('');

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'stock') {
      loadStock();
    }
  }, [activeTab]);

  async function loadOrders() {
    setOrderError('');
    try {
      const data = await getIncomingOrders();
      setOrders(data);
    } catch (err) {
      setOrderError(getErrorMessage(err));
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadStock() {
    setLoadingStock(true);
    setStockError('');
    try {
      const items = await fetchFoodItems();
      setFoodItems(items);
    } catch (err) {
      setStockError(getErrorMessage(err));
    } finally {
      setLoadingStock(false);
    }
  }

  async function handleStatusChange(orderId, newStatus) {
    setUpdatingId(orderId);
    setOrderError('');
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      const label = STATUS_OPTIONS.find((s) => s.value === newStatus)?.label || newStatus;
      setStatusSuccessMsg(`✅ Order #${updated.order_number || orderId} marked as ${label}! Notification sent to user.`);
      setTimeout(() => setStatusSuccessMsg(''), 5000);
      await loadOrders();
    } catch (err) {
      setOrderError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleStock(itemId, currentAvailability) {
    setTogglingItemId(itemId);
    setStockError('');
    try {
      const updatedItem = await toggleFoodAvailability(itemId, !currentAvailability);
      setFoodItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, is_available: updatedItem.is_available } : item))
      );
      setStockSuccessMsg(`✅ "${updatedItem.name}" marked as ${updatedItem.is_available ? 'Available (In Stock)' : 'Out of Stock'}!`);
      setTimeout(() => setStockSuccessMsg(''), 4000);
    } catch (err) {
      setStockError(getErrorMessage(err));
    } finally {
      setTogglingItemId(null);
    }
  }

  const filteredOrders = filterStatus === 'ALL'
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  const filteredFoodItems = foodItems.filter((item) => {
    if (!stockSearch.trim()) return true;
    const q = stockSearch.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.category_name || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    );
  });

  const isStaff = user?.role === 'STAFF';
  const panelTitle = isStaff ? '👨‍🍳 Staff Order & Kitchen Manager' : '⚡ Admin Order & Kitchen Manager';

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer" style={{ width: '100%', maxWidth: '540px' }}>
        <div className="panel-header">
          <h2 className="panel-title">{panelTitle}</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="panel-btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 10px' }}
              onClick={activeTab === 'orders' ? loadOrders : loadStock}
              title="Refresh"
            >
              🔄 Refresh
            </button>
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── Top Tabs: Incoming Orders vs Quick Stock ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              background: activeTab === 'orders' ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
              color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'orders' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              borderBottom: activeTab === 'orders' ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            📋 Incoming Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              background: activeTab === 'stock' ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
              color: activeTab === 'stock' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'stock' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              borderBottom: activeTab === 'stock' ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            🥘 Quick Stock Toggle
          </button>
        </div>

        <div className="panel-body">
          {/* ════════════════════════════════════════
              TAB 1: INCOMING ORDERS (4.5 & 4.6 & 4.7)
          ════════════════════════════════════════ */}
          {activeTab === 'orders' && (
            <>
              {/* Success Notification Alert */}
              {statusSuccessMsg && (
                <div style={{
                  background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                  color: 'var(--primary)', padding: '10px 14px', borderRadius: 10,
                  fontSize: '0.85rem', fontWeight: 600, marginBottom: 14,
                }}>
                  {statusSuccessMsg}
                </div>
              )}

              {/* Status Filter Pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {['ALL', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: filterStatus === st ? 'var(--primary)' : 'var(--surface-2)',
                      color: filterStatus === st ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {st === 'ALL' ? 'All Live' : st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              {loadingOrders && (
                <div className="panel-loading">
                  <div className="panel-spinner" />
                  <span>Loading live canteen orders…</span>
                </div>
              )}

              {orderError && <div className="panel-error">⚠ {orderError}</div>}

              {!loadingOrders && filteredOrders.length === 0 && (
                <div className="panel-empty">
                  <div className="panel-empty-icon">📦</div>
                  <p className="panel-empty-title">No orders found</p>
                  <p className="panel-empty-desc">Active incoming customer orders will appear here.</p>
                </div>
              )}

              {filteredOrders.map((order) => {
                const isUpdating = updatingId === order.id;

                return (
                  <div
                    key={order.id}
                    className="panel-card"
                    style={{ opacity: isUpdating ? 0.6 : 1, marginBottom: 14 }}
                  >
                    {/* Header info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
                          {order.order_number}
                          {order.queue_number && (
                            <span style={{
                              marginLeft: 8, fontSize: '0.78rem', background: 'rgba(34,197,94,0.15)',
                              color: 'var(--primary)', padding: '2px 8px', borderRadius: 6, fontWeight: 700
                            }}>
                              Token #{order.queue_number}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Customer: <strong>{order.user_name || order.user_email || order.user?.email || 'Student'}</strong>
                          {order.user_email && order.user_name && ` (${order.user_email})`}
                        </div>
                      </div>
                      <span className={`status-badge ${order.status.toLowerCase().replace(/_/g, '-')}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Items breakdown */}
                    <div
                      style={{
                        background: 'var(--surface-2)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                        marginBottom: 10,
                      }}
                    >
                      {order.items?.map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                            {item.quantity}× {item.food_item_name}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            ₹{parseFloat(item.subtotal).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.special_instructions && (
                        <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: 4 }}>
                          📝 Note: {order.special_instructions}
                        </div>
                      )}
                    </div>

                    {/* Amount & Time */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 12 }}>
                      <span>Total Amount: <strong style={{ color: 'var(--primary)' }}>₹{parseFloat(order.final_amount).toFixed(2)}</strong></span>
                      <span>Pickup: <strong>{order.pickup_time || 'ASAP'}</strong></span>
                    </div>

                    {/* Status Update Action Buttons */}
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Update Order Status (Workflow):
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        disabled={isUpdating || order.status === 'PREPARING'}
                        onClick={() => handleStatusChange(order.id, 'PREPARING')}
                        style={{
                          flex: 1,
                          padding: '7px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          background: order.status === 'PREPARING' ? '#fbbf24' : 'var(--surface-2)',
                          color: order.status === 'PREPARING' ? '#000' : 'var(--text)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        👨‍🍳 Preparing
                      </button>

                      <button
                        disabled={isUpdating || order.status === 'READY_FOR_PICKUP'}
                        onClick={() => handleStatusChange(order.id, 'READY_FOR_PICKUP')}
                        style={{
                          flex: 1,
                          padding: '7px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          background: order.status === 'READY_FOR_PICKUP' ? '#4ade80' : 'var(--surface-2)',
                          color: order.status === 'READY_FOR_PICKUP' ? '#000' : 'var(--text)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Mark food ready and notify customer"
                      >
                        🔔 Ready for Pickup
                      </button>

                      <button
                        disabled={isUpdating || order.status === 'COMPLETED'}
                        onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                        style={{
                          flex: 1,
                          padding: '7px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          background: order.status === 'COMPLETED' ? 'var(--primary)' : 'var(--surface-2)',
                          color: order.status === 'COMPLETED' ? '#fff' : 'var(--text)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ✔ Completed
                      </button>

                      <button
                        disabled={isUpdating || order.status === 'CANCELLED'}
                        onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                        style={{
                          padding: '7px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--error)',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--error)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ════════════════════════════════════════
              TAB 2: QUICK STOCK TOGGLE (4.8)
          ════════════════════════════════════════ */}
          {activeTab === 'stock' && (
            <>
              {/* Toast / Notification on stock change */}
              {stockSuccessMsg && (
                <div style={{
                  background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                  color: 'var(--primary)', padding: '10px 14px', borderRadius: 10,
                  fontSize: '0.85rem', fontWeight: 600, marginBottom: 14,
                }}>
                  {stockSuccessMsg}
                </div>
              )}

              {/* Stock Search Input */}
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Search food item by name or category…"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {loadingStock && (
                <div className="panel-loading">
                  <div className="panel-spinner" />
                  <span>Loading canteen menu items…</span>
                </div>
              )}

              {stockError && <div className="panel-error">⚠ {stockError}</div>}

              {!loadingStock && filteredFoodItems.length === 0 && (
                <div className="panel-empty">
                  <div className="panel-empty-icon">🔍</div>
                  <p className="panel-empty-title">No food items found</p>
                  <p className="panel-empty-desc">Try clearing your search query.</p>
                </div>
              )}

              {!loadingStock && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredFoodItems.map((item) => {
                    const isToggling = togglingItemId === item.id;
                    const isAvailable = Boolean(item.is_available);

                    return (
                      <div
                        key={item.id}
                        className="panel-card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          opacity: isToggling ? 0.6 : 1,
                          borderLeft: `4px solid ${isAvailable ? '#22c55e' : '#ef4444'}`,
                        }}
                      >
                        <div style={{ flex: 1, paddingRight: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>
                              {item.name}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: item.is_vegetarian ? '#16a34a' : '#ea580c', fontWeight: 600 }}>
                              {item.is_vegetarian ? '🌱 Veg' : '🍗 Non-Veg'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Category: {item.category_name || 'General'} • ₹{parseFloat(item.price).toFixed(2)}
                          </div>

                          <div style={{ marginTop: 4 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 12,
                                background: isAvailable ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                color: isAvailable ? '#16a34a' : '#ef4444',
                              }}
                            >
                              {isAvailable ? '● Available (In Stock)' : '✕ Out of Stock'}
                            </span>
                          </div>
                        </div>

                        {/* Quick Toggle Action Button */}
                        <div>
                          <button
                            disabled={isToggling}
                            onClick={() => handleToggleStock(item.id, isAvailable)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 8,
                              border: isAvailable ? '1px solid #ef4444' : '1px solid #22c55e',
                              background: isAvailable ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.15)',
                              color: isAvailable ? '#ef4444' : '#16a34a',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: isToggling ? 'not-allowed' : 'pointer',
                              fontFamily: 'inherit',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s',
                            }}
                            title={`Click to mark ${isAvailable ? 'Out of Stock' : 'Available'}`}
                          >
                            {isToggling ? 'Updating…' : isAvailable ? '🔴 Set Out of Stock' : '🟢 Set Available'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
