import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Home.css';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { fetchCategories, fetchFoodItems, DEFAULT_CANTEEN_FOOD_ITEMS, DEFAULT_CATEGORIES, sortItemsByCanonicalOrder, getFoodItemImage, decrementFoodQuantities } from '../services/menu';
import { getFavorites, addFavorite, removeFavoriteByItem } from '../services/favorites';
import { getPaymentHistory } from '../services/payments';
import { fetchNotifications } from '../services/notifications';

import CartPanel from './panels/CartPanel';
import PreOrderPanel from './panels/PreOrderPanel';
import QueuePanel from './panels/QueuePanel';
import OrdersPanel from './panels/OrdersPanel';
import FavouritesPanel from './panels/FavouritesPanel';
import WalletPanel from './panels/WalletPanel';
import ProfilePanel from './panels/ProfilePanel';
import AdminOrderManagerPanel from './panels/AdminOrderManagerPanel';
import PaymentPanel from './panels/PaymentPanel';
import NotificationsPanel from './panels/NotificationsPanel';
import ChatbotPanel from './panels/ChatbotPanel';
import ReviewsPanel from './panels/ReviewsPanel';
import ReviewsSection from './ReviewsSection';
import ReviewModal from './panels/ReviewModal';


const QUICK_ACTIONS = [
  { id: 'preorder',  icon: '📦', label: 'Pre-order',        color: '#dcfce7', iconColor: '#16a34a' },
  { id: 'queue',     icon: '📺', label: 'Live Queue',       color: '#dbeafe', iconColor: '#2563eb' },
  { id: 'orders',    icon: '🧾', label: 'My Orders',        color: '#fef9c3', iconColor: '#ca8a04' },
  { id: 'reviews',   icon: '⭐', label: 'Reviews',          color: '#fef3c7', iconColor: '#d97706' },
  { id: 'favorites', icon: '❤️', label: 'Favourites',      color: '#ffe4e6', iconColor: '#e11d48' },
  { id: 'wallet',    icon: '💳', label: 'Wallet',           color: '#ede9fe', iconColor: '#7c3aed' },
];

const getFoodEmoji = (food) => {
  const n = (food.name || '').toLowerCase();
  const c = (food.category_name || '').toLowerCase();

  // Specific item mappings
  if (n.includes('samosa') || n.includes('samoosa')) return '🥟';
  if (n.includes('nool puttu') || n.includes('string hopper') || n.includes('idiyappam')) return '🍝';
  if (n.includes('puttu')) return '🍚';
  if (n.includes('gee dosa') || n.includes('ghee dosa')) return '🥞';
  if (n.includes('donuts') || n.includes('donut') || n.includes('doughnut')) return '🍩';
  if (n.includes('cup cake') || n.includes('cupcake') || n.includes('muffin')) return '🧁';
  if (n.includes('brownies') || n.includes('brownie')) return '🍫';
  if (n.includes('pudding')) return '🍮';
  if (n.includes('sharjah')) return '🥛';
  if (n.includes('chocolate shake') || n.includes('choco shake')) return '🍫';
  if (n.includes('cold coffee')) return '🧋';
  if (n.includes('cold boost') || n.includes('boost')) return '🥤';
  if (n.includes('mango smoothie') || n.includes('smoothie')) return '🥭';
  if (n.includes('lime juice') || n.includes('lime')) return '🍈';
  if (n.includes('lemon juice') || n.includes('lemonade')) return '🍋';
  if (n.includes('roll') || n.includes('wrap')) return '🌯';
  if (n.includes('cutlet')) return '🧆';
  if (n.includes('ice cream') || n.includes('icream') || n.includes('ice-cream')) return '🍨';
  if (n.includes('jamun')) return '🍯';
  if (n.includes('gulab')) return '🍯';
  if (n.includes('idali') || n.includes('idli') || n.includes('idly')) return '🥞';
  if (n.includes('vada') || n.includes('wada')) return '🍩';
  if (n.includes('poori') || n.includes('puri')) return '🫓';
  if (n.includes('ghee rice') || n.includes('gee rice')) return '🍚';
  if (n.includes('fried rice')) return '🍳';
  if (n.includes('normal rice') || n.includes('rice meal')) return '🍱';
  if (n.includes('biryani')) return '🍛';
  if (n.includes('rice')) return '🍚';
  if (n.includes('paneer butter')) return '🧀';
  if (n.includes('paneer') || n.includes('curry')) return '🍲';
  if (n.includes('hakka noodles') || n.includes('noodle')) return '🍜';
  if (n.includes('burger')) return '🍔';
  if (n.includes('dosa')) return '🥞';
  if (n.includes('sandwich') || n.includes('toast')) return '🥪';
  if (n.includes('filter coffee') || n.includes('coffee')) return '☕';
  if (n.includes('chaya') || n.includes('chai') || n.includes('tea')) return '🍵';
  if (n.includes('juice')) return '🍹';
  if (n.includes('cake')) return '🎂';
  if (c.includes('drink')) return '🥤';
  if (c.includes('snack')) return '🍕';
  if (c.includes('breakfast')) return '🥐';
  if (c.includes('dessert')) return '🍦';
  return '🍽️';
};

