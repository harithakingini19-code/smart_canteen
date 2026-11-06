import React, { useState, useEffect, useCallback, useRef } from 'react';
import './StaffDashboard.css';
import { useAuth } from '../context/AuthContext';
import { getIncomingOrders, updateOrderStatus } from '../services/orders';
import { fetchFoodItems, toggleFoodAvailability, updateFoodQuantity, getFoodItemImage } from '../services/menu';
import { getLiveQueue } from '../services/queue';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notifications';
import TaskManagement from './TaskManagement';
import InventoryOverview from './InventoryOverview';
import AddFoodItemModal from './AddFoodItemModal';

const STATUS_FLOW = ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'];
const STATUS_LABELS = {
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
const STATUS_COLORS = {
  CONFIRMED: '#2563eb',
  PREPARING: '#d97706',
  READY_FOR_PICKUP: '#16a34a',
  COMPLETED: '#6b7280',
  CANCELLED: '#ef4444',
};

export default function StaffDashboard({ theme, onToggleTheme, onLogout, onNavigateToHome, initialTab = 'inventory' }) {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState({});

  const [foodItems, setFoodItems] = useState([]);
  const [stockSearch, setStockSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [stockDietFilter, setStockDietFilter] = useState('all');
  const [stockLoading, setStockLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [updatingQtyId, setUpdatingQtyId] = useState(null);
  const [editingQtyMap, setEditingQtyMap] = useState({});
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);

  const [queueData, setQueueData] = useState({ waiting: [], preparing: [], ready: [] });
  const [queueLoading, setQueueLoading] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const seenReadyIds = useRef(new Set());
  const ordersIntervalRef = useRef(null);
  const queueIntervalRef = useRef(null);
  const notifIntervalRef = useRef(null);

  // ─── Load orders ────────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    try {
      const data = await getIncomingOrders();
      setOrders(data);
      setOrdersError('');
    } catch (err) {
      setOrdersError('Failed to load orders. Make sure you are logged in as Staff.');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // ─── Load food items ─────────────────────────────────────────────────────────
  const loadFoodItems = useCallback(async () => {
    try {
      const data = await fetchFoodItems();
      setFoodItems(data);
    } catch {
      // silently fail
    } finally {
      setStockLoading(false);
    }
  }, []);

  // ─── Load queue ───────────────────────────────────────────────────────────
  const loadQueue = useCallback(async () => {
    try {
      const data = await getLiveQueue();
      setQueueData({
        waiting: data.waiting || [],
        preparing: data.preparing || [],
        ready: data.ready || data.ready_for_pickup || [],
      });
    } catch {
      // silently fail
    } finally {
      setQueueLoading(false);
    }
  }, []);

  // ─── Load notifications ─────────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
      const unread = data.filter(n => !n.is_read);
      setUnreadCount(unread.length);

      // Toast for new food-ready notifications
      const readyNotifs = data.filter(
        n => !n.is_read &&
          ((n.title || '').toLowerCase().includes('ready') || (n.message || '').toLowerCase().includes('ready')) &&
          !seenReadyIds.current.has(n.id)
      );
      if (readyNotifs.length > 0) {
        const latest = readyNotifs[0];
        seenReadyIds.current.add(latest.id);
        setToastMsg(latest.message || 'Food is ready for pickup!');
        setTimeout(() => setToastMsg(''), 5000);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadFoodItems();
    loadQueue();
    loadNotifications();

    ordersIntervalRef.current = setInterval(loadOrders, 10000);
    queueIntervalRef.current = setInterval(loadQueue, 15000);
    notifIntervalRef.current = setInterval(loadNotifications, 12000);

    return () => {
      clearInterval(ordersIntervalRef.current);
      clearInterval(queueIntervalRef.current);
      clearInterval(notifIntervalRef.current);
    };
  }, [loadOrders, loadFoodItems, loadQueue, loadNotifications]);

  // ─── Update order status ────────────────────────────────────────────────────
  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
      if (newStatus === 'READY_FOR_PICKUP') {
        setToastMsg(`Order #${orderId} is ready for pickup! Customer notified.`);
        setTimeout(() => setToastMsg(''), 5000);
      }
      loadQueue();
    } catch {
      setToastMsg('Failed to update order status. Try again.');
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // ─── Set food availability (Available vs Out of Stock) ──────────────────────
  const handleSetAvailability = async (item, targetStatus) => {
    if (item.is_available === targetStatus) return;

    setTogglingId(item.id);
    try {
      const updated = await toggleFoodAvailability(item.id, targetStatus);
      setFoodItems(prev =>
        prev.map(f => f.id === item.id ? {
          ...f,
          is_available: updated.is_available,
          quantity_available: updated.quantity_available !== undefined
            ? updated.quantity_available
            : (updated.is_available ? (f.quantity_available || 20) : 0),
        } : f)
      );
      setToastMsg(`✅ "${item.name}" updated to ${updated.is_available ? 'Available' : 'Out of Stock'}.`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      setToastMsg('❌ Failed to update availability. Make sure you are authorized as Staff.');
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setTogglingId(null);
    }
  };

  // ─── Update food available quantity (Requirement 5 & 8) ────────────────────
  const handleUpdateQuantity = async (item, targetQuantity) => {
    const rawVal = targetQuantity !== undefined ? targetQuantity : (editingQtyMap[item.id] ?? item.quantity_available);
    const num = parseInt(rawVal, 10);
    if (isNaN(num) || num < 0) {
      setToastMsg('⚠️ Please enter a valid non-negative whole number (e.g. 10, 25, 50).');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }

    setUpdatingQtyId(item.id);
    try {
      const updated = await updateFoodQuantity(item.id, num);
      const newQty = updated.quantity_available !== undefined ? parseInt(updated.quantity_available, 10) : num;
      const newAvail = updated.is_available !== undefined ? updated.is_available : (newQty > 0);

      setFoodItems(prev =>
        prev.map(f => f.id === item.id ? {
          ...f,
          quantity_available: newQty,
          is_available: newAvail,
        } : f)
      );
      setEditingQtyMap(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setToastMsg(`✅ "${item.name}" quantity updated to ${newQty} (${newAvail ? 'In Stock' : 'Out of Stock'}).`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      setToastMsg('❌ Failed to update quantity. Please check authorization.');
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setUpdatingQtyId(null);
    }
  };

  // ─── Mark notification read ──────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  const staffName = user
    ? (user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name || user.email || 'Staff')
    : 'Staff';

  const availableCount = foodItems.filter(f => f.is_available).length;
  const outOfStockCount = foodItems.filter(f => !f.is_available).length;

  const filteredFood = foodItems.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
      (f.category_name || '').toLowerCase().includes(stockSearch.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(stockSearch.toLowerCase());
    if (!matchSearch) return false;
    if (stockFilter === 'available' && !f.is_available) return false;
    if (stockFilter === 'out_of_stock' && f.is_available) return false;
    if (stockDietFilter === 'veg' && !f.is_vegetarian) return false;
    if (stockDietFilter === 'nonveg' && f.is_vegetarian) return false;
    return true;
  });

  const getNextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status)).length;
  const readyOrders = orders.filter(o => o.status === 'READY_FOR_PICKUP').length;

  return (
    <div className="staff-dashboard">
      {/* ─── Top Toast Notification ─────────────────────────────────────────── */}
      {toastMsg && (
        <div className="staff-toast">
          🔔 {toastMsg}
          <button onClick={() => setToastMsg('')} className="staff-toast-close">×</button>
        </div>
      )}

      {/* ─── Header / Navbar ────────────────────────────────────────────────── */}
      <header className="staff-header">
        <div className="staff-header-left">
          <div className="staff-brand">
            <span className="staff-brand-logo">🍽️</span>
            <div>
              <span className="staff-brand-name">Smart<strong>Canteen</strong></span>
              <span className="staff-brand-tag">Staff Portal</span>
            </div>
          </div>
        </div>

        <nav className="staff-nav">
          {[
            { id: 'inventory', icon: '📦', label: 'Inventory' },
            { id: 'menu', icon: '🍽️', label: 'Food Menu' },
            { id: 'orders', icon: '📋', label: 'Orders' },
            { id: 'queue', icon: '📺', label: 'Queue' },
            { id: 'tasks', icon: '📝', label: 'My Tasks' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`staff-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <div className="staff-header-right">
          {/* Quick Add Food Item */}
          <button
            className="staff-add-food-quick-btn"
            onClick={() => setShowAddFoodModal(true)}
            title="Add New Food Item to Homepage Menu"
          >
            ➕ Add Food Item
          </button>

          {/* Notification Bell */}
          <button
            className="staff-notif-btn"
            onClick={() => setShowNotifPanel(prev => !prev)}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="staff-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            className="staff-theme-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Staff Info + Logout */}
          <div className="staff-user-info">
            <div className="staff-avatar">
              {staffName.charAt(0).toUpperCase()}
            </div>
            <div className="staff-user-meta">
              <span className="staff-user-name">{staffName}</span>
              <span className="staff-user-role">Staff</span>
            </div>
          </div>

          {onNavigateToHome && (
            <button className="staff-logout-btn" onClick={onNavigateToHome} title="View Canteen Store">
              🏪 Store
            </button>
          )}

          <button className="staff-logout-btn" onClick={handleLogout} title="Logout">
            🚪 Logout
          </button>
        </div>
      </header>

      {/* ─── Summary Stats ───────────────────────────────────────────────────── */}
      {['orders', 'queue'].includes(activeTab) && (
        <div className="staff-stats-bar">
          <div className="staff-stat-card">
            <span className="staff-stat-icon">📋</span>
            <div>
              <div className="staff-stat-value">{totalOrders}</div>
              <div className="staff-stat-label">Total Orders</div>
            </div>
          </div>
          <div className="staff-stat-card">
            <span className="staff-stat-icon">⚡</span>
            <div>
              <div className="staff-stat-value">{activeOrders}</div>
              <div className="staff-stat-label">Active Orders</div>
            </div>
          </div>
          <div className="staff-stat-card">
            <span className="staff-stat-icon">✅</span>
            <div>
              <div className="staff-stat-value">{readyOrders}</div>
              <div className="staff-stat-label">Ready for Pickup</div>
            </div>
          </div>
          <div className="staff-stat-card">
            <span className="staff-stat-icon">🎟️</span>
            <div>
              <div className="staff-stat-value">{(queueData.waiting.length + queueData.preparing.length)}</div>
              <div className="staff-stat-label">In Queue</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content ─────────────────────────────────────────────────────── */}
      <main className="staff-main">

        {/* ══ ORDERS TAB ══ */}
        {activeTab === 'orders' && (
          <section className="staff-section">
            <div className="staff-section-header">
              <h2>📋 Incoming Orders</h2>
              <button className="staff-refresh-btn" onClick={loadOrders} title="Refresh orders">
                🔄 Refresh
              </button>
            </div>

            {ordersLoading && (
              <div className="staff-loading">
                <div className="staff-spinner" />
                <span>Loading orders…</span>
              </div>
            )}

            {!ordersLoading && ordersError && (
              <div className="staff-error-box">⚠ {ordersError}</div>
            )}

            {!ordersLoading && !ordersError && orders.length === 0 && (
              <div className="staff-empty">
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
                <p>No incoming orders right now. All clear!</p>
              </div>
            )}

            {!ordersLoading && orders.map(order => {
              const nextStatus = getNextStatus(order.status);
              const isUpdating = updatingStatus[order.id];
              const statusColor = STATUS_COLORS[order.status] || '#6b7280';

              return (
                <div key={order.id} className="staff-order-card">
                  <div className="staff-order-header">
                    <div className="staff-order-meta">
                      <span className="staff-order-id">Order #{order.order_number || order.id}</span>
                      {(order.queue_number || order.queue_token) && (
                        <span className="staff-queue-badge">🎟 Token: {order.queue_number || order.queue_token}</span>
                      )}
                    </div>
                    <span
                      className="staff-status-badge"
                      style={{ background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}55` }}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  <div className="staff-order-customer">
                    <span>👤</span>
                    <span>
                      {order.user_name || order.customer_name || order.user_email || 'Customer'}
                      {order.user_email && order.user_name && (
                        <small style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({order.user_email})</small>
                      )}
                    </span>
                  </div>

                  <div className="staff-order-items">
                    {(order.items || order.order_items || []).map((item, idx) => (
                      <div key={idx} className="staff-order-item">
                        <span className="staff-item-name">
                          {item.food_item_name || item.food_name || item.name || 'Item'}
                        </span>
                        <span className="staff-item-qty">× {item.quantity}</span>
                        <span className="staff-item-price">
                          ₹{parseFloat(item.subtotal || item.price || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="staff-order-footer">
                    <span className="staff-order-total">
                      Total: ₹{parseFloat(order.total_amount || order.total || 0).toFixed(2)}
                    </span>
                    {order.special_instructions && (
                      <span className="staff-order-note">📝 {order.special_instructions}</span>
                    )}
                    <div className="staff-order-actions">
                      {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && nextStatus && (
                        <button
                          className="staff-action-btn primary"
                          onClick={() => handleStatusUpdate(order.id, nextStatus)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? <span className="staff-spinner-sm" /> : null}
                          {nextStatus === 'PREPARING' && '👨‍🍳 Start Preparing'}
                          {nextStatus === 'READY_FOR_PICKUP' && '✅ Mark Ready'}
                          {nextStatus === 'COMPLETED' && '🏁 Complete Order'}
                        </button>
                      )}
                      {order.status === 'CONFIRMED' && (
                        <button
                          className="staff-action-btn danger"
                          onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                          disabled={isUpdating}
                        >
                          ✕ Cancel
                        </button>
                      )}
                      {order.status === 'COMPLETED' && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>✓ Order completed</span>
                      )}
                      {order.status === 'CANCELLED' && (
                        <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>✕ Order cancelled</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ══ QUEUE TAB ══ */}
        {activeTab === 'queue' && (
          <section className="staff-section">
            <div className="staff-section-header">
              <h2>📺 Live Queue Status</h2>
              <button className="staff-refresh-btn" onClick={loadQueue}>🔄 Refresh</button>
            </div>

            {queueLoading && (
              <div className="staff-loading"><div className="staff-spinner" /><span>Loading queue…</span></div>
            )}

            {!queueLoading && (
              <div className="staff-queue-grid">
                {/* Waiting */}
                <div className="staff-queue-col">
                  <div className="staff-queue-col-header waiting">
                    ⏳ Waiting ({queueData.waiting.length})
                  </div>
                  {queueData.waiting.length === 0 && <p className="staff-queue-empty">No orders waiting</p>}
                  {queueData.waiting.map(token => (
                    <div key={token.id || token.queue_number} className="staff-queue-token waiting">
                      <span className="sqt-number">#{token.queue_number || token.id}</span>
                      <span className="sqt-label">{token.order_number ? `Order #${token.order_number}` : 'Waiting'}</span>
                    </div>
                  ))}
                </div>

                {/* Preparing */}
                <div className="staff-queue-col">
                  <div className="staff-queue-col-header preparing">
                    👨‍🍳 Preparing ({queueData.preparing.length})
                  </div>
                  {queueData.preparing.length === 0 && <p className="staff-queue-empty">Nothing being prepared</p>}
                  {queueData.preparing.map(token => (
                    <div key={token.id || token.queue_number} className="staff-queue-token preparing">
                      <span className="sqt-number">#{token.queue_number || token.id}</span>
                      <span className="sqt-label">{token.order_number ? `Order #${token.order_number}` : 'Preparing'}</span>
                    </div>
                  ))}
                </div>

                {/* Ready */}
                <div className="staff-queue-col">
                  <div className="staff-queue-col-header ready">
                    ✅ Ready for Pickup ({queueData.ready.length})
                  </div>
                  {queueData.ready.length === 0 && <p className="staff-queue-empty">No orders ready</p>}
                  {queueData.ready.map(token => (
                    <div key={token.id || token.queue_number} className="staff-queue-token ready">
                      <span className="sqt-number">#{token.queue_number || token.id}</span>
                      <span className="sqt-label">{token.order_number ? `Order #${token.order_number}` : 'Ready'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ══ FOOD MENU TAB (Add & Manage Canteen Food Items) ══ */}
        {activeTab === 'menu' && (
          <section className="staff-section">
            <div className="staff-section-header">
              <div>
                <h2>🍽️ Canteen Food Menu & Items</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Manage dishes, pricing, dietary indicators, and publish new food items to the homepage.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="staff-add-btn"
                  onClick={() => setShowAddFoodModal(true)}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 3px 10px rgba(22, 163, 74, 0.35)',
                  }}
                >
                  ➕ Add New Food Item
                </button>
                <button className="staff-refresh-btn" onClick={loadFoodItems}>
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* Menu stats */}
            <div className="staff-stats-bar" style={{ padding: 0, margin: '16px 0 20px' }}>
              <div className="staff-stat-card">
                <span className="staff-stat-icon">🥘</span>
                <div>
                  <div className="staff-stat-val">{foodItems.length}</div>
                  <div className="staff-stat-lbl">Total Food Items</div>
                </div>
              </div>
              <div className="staff-stat-card">
                <span className="staff-stat-icon">✅</span>
                <div>
                  <div className="staff-stat-val" style={{ color: '#16a34a' }}>{availableCount}</div>
                  <div className="staff-stat-lbl">In Stock (Available)</div>
                </div>
              </div>
              <div className="staff-stat-card">
                <span className="staff-stat-icon">❌</span>
                <div>
                  <div className="staff-stat-val" style={{ color: '#ef4444' }}>{outOfStockCount}</div>
                  <div className="staff-stat-lbl">Out of Stock</div>
                </div>
              </div>
              <div className="staff-stat-card">
                <span className="staff-stat-icon">🌱</span>
                <div>
                  <div className="staff-stat-val" style={{ color: '#22c55e' }}>
                    {foodItems.filter(f => f.is_vegetarian).length}
                  </div>
                  <div className="staff-stat-lbl">Veg Items</div>
                </div>
              </div>
              <div className="staff-stat-card">
                <span className="staff-stat-icon">📦</span>
                <div>
                  <div className="staff-stat-val" style={{ color: '#38bdf8' }}>
                    {foodItems.reduce((sum, f) => sum + (parseInt(f.quantity_available, 10) || 0), 0)}
                  </div>
                  <div className="staff-stat-lbl">Total Units in Stock</div>
                </div>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="staff-stock-toolbar">
              <div className="staff-search-bar">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Search by dish name, description, or category..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                />
                {stockSearch && (
                  <button onClick={() => setStockSearch('')} className="staff-clear-search">✕</button>
                )}
              </div>

              <div className="staff-filter-tabs">
                {/* Dietary Filter */}
                <select
                  value={stockDietFilter}
                  onChange={(e) => setStockDietFilter(e.target.value)}
                  className="staff-select-filter"
                >
                  <option value="all">All Dietary</option>
                  <option value="veg">🌱 Veg Only</option>
                  <option value="nonveg">🍗 Non-Veg Only</option>
                </select>

                {/* Stock Filter */}
                {['all', 'available', 'out_of_stock'].map((f) => (
                  <button
                    key={f}
                    className={`staff-filter-tab ${stockFilter === f ? 'active' : ''}`}
                    onClick={() => setStockFilter(f)}
                  >
                    {f === 'all' && 'All Status'}
                    {f === 'available' && '✓ In Stock'}
                    {f === 'out_of_stock' && '✕ Out of Stock'}
                  </button>
                ))}
              </div>
            </div>

            {/* Food items list */}
            {stockLoading ? (
              <div className="staff-loading">
                <div className="staff-spinner" />
                <span>Loading food items...</span>
              </div>
            ) : filteredFood.length === 0 ? (
              <div className="staff-empty">
                <span style={{ fontSize: '2.5rem' }}>🍽️</span>
                <h3>No food items match your filter</h3>
                <p>Click "Add New Food Item" to publish a new dish to the homepage.</p>
                <button
                  onClick={() => setShowAddFoodModal(true)}
                  style={{
                    marginTop: 12,
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ➕ Add New Food Item
                </button>
              </div>
            ) : (
              <div className="staff-stock-grid">
                {filteredFood.map((item) => {
                  const imgUrl = getFoodItemImage(item);
                  const isToggling = togglingId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`staff-stock-card ${!item.is_available ? 'unavailable' : ''}`}
                    >
                      {/* Image Thumbnail */}
                      <div className="staff-dish-thumb-wrap">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={item.name}
                            className="staff-dish-thumb"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span
                          className="staff-dish-thumb-fallback"
                          style={{ display: imgUrl ? 'none' : 'flex' }}
                        >
                          🍲
                        </span>
                      </div>

                      {/* Info */}
                      <div className="staff-stock-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span className="staff-stock-name">{item.name}</span>
                          <span
                            className={`staff-diet-tag ${item.is_vegetarian ? 'veg' : 'nonveg'}`}
                          >
                            {item.is_vegetarian ? '🌱 Veg' : '🍗 Non-Veg'}
                          </span>
                          {item.is_custom && (
                            <span className="staff-custom-badge">Staff Added</span>
                          )}
                        </div>
                        <span className="staff-stock-category">
                          Category: <strong>{item.category_name || item.category || 'General'}</strong> • ⏱ {item.preparation_time_minutes || 12} mins prep
                        </span>
                        {item.description && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {item.description}
                          </span>
                        )}
                        <span className="staff-stock-price">₹{parseFloat(item.price).toFixed(2)}</span>
                        <div className="staff-stock-qty-display">
                          <span className="staff-stock-qty-title">Quantity Available:</span>
                          <span className={`staff-stock-qty-num ${(!item.is_available || (item.quantity_available ?? 0) === 0) ? 'out' : ''}`}>
                            📦 {item.quantity_available !== undefined ? item.quantity_available : (item.is_available ? 50 : 0)} items
                          </span>
                        </div>
                      </div>

                      {/* Availability & Actions */}
                      <div className="staff-stock-right">
                        {/* Inline Quantity Stepper / Quick Editor */}
                        <div className="staff-qty-editor">
                          <span className="staff-qty-editor-lbl">Qty:</span>
                          <div className="staff-qty-input-wrap">
                            <button
                              type="button"
                              className="staff-qty-btn-stepper"
                              onClick={() => handleUpdateQuantity(item, Math.max(0, (item.quantity_available ?? 0) - 1))}
                              disabled={updatingQtyId === item.id || (item.quantity_available ?? 0) <= 0}
                              title="Decrease quantity by 1"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              className="staff-qty-input"
                              value={editingQtyMap[item.id] !== undefined ? editingQtyMap[item.id] : (item.quantity_available ?? (item.is_available ? 50 : 0))}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d+$/.test(val)) {
                                  setEditingQtyMap(prev => ({ ...prev, [item.id]: val }));
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const targetVal = editingQtyMap[item.id] !== undefined ? editingQtyMap[item.id] : item.quantity_available;
                                  handleUpdateQuantity(item, targetVal);
                                }
                              }}
                              title="Enter quantity and press Enter or click Save"
                            />
                            <button
                              type="button"
                              className="staff-qty-btn-stepper"
                              onClick={() => handleUpdateQuantity(item, (item.quantity_available ?? 0) + 1)}
                              disabled={updatingQtyId === item.id}
                              title="Increase quantity by 1"
                            >
                              +
                            </button>
                          </div>
                          {editingQtyMap[item.id] !== undefined && String(editingQtyMap[item.id]) !== String(item.quantity_available) && (
                            <button
                              type="button"
                              className="staff-qty-save-btn"
                              onClick={() => handleUpdateQuantity(item, editingQtyMap[item.id])}
                              disabled={updatingQtyId === item.id}
                              title="Save Quantity"
                            >
                              {updatingQtyId === item.id ? '…' : '✓ Save'}
                            </button>
                          )}
                        </div>

                        <span
                          className={`staff-avail-badge ${item.is_available ? 'in-stock' : 'out-stock'}`}
                        >
                          {item.is_available ? '✓ In Stock' : '✕ Out of Stock'}
                        </span>
                        <button
                          className={`staff-toggle-btn ${item.is_available ? 'make-unavailable' : 'make-available'}`}
                          onClick={() => handleSetAvailability(item, !item.is_available)}
                          disabled={isToggling}
                          title={item.is_available ? 'Click to mark Out of Stock' : 'Click to mark Available'}
                        >
                          {isToggling ? (
                            <span className="staff-spinner-sm" />
                          ) : item.is_available ? (
                            'Set Out of Stock'
                          ) : (
                            'Set Available'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ══ INVENTORY TAB (Matching Reference Screenshot EXACTLY) ══ */}
        {(activeTab === 'inventory' || activeTab === 'stock') && (
          <InventoryOverview
            user={user}
            onToast={(msg) => {
              setToastMsg(msg);
              setTimeout(() => setToastMsg(''), 5000);
            }}
          />
        )}

        {/* ══ TASKS TAB (Staff My Tasks: view assigned tasks only, update status only) ══ */}
        {activeTab === 'tasks' && (
          <TaskManagement
            user={user}
            isAdmin={false}
            onToast={(msg) => {
              setToastMsg(msg);
              setTimeout(() => setToastMsg(''), 5000);
            }}
          />
        )}
      </main>

      {/* ─── Notifications Panel ────────────────────────────────────────────── */}
      {showNotifPanel && (
        <div className="staff-notif-overlay" onClick={() => setShowNotifPanel(false)}>
          <div className="staff-notif-panel" onClick={e => e.stopPropagation()}>
            <div className="staff-notif-header">
              <h3>🔔 Notifications</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {unreadCount > 0 && (
                  <button className="staff-mark-all-btn" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
                <button className="staff-close-btn" onClick={() => setShowNotifPanel(false)}>×</button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="staff-notif-empty">No notifications yet.</div>
            ) : (
              <div className="staff-notif-list">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`staff-notif-item ${!n.is_read ? 'unread' : ''} ${((n.message || '').toLowerCase().includes('ready') || (n.title || '').toLowerCase().includes('ready')) ? 'food-ready' : ''}`}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                  >
                    <div className="staff-notif-msg">{n.message}</div>
                    <div className="staff-notif-time">
                      {n.created_at ? new Date(n.created_at).toLocaleTimeString() : ''}
                    </div>
                    {!n.is_read && <span className="staff-notif-dot" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Add New Food Item Modal ────────────────────────────────────────── */}
      {showAddFoodModal && (
        <AddFoodItemModal
          onClose={() => setShowAddFoodModal(false)}
          onSuccess={(newItem) => {
            loadFoodItems();
            setToastMsg(`🎉 "${newItem.name}" added and published to homepage menu!`);
            setTimeout(() => setToastMsg(''), 5000);
          }}
        />
      )}
    </div>
  );
}