export default function Home({
  theme,
  onToggleTheme,
  onNavigateToLogin,
  onNavigateToSignup,
  onNavigateToStaffLogin,
  onNavigateToStaffDashboard,
  onNavigateToAdminDashboard,
}) {
  const { user, isAuthenticated } = useAuth();
  const { cart, totalCount, totalPrice, addItem, updateItem, removeItem } = useCart();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [foodItems, setFoodItems] = useState(DEFAULT_CANTEEN_FOOD_ITEMS);
  const [favoritesMap, setFavoritesMap] = useState({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState('');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');
  const [addToCartToast, setAddToCartToast] = useState('');
  const [activePanel, setActivePanel] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [readyNotificationToast, setReadyNotificationToast] = useState(null);
  const seenReadyNotifIds = useRef(new Set());

  // Periodically check notifications for unread count & instant Food-Ready alerts (Requirement 4.7)
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifCount(0);
      return;
    }

    async function checkNotifications() {
      try {
        const notifs = await fetchNotifications();
        const unread = notifs.filter((n) => !n.is_read);
        setUnreadNotifCount(unread.length);

        // Check for new Food Ready notification
        const latestReady = unread.find(
          (n) =>
            ((n.message || '').toLowerCase().includes('ready') ||
              (n.title || '').toLowerCase().includes('ready')) &&
            !seenReadyNotifIds.current.has(n.id)
        );
        if (latestReady) {
          seenReadyNotifIds.current.add(latestReady.id);
          setReadyNotificationToast(latestReady);
        }
      } catch (err) {
        // Silent catch for network hiccups
      }
    }

    checkNotifications();
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);


  // Load categories
  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCats();
  }, []);

  // Load food items from backend with live search & category filter
  const loadMenu = useCallback(async () => {
    setLoadingMenu(true);
    setMenuError('');
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeCategory !== 'all') params.category = activeCategory;

      const items = await fetchFoodItems(params);
      setFoodItems(items || []);
    } catch (err) {
      console.warn('Backend unavailable, using default canteen items', err);
    } finally {
      setLoadingMenu(false);
    }
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    const timer = setTimeout(loadMenu, 300);
    return () => clearTimeout(timer);
  }, [loadMenu]);

  // Sprint 4 Task 4.10: Synchronize food item availability with Staff changes automatically
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const params = {};
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (activeCategory !== 'all') params.category = activeCategory;
        const items = await fetchFoodItems(params);
        setFoodItems(items);
      } catch {
        // silent fail on background poll
      }
    }, 10000);
    return () => clearInterval(syncInterval);
  }, [searchQuery, activeCategory]);

  // Load user favorites & total spent
  const loadUserData = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoritesMap({});
      setTotalSpent(0);
      return;
    }
    try {
      const favs = await getFavorites();
      const map = {};
      favs.forEach((f) => {
        const itemId = typeof f.food_item === 'object' ? f.food_item.id : f.food_item;
        map[itemId] = f.id;
      });
      setFavoritesMap(map);

      const payments = await getPaymentHistory();
      const spent = payments
        .filter((p) => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      setTotalSpent(spent);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Toggle favorite
  const handleToggleFavorite = async (e, foodItemId) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onNavigateToLogin();
      return;
    }
    const favId = favoritesMap[foodItemId];
    try {
      if (favId) {
        await removeFavoriteByItem(foodItemId);
        setFavoritesMap((prev) => {
          const next = { ...prev };
          delete next[foodItemId];
          return next;
        });
      } else {
        const newFav = await addFavorite(foodItemId);
        setFavoritesMap((prev) => ({ ...prev, [foodItemId]: newFav.id || true }));
      }
    } catch (err) {
      console.error('Favorite action failed:', err);
    }
  };

  // Cart quantity controls
  const getItemQtyInCart = (foodId) => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find((i) => i.food_item?.id === foodId || i.food_item === foodId);
    return item ? item.quantity : 0;
  };

  const handleQtyChange = async (foodId, delta, foodName = '') => {
    if (!isAuthenticated) {
      onNavigateToLogin();
      return;
    }

    const targetFood = foodItems.find((f) => f.id === foodId);
    if (targetFood && delta > 0) {
      if (!targetFood.is_available || (targetFood.quantity_available !== undefined && targetFood.quantity_available <= 0)) {
        setAddToCartToast(`⚠️ Sorry, ${targetFood.name} is currently Out of Stock.`);
        setTimeout(() => setAddToCartToast(''), 3000);
        return;
      }
      const cartItem = cart?.items?.find((i) => i.food_item?.id === foodId || i.food_item === foodId);
      const curQty = cartItem ? cartItem.quantity : 0;
      if (targetFood.quantity_available !== undefined && (curQty + delta) > targetFood.quantity_available) {
        setAddToCartToast(`⚠️ Only ${targetFood.quantity_available} item(s) of ${targetFood.name} available in stock.`);
        setTimeout(() => setAddToCartToast(''), 3000);
        return;
      }
    }

    const cartItem = cart?.items?.find((i) => i.food_item?.id === foodId || i.food_item === foodId);
    const curQty = cartItem ? cartItem.quantity : 0;
    const newQty = curQty + delta;

    try {
      if (!cartItem && delta > 0) {
        await addItem(foodId, 1);
        setAddToCartToast(`✅ Added ${foodName || 'item'} to cart!`);
        setTimeout(() => setAddToCartToast(''), 3000);
      } else if (cartItem) {
        if (newQty <= 0) {
          await removeItem(cartItem.id);
        } else {
          await updateItem(cartItem.id, newQty);
          if (delta > 0) {
            setAddToCartToast(`✅ Added ${foodName || 'item'} to cart!`);
            setTimeout(() => setAddToCartToast(''), 3000);
          }
        }
      }
    } catch (err) {
      console.error('Cart update failed:', err);
    }
  };

  // Greeting logic
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const displayName = user
    ? user.first_name
      ? user.first_name
      : user.username
      ? user.username
      : user.email.split('@')[0]
    : 'there';

  const [selectedFoodDetails, setSelectedFoodDetails] = useState(null);
  const [reviewsFoodFilter, setReviewsFoodFilter] = useState('all');
  const [foodForReviewModal, setFoodForReviewModal] = useState(null);

  // Categories ordered exactly as requested in Picture 2:
  // Breakfast, Drinks, Desserts, Meals, Snacks
  const CATEGORY_ORDER = ['breakfast', 'drinks', 'desserts', 'meals', 'snacks'];
  const displayCategories = (categories.length > 0 ? categories : DEFAULT_CATEGORIES)
    .map((c) => ({
      ...c,
      slug: (c.slug || c.name || '').toLowerCase().trim(),
    }))
    .sort((a, b) => {
      const idxA = CATEGORY_ORDER.indexOf(a.slug);
      const idxB = CATEGORY_ORDER.indexOf(b.slug);
      return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
    });

  // Filter items in memory for instant feedback + backend query
  const filteredFoodItems = sortItemsByCanonicalOrder(foodItems).filter((food) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (food.name || '').toLowerCase().includes(q);
      const matchDesc = (food.description || '').toLowerCase().includes(q);
      const matchCat = (food.category_name || '').toLowerCase().includes(q);
      const aliases = food.aliases || [];
      const matchAlias = aliases.some(a => a.toLowerCase().includes(q) || q.includes(a.toLowerCase())) ||
        (q.includes('samoosa') && (food.name || '').toLowerCase().includes('samosa')) ||
        (q.includes('icream') && (food.name || '').toLowerCase().includes('ice')) ||
        (q.includes('idali') && (food.name || '').toLowerCase().includes('idli')) ||
        (q.includes('gee') && (food.name || '').toLowerCase().includes('ghee')) ||
        (q.includes('dosa') && (food.name || '').toLowerCase().includes('puttu')) ||
        (q.includes('puttu') && (food.name || '').toLowerCase().includes('dosa'));

      if (!matchName && !matchDesc && !matchCat && !matchAlias) return false;
    }
    if (activeCategory !== 'all') {
      const target = String(activeCategory).toLowerCase().trim();
      const itemCatName = (food.category_name || '').toLowerCase().trim();
      const itemCatSlug = (food.category_slug || '').toLowerCase().trim();
      const itemCat = String(food.category || '').toLowerCase().trim();
      const catMatch = itemCatSlug === target || itemCatName === target || itemCat === target;
      if (!catMatch) return false;
    }
    return true;
  });

  return (
    <div className="home-page">
      {/* ════════════════════════════
          NAVBAR
      ════════════════════════════ */}
      <nav className="home-nav">
        <div className="nav-inner">
          {/* Hamburger */}
          <button className="nav-hamburger" aria-label="Menu" onClick={() => setActivePanel('profile')}>
            ☰
          </button>

          {/* Logo */}
          <div className="nav-logo" onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}>
            <span className="nav-logo-icon">🍽️</span>
            <span className="nav-logo-text">
              Smart<span>Canteen</span>
            </span>
          </div>

          {/* Right actions */}
          <div className="nav-actions">
            {/* Wallet chip */}
            <div
              className="wallet-chip"
              onClick={() => (isAuthenticated ? setActivePanel('wallet') : onNavigateToLogin())}
              style={{ cursor: 'pointer' }}
              title="View Wallet & Transactions"
            >
              💳 ₹{user?.wallet_balance ? parseFloat(user.wallet_balance).toFixed(2) : totalSpent.toFixed(0)} wallet
            </div>

            {/* Theme toggle */}
            <button
              type="button"
              className="theme-toggle-btn nav-icon-btn"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* AI Chatbot icon */}
            <button
              className="nav-icon-btn"
              aria-label="AI Assistant"
              onClick={() => setActivePanel('chatbot')}
              title="Chat with AI Assistant (PB-06)"
              style={{ position: 'relative', fontSize: '1.15rem' }}
            >
              🤖
            </button>

            {/* Notifications icon */}
            {isAuthenticated && (
              <button
                className="nav-icon-btn"
                aria-label="Notifications"
                onClick={() => setActivePanel('notifications')}
                title="Notifications"
                style={{ position: 'relative' }}
              >
                🔔
                {unreadNotifCount > 0 && (
                  <span
                    className="nav-cart-badge"
                    style={{ background: '#ef4444' }}
                  >
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            )}

            {/* Cart icon */}
            <button
              className="nav-icon-btn"
              aria-label="Cart"
              onClick={() => setActivePanel('cart')}
              title="View Cart"
            >
              🛒
              {totalCount > 0 && <span className="nav-cart-badge">{totalCount}</span>}
            </button>

            {/* Staff Dashboard (only when already logged in as staff) */}
            {user?.role === 'STAFF' && (
              <button
                className="nav-icon-btn"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 12px',
                  width: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onClick={() => {
                  if (onNavigateToStaffDashboard) onNavigateToStaffDashboard();
                }}
                title="Canteen Staff Dashboard"
              >
                👨‍🍳 Staff Dashboard
              </button>
            )}

            {/* Admin Portal Link */}
            {user?.role === 'ADMIN' && (
              <button
                className="nav-icon-btn"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#2563eb',
                  background: 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 12px',
                  width: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onClick={() => {
                  if (onNavigateToAdminDashboard) onNavigateToAdminDashboard();
                }}
                title="Canteen Administrator Portal"
              >
                🛡️ Admin Dashboard
              </button>
            )}

            {/* Avatar / Auth */}
            {user ? (
              <div
                className="nav-avatar"
                title={user.email}
                onClick={() => setActivePanel('profile')}
                style={{ cursor: 'pointer' }}
              >
                {displayName[0].toUpperCase()}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="nav-icon-btn"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    padding: '0 12px',
                    width: 'auto',
                  }}
                  onClick={onNavigateToLogin}
                >
                  Login
                </button>
                <button
                  style={{
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    padding: '6px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={onNavigateToSignup}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ════════════════════════════
          MAIN CONTENT
      ════════════════════════════ */}
      <div className="home-content">
        {/* Order Success Alert */}
        {orderSuccessMsg && <div className="order-alert">{orderSuccessMsg}</div>}

        {/* ── Hero / Greeting ── */}
        <section className="hero-section">
          <div className="hero-text">
            <h1 className="hero-greeting">
              {greeting}, {displayName} 👋
            </h1>
            <p className="hero-subtitle">What would you like to eat today?</p>
            <div className="hero-search">
              <span className="hero-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search for food items by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0 8px',
                    fontSize: '1rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="hero-illustration">🍱</div>
        </section>

        {/* ── Quick Actions ── */}
        <section className="quick-actions-section">
          <div className="quick-actions-row">
            {QUICK_ACTIONS.map((qa) => (
              <div
                key={qa.id}
                className={`quick-action-tile ${activePanel === qa.id ? 'active-tile' : ''}`}
                onClick={() => {
                  if (!isAuthenticated && qa.id !== 'queue') {
                    onNavigateToLogin();
                  } else {
                    setActivePanel(qa.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={qa.label}
              >
                <div className="qa-icon" style={{ background: qa.color }}>
                  {qa.icon}
                </div>
                <span className="qa-label">{qa.label}</span>
              </div>
            ))}
            {/* Admin panel tile — only shown to admin/staff users */}
            {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'STAFF') && (
              <div
                className={`quick-action-tile ${activePanel === 'admin_orders' ? 'active-tile' : ''}`}
                onClick={() => {
                  if (user?.role === 'ADMIN' && onNavigateToAdminDashboard) {
                    onNavigateToAdminDashboard();
                  } else if (user?.role === 'STAFF' && onNavigateToStaffDashboard) {
                    onNavigateToStaffDashboard();
                  } else {
                    setActivePanel('admin_orders');
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Staff Dashboard'}
              >
                <div className="qa-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>⚡</div>
                <span className="qa-label">{user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Staff Dashboard'}</span>
              </div>
            )}
          </div>
        </section>

        {/* ── Popular Items ── */}
        <section className="menu-section">
          <div className="section-header">
            <h2 className="section-title">
              {activeCategory === 'all' ? 'Popular Items' : 'Menu Items'}
            </h2>
            <button
              className="view-all-btn"
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
            >
              View All
            </button>
          </div>

          {/* Category tabs */}
          <div className="category-tabs">
            <button
              className={`cat-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All 🍽️
            </button>
            {displayCategories.map((cat) => {
              const catSlug = (cat.slug || cat.name || '').toLowerCase().trim();
              const isActive = (activeCategory || '').toLowerCase() === catSlug;
              return (
                <button
                  key={catSlug}
                  className={`cat-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(catSlug)}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Menu Loading & Error States */}
          {loadingMenu && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: '3px solid rgba(34,197,94,0.2)',
                  borderTopColor: '#22c55e',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 12px',
                }}
              />
              <span>Loading menu items from Django backend...</span>
            </div>
          )}

          {menuError && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center',
                margin: '20px 0',
              }}
            >
              ⚠ {menuError}
            </div>
          )}

          {/* Food Cards Grid */}
          {!loadingMenu && !menuError && filteredFoodItems.length > 0 && (
            <div className="food-grid">
              {filteredFoodItems.map((food) => {
                const qty = getItemQtyInCart(food.id);
                const isFav = Boolean(favoritesMap[food.id]);
                const imgUrl = getFoodItemImage(food);

                return (
                  <div
                    key={food.id}
                    className="food-card"
                    onClick={() => setSelectedFoodDetails(food)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="food-card-img" style={{ position: 'relative' }}>
                      {imgUrl ? (
                        <>
                          <img
                            src={imgUrl}
                            alt={food.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                          <span style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '3.8rem' }}>
                            {getFoodEmoji(food)}
                          </span>
                        </>
                      ) : (
                        <span>{getFoodEmoji(food)}</span>
                      )}
                      <span className="food-prep-badge">⏱ {food.preparation_time_minutes || 15} min</span>

                      {/* Favorite ❤️ button */}
                      <button
                        onClick={(e) => handleToggleFavorite(e, food.id)}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          background: 'rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(4px)',
                          border: 'none',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          transition: 'transform 0.2s',
                        }}
                      >
                        {isFav ? '❤️' : '🤍'}
                      </button>
                    </div>

                    <div className="food-card-body">
                      <h3 className="food-card-name">{food.name}</h3>
                      <p className="food-card-desc">{food.description}</p>

                      <div className="food-card-footer">
                        <div>
                          <div className="food-price">₹{parseFloat(food.price).toFixed(2)}</div>
                          <div className="food-rating">
                            {food.is_vegetarian ? '🌱 Veg' : '🍗 Non-Veg'}
                          </div>
                        </div>

                        {!food.is_available || (food.quantity_available !== undefined && food.quantity_available <= 0) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <button
                              className="add-btn"
                              disabled
                              style={{ opacity: 0.4, cursor: 'not-allowed', background: '#9ca3af' }}
                              title="Item is currently out of stock"
                              onClick={(e) => e.stopPropagation()}
                            >
                              +
                            </button>
                            <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 600 }}>
                              Sold Out
                            </span>
                          </div>
                        ) : qty === 0 ? (
                          <button
                            className="add-btn"
                            onClick={(e) => { e.stopPropagation(); handleQtyChange(food.id, 1, food.name); }}
                            aria-label={`Add ${food.name}`}
                          >
                            +
                          </button>
                        ) : (
                          <div className="qty-controls" onClick={(e) => e.stopPropagation()}>
                            <button className="qty-btn" onClick={() => handleQtyChange(food.id, -1, food.name)}>
                              −
                            </button>
                            <span className="qty-num">{qty}</span>
                            <button
                              className="qty-btn"
                              disabled={food.quantity_available !== undefined && qty >= food.quantity_available}
                              style={food.quantity_available !== undefined && qty >= food.quantity_available ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                              title={food.quantity_available !== undefined && qty >= food.quantity_available ? 'Maximum available stock reached' : 'Add one more'}
                              onClick={() => handleQtyChange(food.id, 1, food.name)}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loadingMenu && !menuError && filteredFoodItems.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p className="empty-state-title">No items found</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {searchQuery ? `No food items match "${searchQuery}"` : 'No food items available in this category.'}
              </p>
            </div>
          )}
        </section>

        {/* ── Reviews & Ratings Section (Requirement 1, 4, 5) ── */}
        <ReviewsSection onNavigateToLogin={onNavigateToLogin} />
      </div>

      {/* ── Food Details Modal (Requirement 11) ── */}
      {selectedFoodDetails && (
        <>
          <div className="panel-overlay" onClick={() => setSelectedFoodDetails(null)} />
          <div className="panel-drawer" style={{ maxWidth: 440, height: 'auto', maxHeight: '90vh', borderRadius: '24px 24px 0 0', margin: '0 auto', top: 'auto', bottom: 0 }}>
            <div className="panel-header">
              <h2 className="panel-title">🍽️ Food Details</h2>
              <button className="panel-close-btn" onClick={() => setSelectedFoodDetails(null)}>✕</button>
            </div>
            <div className="panel-body" style={{ paddingBottom: 24 }}>
              {/* Image & Favorite toggle */}
              <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 16, background: 'var(--surface-alt, rgba(255,255,255,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(() => {
                  const detailImg = getFoodItemImage(selectedFoodDetails);
                  return (
                    <>
                      {detailImg ? (
                        <img
                          src={detailImg}
                          alt={selectedFoodDetails.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fb = e.target.parentNode.querySelector('.emoji-fallback');
                            if (fb) fb.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span
                        className="emoji-fallback"
                        style={{ fontSize: '4rem', display: detailImg ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
                      >{getFoodEmoji(selectedFoodDetails)}</span>
                    </>
                  );
                })()}
                <button
                  onClick={(e) => handleToggleFavorite(e, selectedFoodDetails.id)}
                  title={favoritesMap[selectedFoodDetails.id] ? 'Remove from favorites' : 'Add to favorites'}
                  style={{
                    position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%',
                    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '1.1rem'
                  }}
                >
                  {favoritesMap[selectedFoodDetails.id] ? '❤️' : '🤍'}
                </button>
              </div>

              {/* Title & Category */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>{selectedFoodDetails.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Category: <strong>{selectedFoodDetails.category_name || selectedFoodDetails.category || 'General'}</strong>
                  </span>
                </div>
                <span className={`status-badge ${(selectedFoodDetails.is_available && (selectedFoodDetails.quantity_available === undefined || selectedFoodDetails.quantity_available > 0)) ? 'ready' : 'cancelled'}`}>
                  {(selectedFoodDetails.is_available && (selectedFoodDetails.quantity_available === undefined || selectedFoodDetails.quantity_available > 0)) ? 'Available' : 'Out of Stock'}
                </span>
              </div>

              {/* Description */}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: 16 }}>
                {selectedFoodDetails.description}
              </p>

              <hr className="panel-divider" />

              {/* Customer Reviews shortcut */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#f59e0b', fontSize: '1rem' }}>★★★★★</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)' }}>Food Reviews</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        if (onNavigateToLogin) onNavigateToLogin();
                      } else {
                        const targetFood = selectedFoodDetails;
                        setSelectedFoodDetails(null);
                        setFoodForReviewModal(targetFood);
                      }
                    }}
                    style={{
                      background: 'rgba(245,158,11,0.15)',
                      border: '1px solid rgba(245,158,11,0.4)',
                      color: '#f59e0b',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      borderRadius: 12,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    ⭐ Rate Dish
                  </button>
                  <button
                    onClick={() => {
                      const name = selectedFoodDetails.name;
                      setSelectedFoodDetails(null);
                      setReviewsFoodFilter(name);
                      setActivePanel('reviews');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f59e0b',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                      fontFamily: 'inherit',
                    }}
                  >
                    View All Reviews →
                  </button>
                </div>
              </div>

              {/* Price, Prep time & Available Quantity */}
              <div className="panel-row" style={{ marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Price</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>
                    ₹{parseFloat(selectedFoodDetails.price).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quantity Available</div>
                  <div style={{ fontWeight: 700, color: (!selectedFoodDetails.is_available || (selectedFoodDetails.quantity_available ?? 0) === 0) ? '#ef4444' : 'var(--text)' }}>
                    📦 {selectedFoodDetails.quantity_available !== undefined ? selectedFoodDetails.quantity_available : (selectedFoodDetails.is_available ? 50 : 0)} items
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Prep Time</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                    ⏱ {selectedFoodDetails.preparation_time_minutes || 15} mins
                  </div>
                </div>
              </div>

              {/* Add to Cart controls */}
              <div style={{ marginTop: 20 }}>
                {!selectedFoodDetails.is_available || (selectedFoodDetails.quantity_available !== undefined && selectedFoodDetails.quantity_available <= 0) ? (
                  <button className="panel-btn-secondary" disabled style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>
                    Out of Stock
                  </button>
                ) : getItemQtyInCart(selectedFoodDetails.id) === 0 ? (
                  <button className="panel-btn-primary" onClick={() => handleQtyChange(selectedFoodDetails.id, 1, selectedFoodDetails.name)}>
                    + Add to Cart (₹{parseFloat(selectedFoodDetails.price).toFixed(2)})
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(34,197,94,0.08)', borderRadius: 12, border: '1px solid rgba(34,197,94,0.2)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>In Cart:</span>
                    <div className="panel-qty-controls">
                      <button className="panel-qty-btn" onClick={() => handleQtyChange(selectedFoodDetails.id, -1, selectedFoodDetails.name)}>−</button>
                      <span className="panel-qty-num">{getItemQtyInCart(selectedFoodDetails.id)}</span>
                      <button
                        className="panel-qty-btn"
                        disabled={selectedFoodDetails.quantity_available !== undefined && getItemQtyInCart(selectedFoodDetails.id) >= selectedFoodDetails.quantity_available}
                        style={selectedFoodDetails.quantity_available !== undefined && getItemQtyInCart(selectedFoodDetails.id) >= selectedFoodDetails.quantity_available ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                        title={selectedFoodDetails.quantity_available !== undefined && getItemQtyInCart(selectedFoodDetails.id) >= selectedFoodDetails.quantity_available ? 'Maximum stock reached' : 'Add one more'}
                        onClick={() => handleQtyChange(selectedFoodDetails.id, 1, selectedFoodDetails.name)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Floating Cart Bar ── */}
      {totalCount > 0 && (
        <div className="cart-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🛒</span>
            <div className="cart-bar-info">
              <span className="cart-bar-count">
                {totalCount} {totalCount === 1 ? 'item' : 'items'} selected
              </span>
              <span className="cart-bar-total">Total: ₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>
          <button className="cart-bar-btn" onClick={() => setActivePanel('preorder')}>
            Pay &amp; Pre-Order →
          </button>
        </div>
      )}

      {/* ── Add to Cart Toast Confirmation Notification ── */}
      {addToCartToast && (
        <div
          style={{
            position: 'fixed',
            bottom: totalCount > 0 ? '84px' : '24px',
            right: '24px',
            background: 'var(--primary)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 700,
            fontSize: '0.9rem',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {addToCartToast}
        </div>
      )}

      {/* ════════════════════════════
          SIDE DRAWERS / PANELS
      ════════════════════════════ */}
      {activePanel === 'cart' && (
        <CartPanel
          onClose={() => setActivePanel(null)}
          onPlaceOrder={() => setActivePanel('preorder')}
        />
      )}

      {activePanel === 'preorder' && (
        <PreOrderPanel
          onClose={() => setActivePanel(null)}
          onSuccess={(order) => {
            decrementFoodQuantities(order?.items || order?.order_items || []);
            loadFood();
            setOrderSuccessMsg(`🎉 Order placed! Reference #${order.order_number}`);
            setTimeout(() => setOrderSuccessMsg(''), 8000);
            setActivePanel('queue');
          }}
        />
      )}

      {activePanel === 'queue' && <QueuePanel onClose={() => setActivePanel(null)} />}

      {activePanel === 'orders' && (
        <OrdersPanel
          onClose={() => setActivePanel(null)}
          onPayOrder={(order) => {
            setPaymentOrder(order);
            setActivePanel('payment');
          }}
        />
      )}

      {activePanel === 'payment' && paymentOrder && (
        <PaymentPanel
          order={paymentOrder}
          onClose={() => { setActivePanel('orders'); setPaymentOrder(null); }}
          onSuccess={() => {
            setOrderSuccessMsg(`✅ Payment successful for ${paymentOrder.order_number}!`);
            setTimeout(() => setOrderSuccessMsg(''), 6000);
            setActivePanel('orders');
            setPaymentOrder(null);
          }}
        />
      )}

      {activePanel === 'favorites' && <FavouritesPanel onClose={() => setActivePanel(null)} />}

      {activePanel === 'reviews' && (
        <ReviewsPanel
          initialFoodFilter={reviewsFoodFilter}
          onClose={() => {
            setActivePanel(null);
            setReviewsFoodFilter('all');
          }}
          onNavigateToLogin={onNavigateToLogin}
        />
      )}

      {/* Direct Review Modal from Food Details */}
      {foodForReviewModal && (
        <ReviewModal
          key={`direct-food-${foodForReviewModal.id}`}
          selectedFoodItem={foodForReviewModal}
          selectedFoodName={foodForReviewModal.name}
          onClose={() => setFoodForReviewModal(null)}
          onSuccess={() => {
            setAddToCartToast(`⭐ Thank you for reviewing ${foodForReviewModal.name}!`);
            setTimeout(() => setAddToCartToast(''), 4000);
            setFoodForReviewModal(null);
          }}
        />
      )}

      {activePanel === 'wallet' && <WalletPanel onClose={() => setActivePanel(null)} />}

      {activePanel === 'profile' && (
        <ProfilePanel
          onClose={() => setActivePanel(null)}
          onNavigateToLogin={onNavigateToLogin}
        />
      )}

      {activePanel === 'notifications' && (
        <NotificationsPanel
          onClose={() => setActivePanel(null)}
          onOpenQueue={() => setActivePanel('queue')}
          onOpenOrders={() => setActivePanel('orders')}
        />
      )}

      {activePanel === 'admin_orders' && (
        <AdminOrderManagerPanel onClose={() => setActivePanel(null)} />
      )}

      {/* ── Sprint 6: AI Chatbot Support Panel (PB-06) ── */}
      {activePanel === 'chatbot' && (
        <ChatbotPanel
          onClose={() => setActivePanel(null)}
          onOpenOrders={() => setActivePanel('orders')}
          onOpenQueue={() => setActivePanel('queue')}
          onNavigateToLogin={onNavigateToLogin}
        />
      )}

      {/* ── Food Ready Alert Toast (Requirement 4.7) ── */}
      {readyNotificationToast && (
        <div
          style={{
            position: 'fixed',
            top: '76px',
            right: '24px',
            background: 'var(--primary, #22c55e)',
            color: '#ffffff',
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg, 16px)',
            fontWeight: 600,
            fontSize: '0.88rem',
            boxShadow: 'var(--shadow-xl, 0 10px 25px rgba(0,0,0,0.25))',
            zIndex: 1150,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '380px',
            border: '2px solid #86efac',
            animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <span style={{ fontSize: '1.6rem' }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Food Ready for Pickup!</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.95, marginTop: 2 }}>{readyNotificationToast.message}</div>
          </div>
          <button
            onClick={() => {
              setReadyNotificationToast(null);
              setActivePanel('queue');
            }}
            style={{
              background: '#fff',
              color: '#16a34a',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Track →
          </button>
          <button
            onClick={() => setReadyNotificationToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.1rem',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Floating AI Chatbot Action Button (Sprint 6 PB-06) ── */}
      <button
        type="button"
        className="floating-chatbot-btn"
        style={{
          bottom: totalCount > 0 ? (addToCartToast ? '154px' : '92px') : (addToCartToast ? '88px' : '24px'),
        }}
        onClick={() => setActivePanel((prev) => (prev === 'chatbot' ? null : 'chatbot'))}
        title="Open Smart Canteen AI Assistant"
        aria-label="Open AI Assistant"
      >
        <span className="floating-chatbot-icon">🤖</span>
        <span>AI Assistant</span>
      </button>
    </div>
  );
}
