import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminStudents,
  fetchStudentDetail,
  fetchAdminStaff,
  createStaffAccount,
  updateStaffAccount,
  toggleUserStatus,
  deleteUserAccount,
  fetchUserStats,
  fetchAdminTransactions,
  fetchAdminPaymentAnalytics,
} from '../services/admin';
import { getIncomingOrders, updateOrderStatus } from '../services/orders';
import { fetchFoodItems } from '../services/menu';
import { getErrorMessage } from '../services/api';
import TaskManagement from './TaskManagement';
import AddFoodItemModal from './AddFoodItemModal';

export default function AdminDashboard({ theme, onToggleTheme, onLogout, onNavigateToHome, initialTab = 'students' }) {
  const { user, logout } = useAuth();

  // Active Tab: 'students' | 'staff' | 'payments' | 'orders' | 'menu' | 'tasks'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 5000);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TASK S.1: STUDENT DETAILS MANAGEMENT STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);
  const [userStats, setUserStats] = useState(null);

  // ══════════════════════════════════════════════════════════════════════════
  // TASK S.2: STAFF ACCESS MANAGEMENT STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState('');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [addStaffForm, setAddStaffForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'STAFF',
    phone_number: '',
  });
  const [addStaffErrors, setAddStaffErrors] = useState({});
  const [addStaffSubmitting, setAddStaffSubmitting] = useState(false);
  const [editingStaffRole, setEditingStaffRole] = useState(null); // { id, role }

  // ══════════════════════════════════════════════════════════════════════════
  // TASK S.3: PAYMENT DETAILS AND TRANSACTION LOG STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState('');
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [txSearch, setTxSearch] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState('ALL');
  const [txMethodFilter, setTxMethodFilter] = useState('ALL');
  const [txDateFilter, setTxDateFilter] = useState('');
  const [inspectTx, setInspectTx] = useState(null);

  // ══════════════════════════════════════════════════════════════════════════
  // SPRINT 4 TASK 4.10: ADMIN FOOD AVAILABILITY VIEW STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [foodItems, setFoodItems] = useState([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodStatusFilter, setFoodStatusFilter] = useState('');
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);

  const loadFoodItems = useCallback(async () => {
    setFoodLoading(true);
    try {
      const data = await fetchFoodItems();
      setFoodItems(data);
    } catch (err) {
      showToast('Failed to load food menu items.', 'error');
    } finally {
      setFoodLoading(false);
    }
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // KITCHEN ORDERS OVERSIGHT STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // ── Load User Stats ────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const data = await fetchUserStats();
      setUserStats(data);
    } catch {
      // ignore
    }
  }, []);

  // ── Load Students (Task S.1) ────────────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentsError('');
    try {
      const params = {};
      if (studentSearch.trim()) params.search = studentSearch.trim();
      if (studentStatusFilter) params.is_active = studentStatusFilter;
      const data = await fetchAdminStudents(params);
      setStudents(data);
    } catch (err) {
      setStudentsError(getErrorMessage(err));
    } finally {
      setStudentsLoading(false);
    }
  }, [studentSearch, studentStatusFilter]);

  // ── Inspect Student Details (Task S.1) ──────────────────────────────────────
  const handleInspectStudent = async (studentId) => {
    setLoadingStudentDetail(true);
    try {
      const detail = await fetchStudentDetail(studentId);
      setSelectedStudent(detail);
    } catch (err) {
      showToast('Failed to load student details: ' + getErrorMessage(err), 'error');
    } finally {
      setLoadingStudentDetail(false);
    }
  };

  // ── Load Staff (Task S.2) ──────────────────────────────────────────────────
  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    setStaffError('');
    try {
      const params = {};
      if (staffSearch.trim()) params.search = staffSearch.trim();
      if (staffStatusFilter) params.is_active = staffStatusFilter;
      const data = await fetchAdminStaff(params);
      setStaffList(data);
    } catch (err) {
      setStaffError(getErrorMessage(err));
    } finally {
      setStaffLoading(false);
    }
  }, [staffSearch, staffStatusFilter]);

  // ── Toggle Account Status (Task S.1 & S.2) ──────────────────────────────────
  const handleToggleStatus = async (userObj, isFromModal = false) => {
    const actionLabel = userObj.is_active ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} account for ${userObj.email}?`)) {
      return;
    }
    try {
      const res = await toggleUserStatus(userObj.id);
      showToast(res.message, 'success');
      loadStudents();
      loadStaff();
      loadStats();
      if (isFromModal && selectedStudent?.id === userObj.id) {
        setSelectedStudent((prev) => ({ ...prev, is_active: res.is_active }));
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // ── Delete Account (Task S.2) ──────────────────────────────────────────────
  const handleDeleteStaff = async (staffObj) => {
    if (!window.confirm(`Are you sure you want to completely remove account ${staffObj.email}? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await deleteUserAccount(staffObj.id);
      showToast(res.message || `Account ${staffObj.email} removed.`, 'success');
      loadStaff();
      loadStats();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // ── Add Staff Form Submit (Task S.2) ────────────────────────────────────────
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!addStaffForm.email.trim()) errs.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addStaffForm.email.trim())) {
      errs.email = 'Enter a valid email address';
    }
    if (!addStaffForm.password) errs.password = 'Password is required';
    else if (addStaffForm.password.length < 6) errs.password = 'Password must be at least 6 characters';

    setAddStaffErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setAddStaffSubmitting(true);
    try {
      await createStaffAccount(addStaffForm);
      showToast(`Staff account ${addStaffForm.email} created successfully!`, 'success');
      setShowAddStaffModal(false);
      setAddStaffForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'STAFF',
        phone_number: '',
      });
      loadStaff();
      loadStats();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setAddStaffSubmitting(false);
    }
  };

  // ── Update Staff Role (Task S.2) ───────────────────────────────────────────
  const handleUpdateRole = async (staffId, newRole) => {
    try {
      await updateStaffAccount(staffId, { role: newRole });
      showToast(`Role updated to ${newRole}!`, 'success');
      setEditingStaffRole(null);
      loadStaff();
      loadStats();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // ── Load Payments & Analytics (Task S.3) ───────────────────────────────────
  const loadPayments = useCallback(async () => {
    setTransactionsLoading(true);
    setTransactionsError('');
    try {
      const params = {};
      if (txStatusFilter !== 'ALL') params.status = txStatusFilter;
      if (txMethodFilter !== 'ALL') params.method = txMethodFilter;
      if (txDateFilter) params.date = txDateFilter;
      if (txSearch.trim()) params.search = txSearch.trim();

      // Fetch transactions first, then pass them to analytics for client-side fallback
      const txList = await fetchAdminTransactions(params);
      setTransactions(txList);

      // Also fetch all unfiltered transactions for accurate analytics
      const allTx = (txStatusFilter !== 'ALL' || txMethodFilter !== 'ALL' || txDateFilter || txSearch.trim())
        ? await fetchAdminTransactions({}).catch(() => txList)
        : txList;

      const analytics = await fetchAdminPaymentAnalytics(allTx);
      setPaymentAnalytics(analytics);
    } catch (err) {
      setTransactionsError(getErrorMessage(err));
    } finally {
      setTransactionsLoading(false);
    }
  }, [txStatusFilter, txMethodFilter, txDateFilter, txSearch]);

  // ── Load Kitchen Orders ────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await getIncomingOrders();
      setOrders(data);
    } catch {
      // ignore
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast(`Order #${orderId} marked as ${newStatus}!`, 'success');
      loadOrders();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // ── Tab switching loader ───────────────────────────────────────────────────
  useEffect(() => {
    loadStats();
    if (activeTab === 'students') loadStudents();
    else if (activeTab === 'staff') loadStaff();
    else if (activeTab === 'payments') loadPayments();
    else if (activeTab === 'orders') loadOrders();
    else if (activeTab === 'menu') loadFoodItems();
  }, [activeTab, loadStudents, loadStaff, loadPayments, loadOrders, loadFoodItems, loadStats]);

  const filteredFoodItems = foodItems.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(foodSearch.toLowerCase()) ||
      (f.category_name || '').toLowerCase().includes(foodSearch.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(foodSearch.toLowerCase());
    if (!matchSearch) return false;
    if (foodStatusFilter === 'available') return f.is_available;
    if (foodStatusFilter === 'out_of_stock') return !f.is_available;
    return true;
  });

  // ── Handle Admin Logout (Task S.4) ─────────────────────────────────────────
  const handleAdminLogout = async () => {
    if (!window.confirm('Are you sure you want to log out of the Administrator Portal?')) {
      return;
    }
    try {
      await logout();
      if (onLogout) onLogout();
      else if (onNavigateToHome) onNavigateToHome();
    } catch {
      if (onLogout) onLogout();
    }
  };

  const adminDisplayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || user?.email || 'Admin';
  const adminInitial = adminDisplayName[0].toUpperCase();

  return (
    <div className="admin-dashboard">
      {/* ── Toast Notification ── */}
      {toast.show && (
        <div className={`admin-toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠' : 'ℹ'}</span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button className="admin-toast-close" onClick={() => setToast({ show: false, message: '', type: 'info' })}>
            ✕
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ADMIN HEADER & NAVIGATION (Task S.4 & Routing)
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-brand" onClick={() => setActiveTab('students')}>
            <span className="admin-brand-logo">🛡️</span>
            <div>
              <span className="admin-brand-name">SmartCanteen</span>
              <span className="admin-brand-tag">Administrator Portal</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="admin-nav">
          <button
            className={`admin-nav-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            🎓 Students {userStats?.students?.total !== undefined && `(${userStats.students.total})`}
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            👨‍🍳 Staff Access {userStats?.staff?.total !== undefined && `(${userStats.staff.total})`}
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            💳 Payments &amp; Revenue
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Kitchen Orders
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            🥘 Food Availability {foodItems.length > 0 && `(${foodItems.length})`}
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            📝 Task Management
          </button>
        </nav>

        {/* Right Actions */}
        <div className="admin-header-right">
          {/* Back to Home / Customer View */}
          {onNavigateToHome && (
            <button className="admin-btn-portal" onClick={onNavigateToHome} title="View customer canteen portal">
              🍽️ Customer Portal
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            className="theme-toggle-btn nav-icon-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Admin User Chip */}
          <div className="admin-user-chip" title={user?.email}>
            <div className="admin-avatar">{adminInitial}</div>
            <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{adminDisplayName}</span>
            <span className="badge-role admin">ADMIN</span>
          </div>

          {/* Logout Action (Task S.4) */}
          <button className="admin-logout-btn" onClick={handleAdminLogout} title="Sign out of Admin session">
            🚪 Logout
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════════════════════════════ */}
      <main className="admin-main">
        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: STUDENTS MANAGEMENT (TASK S.1)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'students' && (
          <div>
            <div className="admin-section-header">
              <div>
                <h1 className="admin-section-title">🎓 Registered Student Management</h1>
                <p className="admin-section-subtitle">
                  Inspect student profiles, wallet balances, account status, and order history.
                </p>
              </div>
              <button className="admin-btn-secondary" onClick={loadStudents}>
                🔄 Refresh
              </button>
            </div>

            {/* Metrics Row */}
            <div className="admin-metrics-grid">
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                  🎓
                </div>
                <div>
                  <div className="admin-metric-value">{userStats?.students?.total ?? students.length}</div>
                  <div className="admin-metric-label">Total Registered Students</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                  ●
                </div>
                <div>
                  <div className="admin-metric-value">
                    {userStats?.students?.active ?? students.filter((s) => s.is_active).length}
                  </div>
                  <div className="admin-metric-label">Active Student Accounts</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  ✕
                </div>
                <div>
                  <div className="admin-metric-value">
                    {userStats?.students?.inactive ?? students.filter((s) => !s.is_active).length}
                  </div>
                  <div className="admin-metric-label">Disabled Accounts</div>
                </div>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <div className="admin-search-wrap">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by name, email, student ID..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <select
                  className="admin-filter-select"
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="true">Active Only</option>
                  <option value="false">Disabled Only</option>
                </select>
              </div>
            </div>

            {/* Loading / Error States */}
            {studentsLoading && (
              <div className="admin-state-box">
                <div className="admin-spinner" />
                <span>Loading registered students from database…</span>
              </div>
            )}

            {studentsError && (
              <div className="admin-toast error" style={{ position: 'static', margin: '20px 0', maxWidth: '100%' }}>
                ⚠ {studentsError}
              </div>
            )}

            {/* Students Table */}
            {!studentsLoading && !studentsError && students.length === 0 && (
              <div className="admin-state-box">
                <div className="admin-empty-icon">🎓</div>
                <div className="admin-empty-title">No Students Found</div>
                <p>No registered student accounts match your filter criteria.</p>
              </div>
            )}

            {!studentsLoading && students.length > 0 && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Student ID / Username</th>
                      <th>Phone</th>
                      <th>Wallet Balance</th>
                      <th>Total Orders</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st) => {
                      const fullName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.username || 'Student';
                      const initial = fullName[0].toUpperCase();

                      return (
                        <tr key={st.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="admin-avatar" style={{ background: '#16a34a' }}>
                                {initial}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700 }}>{fullName}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{st.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <code style={{ fontSize: '0.85rem' }}>{st.username}</code>
                          </td>
                          <td>{st.phone_number || '—'}</td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            ₹{parseFloat(st.wallet_balance || 0).toFixed(2)}
                          </td>
                          <td>{st.total_orders ?? 0} orders</td>
                          <td>
                            <span className={`badge-status ${st.is_active ? 'active' : 'disabled'}`}>
                              {st.is_active ? '● Active' : '✕ Disabled'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {st.created_at ? new Date(st.created_at).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="admin-btn-secondary"
                                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                onClick={() => handleInspectStudent(st.id)}
                                title="Inspect profile & orders"
                              >
                                🔍 Inspect
                              </button>
                              <button
                                className="admin-btn-secondary"
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '0.78rem',
                                  color: st.is_active ? '#ef4444' : '#16a34a',
                                }}
                                onClick={() => handleToggleStatus(st)}
                                title={st.is_active ? 'Deactivate account' : 'Reactivate account'}
                              >
                                {st.is_active ? 'Deactivate' : 'Reactivate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: STAFF ACCESS MANAGEMENT (TASK S.2)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'staff' && (
          <div>
            <div className="admin-section-header">
              <div>
                <h1 className="admin-section-title">👨‍🍳 Staff Access &amp; Operational Roles</h1>
                <p className="admin-section-subtitle">
                  Provision canteen staff accounts, assign operational roles, and manage access permissions.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="admin-btn-secondary" onClick={loadStaff}>
                  🔄 Refresh
                </button>
                <button className="admin-btn-primary" onClick={() => setShowAddStaffModal(true)}>
                  + Add New Staff
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="admin-metrics-grid">
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#fef9c3', color: '#ca8a04' }}>
                  👨‍🍳
                </div>
                <div>
                  <div className="admin-metric-value">{userStats?.staff?.total ?? staffList.length}</div>
                  <div className="admin-metric-label">Total Staff Accounts</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                  ●
                </div>
                <div>
                  <div className="admin-metric-value">
                    {userStats?.staff?.active ?? staffList.filter((s) => s.is_active).length}
                  </div>
                  <div className="admin-metric-label">Active Staff</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  🛡️
                </div>
                <div>
                  <div className="admin-metric-value">{userStats?.admins?.total ?? 1}</div>
                  <div className="admin-metric-label">Administrators</div>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <div className="admin-search-wrap">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search staff by name or email..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                  />
                </div>
                <select
                  className="admin-filter-select"
                  value={staffStatusFilter}
                  onChange={(e) => setStaffStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="true">Active Staff Only</option>
                  <option value="false">Deactivated Staff Only</option>
                </select>
              </div>
            </div>

            {staffLoading && (
              <div className="admin-state-box">
                <div className="admin-spinner" />
                <span>Loading staff directory…</span>
              </div>
            )}

            {staffError && (
              <div className="admin-toast error" style={{ position: 'static', margin: '20px 0', maxWidth: '100%' }}>
                ⚠ {staffError}
              </div>
            )}

            {!staffLoading && staffList.length === 0 && (
              <div className="admin-state-box">
                <div className="admin-empty-icon">👨‍🍳</div>
                <div className="admin-empty-title">No Staff Accounts</div>
                <p>Click "+ Add New Staff" above to create canteen staff members.</p>
              </div>
            )}

            {!staffLoading && staffList.length > 0 && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Operational Role</th>
                      <th>Status</th>
                      <th>Phone</th>
                      <th>Date Added</th>
                      <th>Access Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((st) => {
                      const fullName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.username || 'Staff';
                      const initial = fullName[0].toUpperCase();
                      const isCurrentUser = user?.id === st.id;

                      return (
                        <tr key={st.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                className="admin-avatar"
                                style={{ background: st.role === 'ADMIN' ? '#2563eb' : '#d97706' }}
                              >
                                {initial}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700 }}>
                                  {fullName} {isCurrentUser && <span style={{ color: '#2563eb', fontSize: '0.75rem' }}>(You)</span>}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{st.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {editingStaffRole?.id === st.id ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <select
                                  className="admin-filter-select"
                                  style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                  value={editingStaffRole.role}
                                  onChange={(e) => setEditingStaffRole({ ...editingStaffRole, role: e.target.value })}
                                >
                                  <option value="STAFF">Staff (Kitchen/Orders)</option>
                                  <option value="ADMIN">Admin (Full Control)</option>
                                </select>
                                <button
                                  className="admin-btn-primary"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                  onClick={() => handleUpdateRole(st.id, editingStaffRole.role)}
                                >
                                  Save
                                </button>
                                <button
                                  className="admin-btn-secondary"
                                  style={{ padding: '4px 6px', fontSize: '0.75rem' }}
                                  onClick={() => setEditingStaffRole(null)}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className={`badge-role ${st.role.toLowerCase()}`}>
                                  {st.role === 'ADMIN' ? '🛡️ Admin' : '👨‍🍳 Staff'}
                                </span>
                                {!isCurrentUser && (
                                  <button
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                                    onClick={() => setEditingStaffRole({ id: st.id, role: st.role })}
                                    title="Change role"
                                  >
                                    ✏️
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`badge-status ${st.is_active ? 'active' : 'disabled'}`}>
                              {st.is_active ? '● Active' : '✕ Deactivated'}
                            </span>
                          </td>
                          <td>{st.phone_number || '—'}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {st.created_at ? new Date(st.created_at).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="admin-btn-secondary"
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '0.78rem',
                                  color: st.is_active ? '#ef4444' : '#16a34a',
                                }}
                                disabled={isCurrentUser}
                                onClick={() => handleToggleStatus(st)}
                                title={isCurrentUser ? 'Cannot deactivate yourself' : st.is_active ? 'Deactivate staff account' : 'Reactivate staff account'}
                              >
                                {st.is_active ? 'Deactivate' : 'Reactivate'}
                              </button>
                              {!isCurrentUser && (
                                <button
                                  className="admin-btn-secondary"
                                  style={{ padding: '5px 10px', fontSize: '0.78rem', color: '#ef4444' }}
                                  onClick={() => handleDeleteStaff(st)}
                                  title="Remove staff account"
                                >
                                  ✕ Remove
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: PAYMENT DETAILS & TRANSACTION LOG (TASK S.3)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'payments' && (
          <div>
            <div className="admin-section-header">
              <div>
                <h1 className="admin-section-title">💳 Payment Details &amp; Transaction Log</h1>
                <p className="admin-section-subtitle">
                  Inspect real settlement records, revenue breakdown, and transaction status logs.
                </p>
              </div>
              <button className="admin-btn-secondary" onClick={loadPayments}>
                🔄 Refresh Records
              </button>
            </div>

            {/* Financial Revenue Metrics Cards */}
            <div className="admin-metrics-grid">
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                  💰
                </div>
                <div>
                  <div className="admin-metric-value">
                    ₹{paymentAnalytics ? paymentAnalytics.total_revenue.toFixed(2) : '0.00'}
                  </div>
                  <div className="admin-metric-label">Total Completed Revenue</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                  🧾
                </div>
                <div>
                  <div className="admin-metric-value">
                    {paymentAnalytics ? paymentAnalytics.completed_count : transactions.length}
                  </div>
                  <div className="admin-metric-label">Completed Transactions</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#fef9c3', color: '#ca8a04' }}>
                  📅
                </div>
                <div>
                  <div className="admin-metric-value">
                    ₹{paymentAnalytics ? paymentAnalytics.today_revenue.toFixed(2) : '0.00'}
                  </div>
                  <div className="admin-metric-label">Today's Sales Revenue</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                  📊
                </div>
                <div>
                  <div className="admin-metric-value">
                    ₹{paymentAnalytics ? paymentAnalytics.average_order_value.toFixed(2) : '0.00'}
                  </div>
                  <div className="admin-metric-label">Average Order Value</div>
                </div>
              </div>
            </div>

            {/* Daily Sales Breakdown & Method Distribution */}
            {paymentAnalytics?.daily_sales && paymentAnalytics.daily_sales.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                {/* Daily Breakdown Table */}
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '18px 20px',
                  }}
                >
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 700 }}>
                    📈 Daily Sales Breakdown (Last 14 Days)
                  </h3>
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {paymentAnalytics.daily_sales
                      .slice()
                      .reverse()
                      .slice(0, 7)
                      .map((d) => {
                        const maxRev = Math.max(...paymentAnalytics.daily_sales.map((s) => s.revenue), 100);
                        const pct = Math.min(100, Math.round((d.revenue / maxRev) * 100));

                        return (
                          <div key={d.date} className="sales-bar-item">
                            <span className="sales-bar-date">{d.day_name} ({d.date.slice(5)})</span>
                            <div className="sales-bar-track">
                              <div className="sales-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="sales-bar-amount">
                              ₹{d.revenue.toFixed(2)} ({d.orders_count})
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Payment Methods Distribution */}
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '18px 20px',
                  }}
                >
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 700 }}>
                    💳 Revenue by Payment Method
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {paymentAnalytics.method_breakdown?.map((m) => (
                      <div
                        key={m.payment_method}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: 'var(--surface-2)',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>
                            {m.payment_method === 'ONLINE' ? '🌐' : m.payment_method === 'WALLET' ? '💳' : '💵'}
                          </span>
                          <span style={{ fontWeight: 700 }}>
                            {m.payment_method === 'ONLINE' ? 'Online / UPI' : m.payment_method === 'WALLET' ? 'Wallet' : 'Cash on Counter'}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                            ₹{m.total_amount.toFixed(2)}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                            ({m.count} txns)
                          </span>
                        </div>
                      </div>
                    ))}
                    {(!paymentAnalytics.method_breakdown || paymentAnalytics.method_breakdown.length === 0) && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No payment method data recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Filter Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <div className="admin-search-wrap">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by transaction ID, order #, customer..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                  />
                </div>
                <select
                  className="admin-filter-select"
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
                <select
                  className="admin-filter-select"
                  value={txMethodFilter}
                  onChange={(e) => setTxMethodFilter(e.target.value)}
                >
                  <option value="ALL">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online / UPI</option>
                  <option value="WALLET">Wallet</option>
                </select>
                <input
                  type="date"
                  className="admin-date-input"
                  value={txDateFilter}
                  onChange={(e) => setTxDateFilter(e.target.value)}
                  title="Filter by specific date"
                />
                {txDateFilter && (
                  <button
                    className="admin-btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                    onClick={() => setTxDateFilter('')}
                  >
                    Clear Date
                  </button>
                )}
              </div>
            </div>

            {/* Transactions Log Table */}
            {transactionsLoading && (
              <div className="admin-state-box">
                <div className="admin-spinner" />
                <span>Loading payment transactions log…</span>
              </div>
            )}

            {transactionsError && (
              <div className="admin-toast error" style={{ position: 'static', margin: '20px 0', maxWidth: '100%' }}>
                ⚠ {transactionsError}
              </div>
            )}

            {!transactionsLoading && transactions.length === 0 && (
              <div className="admin-state-box">
                <div className="admin-empty-icon">💳</div>
                <div className="admin-empty-title">No Transactions Found</div>
                <p>No payment records match the applied filters.</p>
              </div>
            )}

            {!transactionsLoading && transactions.length > 0 && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Date &amp; Time</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <code style={{ fontSize: '0.78rem', color: '#2563eb' }} title={tx.transaction_id}>
                            {tx.transaction_id ? `${tx.transaction_id.slice(0, 12)}…` : `TX-${tx.id}`}
                          </code>
                        </td>
                        <td>
                          <strong style={{ fontSize: '0.85rem' }}>{tx.order_number || `Order #${tx.order}`}</strong>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>{tx.customer_name || 'Customer'}</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{tx.customer_email || '—'}</div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--text)' }}>
                          ₹{parseFloat(tx.amount || 0).toFixed(2)}
                        </td>
                        <td>
                          <span className="badge-method">
                            {tx.payment_method === 'ONLINE' ? '🌐 UPI/Card' : tx.payment_method === 'WALLET' ? '💳 Wallet' : '💵 Cash'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {tx.timestamp ? new Date(tx.timestamp).toLocaleString('en-IN') : '—'}
                        </td>
                        <td>
                          <span className={`badge-status ${tx.status.toLowerCase()}`}>
                            {tx.status === 'COMPLETED' ? '● Completed' : tx.status === 'PENDING' ? '⏳ Pending' : tx.status === 'FAILED' ? '✕ Failed' : tx.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="admin-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => setInspectTx(tx)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 4: KITCHEN ORDERS OVERSIGHT
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div>
            <div className="admin-section-header">
              <div>
                <h1 className="admin-section-title">📋 Canteen Kitchen Orders Oversight</h1>
                <p className="admin-section-subtitle">
                  Monitor live incoming orders, tokens, preparation workflows, and fulfillments.
                </p>
              </div>
              <button className="admin-btn-secondary" onClick={loadOrders}>
                🔄 Refresh Orders
              </button>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {['ALL', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  className={`admin-nav-btn ${orderStatusFilter === st ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter(st)}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  {st === 'ALL' ? 'All Orders' : st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {ordersLoading && (
              <div className="admin-state-box">
                <div className="admin-spinner" />
                <span>Loading live orders…</span>
              </div>
            )}

            {!ordersLoading && orders.length === 0 && (
              <div className="admin-state-box">
                <div className="admin-empty-icon">📦</div>
                <div className="admin-empty-title">No Orders</div>
                <p>No active customer orders matching criteria.</p>
              </div>
            )}

            {!ordersLoading && orders.length > 0 && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Token</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter((o) => (orderStatusFilter === 'ALL' ? true : o.status === orderStatusFilter))
                      .map((ord) => (
                        <tr key={ord.id}>
                          <td><strong>{ord.order_number}</strong></td>
                          <td>
                            {ord.queue_number ? (
                              <span style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>
                                #{ord.queue_number}
                              </span>
                            ) : '—'}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{ord.user_name || 'Student'}</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{ord.user_email || ''}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>
                              {ord.items?.map((it) => (
                                <div key={it.id}>{it.quantity}× {it.food_item_name}</div>
                              ))}
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            ₹{parseFloat(ord.final_amount || 0).toFixed(2)}
                          </td>
                          <td>
                            <span className={`badge-status ${ord.status.toLowerCase().replace(/_/g, '-')}`}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-status ${ord.payment_status === 'COMPLETED' ? 'completed' : 'pending'}`}>
                              {ord.payment_status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              <button
                                className="admin-btn-secondary"
                                style={{ padding: '3px 6px', fontSize: '0.72rem' }}
                                disabled={ord.status === 'PREPARING'}
                                onClick={() => handleUpdateOrderStatus(ord.id, 'PREPARING')}
                              >
                                Preparing
                              </button>
                              <button
                                className="admin-btn-secondary"
                                style={{ padding: '3px 6px', fontSize: '0.72rem', color: '#16a34a' }}
                                disabled={ord.status === 'READY_FOR_PICKUP'}
                                onClick={() => handleUpdateOrderStatus(ord.id, 'READY_FOR_PICKUP')}
                              >
                                Ready
                              </button>
                              <button
                                className="admin-btn-secondary"
                                style={{ padding: '3px 6px', fontSize: '0.72rem' }}
                                disabled={ord.status === 'COMPLETED'}
                                onClick={() => handleUpdateOrderStatus(ord.id, 'COMPLETED')}
                              >
                                Completed
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 5: FOOD MENU & AVAILABILITY OVERVIEW (Task 4.10)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'menu' && (
          <div>
            <div className="admin-section-header">
              <div>
                <h1 className="admin-section-title">🥘 Food Menu &amp; Availability View</h1>
                <p className="admin-section-subtitle">
                  Inspect canteen food items, pricing, dietary specifications, and real-time stock availability.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="admin-btn-primary"
                  onClick={() => setShowAddFoodModal(true)}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  ➕ Add New Food Item
                </button>
                <button className="admin-btn-secondary" onClick={loadFoodItems}>
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="admin-metrics-grid">
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                  🥘
                </div>
                <div>
                  <div className="admin-metric-value">{foodItems.length}</div>
                  <div className="admin-metric-label">Total Menu Items</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                  ✓
                </div>
                <div>
                  <div className="admin-metric-value">
                    {foodItems.filter(f => f.is_available).length}
                  </div>
                  <div className="admin-metric-label">In Stock &amp; Available</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  ✕
                </div>
                <div>
                  <div className="admin-metric-value">
                    {foodItems.filter(f => !f.is_available).length}
                  </div>
                  <div className="admin-metric-label">Out of Stock Items</div>
                </div>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <div className="admin-search-wrap">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by food name, description, or category…"
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                  />
                  {foodSearch && (
                    <button className="admin-search-clear" onClick={() => setFoodSearch('')}>
                      ✕
                    </button>
                  )}
                </div>

                <div className="admin-filter-group">
                  <select
                    className="admin-filter-select"
                    value={foodStatusFilter}
                    onChange={(e) => setFoodStatusFilter(e.target.value)}
                  >
                    <option value="">All Availability Statuses</option>
                    <option value="available">✓ In Stock Only</option>
                    <option value="out_of_stock">✕ Out of Stock Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Food Items Table */}
            {foodLoading ? (
              <div className="admin-state-box">
                <div className="admin-spinner" />
                <span>Loading food menu items from database…</span>
              </div>
            ) : filteredFoodItems.length === 0 ? (
              <div className="admin-state-box">
                <span className="admin-state-icon">🥘</span>
                <span className="admin-state-title">No food items found</span>
                <span className="admin-state-desc">
                  {foodSearch || foodStatusFilter
                    ? 'No items match your search or filter criteria.'
                    : 'No food items are currently registered in the database.'}
                </span>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Food Item</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Quantity Available</th>
                      <th>Dietary</th>
                      <th>Est. Prep Time</th>
                      <th>Availability Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFoodItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.4rem' }}>{item.is_vegetarian ? '🌱' : '🍗'}</span>
                            <div>
                              <strong style={{ color: 'var(--text)' }}>{item.name}</strong>
                              {item.description && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{item.category_name || 'General'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          ₹{parseFloat(item.price || 0).toFixed(2)}
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.82rem',
                              background: (!item.is_available || (item.quantity_available ?? 0) === 0) ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                              color: (!item.is_available || (item.quantity_available ?? 0) === 0) ? '#ef4444' : '#16a34a',
                              border: `1px solid ${(!item.is_available || (item.quantity_available ?? 0) === 0) ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            📦 {item.quantity_available !== undefined ? item.quantity_available : (item.is_available ? 50 : 0)} items
                          </span>
                        </td>
                        <td>
                          <span className={`badge-role ${item.is_vegetarian ? 'student' : 'staff'}`}>
                            {item.is_vegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
                          </span>
                        </td>
                        <td>⏱ {item.preparation_time_minutes || 15} mins</td>
                        <td>
                          <span
                            className={`badge-status ${item.is_available ? 'active' : 'disabled'}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            {item.is_available ? '✓ Available' : '✕ Out of Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 6: TASK MANAGEMENT (ADMIN FULL ACCESS)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'tasks' && (
          <TaskManagement
            user={user}
            isAdmin={true}
            onToast={(msg, type) => showToast(msg, type === 'error' ? 'error' : 'success')}
          />
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: INSPECT INDIVIDUAL STUDENT PROFILE (TASK S.1)
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedStudent && (
        <div className="admin-modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">🎓 Student Profile Inspection</h2>
              <button className="admin-modal-close" onClick={() => setSelectedStudent(null)}>✕</button>
            </div>

            <div className="admin-modal-body">
              {loadingStudentDetail ? (
                <div className="admin-state-box">
                  <div className="admin-spinner" />
                  <span>Loading full student profile…</span>
                </div>
              ) : (
                <div>
                  {/* Top user profile header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div
                      className="admin-avatar"
                      style={{ width: 56, height: 56, fontSize: '1.6rem', background: '#16a34a' }}
                    >
                      {selectedStudent.first_name ? selectedStudent.first_name[0].toUpperCase() : selectedStudent.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                        {selectedStudent.first_name || ''} {selectedStudent.last_name || ''}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedStudent.email}</div>
                      <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
                        <span className="badge-role student">STUDENT</span>
                        <span className={`badge-status ${selectedStudent.is_active ? 'active' : 'disabled'}`}>
                          {selectedStudent.is_active ? '● Active' : '✕ Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 10,
                      marginBottom: 20,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ padding: '10px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>WALLET BALANCE</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                        ₹{parseFloat(selectedStudent.wallet_balance || 0).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ORDERS</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 2 }}>
                        {selectedStudent.total_orders ?? 0}
                      </div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL SPENT</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 2 }}>
                        ₹{parseFloat(selectedStudent.total_spent || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Profile Details List */}
                  <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 8, marginBottom: 20, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Student ID / Username:</span>
                      <strong>{selectedStudent.username}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Phone Number:</span>
                      <strong>{selectedStudent.phone_number || '—'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Account Created:</span>
                      <strong>
                        {selectedStudent.created_at ? new Date(selectedStudent.created_at).toLocaleString('en-IN') : '—'}
                      </strong>
                    </div>
                  </div>

                  {/* Recent Orders of this student */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                      Recent Student Orders ({selectedStudent.recent_orders?.length || 0})
                    </h4>
                    {(!selectedStudent.recent_orders || selectedStudent.recent_orders.length === 0) ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No orders placed by this student yet.
                      </div>
                    ) : (
                      <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {selectedStudent.recent_orders.map((ord) => (
                          <div
                            key={ord.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              background: 'var(--surface-2)',
                              borderRadius: 6,
                              fontSize: '0.8rem',
                            }}
                          >
                            <div>
                              <strong style={{ color: 'var(--text)' }}>{ord.order_number}</strong>
                              <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                                {ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-IN') : ''}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 700 }}>₹{parseFloat(ord.final_amount).toFixed(2)}</span>
                              <span className={`badge-status ${ord.status.toLowerCase().replace(/_/g, '-')}`}>
                                {ord.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                className="admin-btn-secondary"
                style={{ color: selectedStudent.is_active ? '#ef4444' : '#16a34a' }}
                onClick={() => handleToggleStatus(selectedStudent, true)}
              >
                {selectedStudent.is_active ? 'Deactivate Student Account' : 'Reactivate Student Account'}
              </button>
              <button className="admin-btn-primary" onClick={() => setSelectedStudent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: ADD NEW STAFF ACCOUNT (TASK S.2)
      ══════════════════════════════════════════════════════════════════════ */}
      {showAddStaffModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddStaffModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">👨‍🍳 Create Staff Account</h2>
              <button className="admin-modal-close" onClick={() => setShowAddStaffModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="admin-form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. John"
                      value={addStaffForm.first_name}
                      onChange={(e) => setAddStaffForm({ ...addStaffForm, first_name: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Doe"
                      value={addStaffForm.last_name}
                      onChange={(e) => setAddStaffForm({ ...addStaffForm, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Staff Email Address *</label>
                  <input
                    type="email"
                    className="admin-form-input"
                    placeholder="staff@canteen.com"
                    value={addStaffForm.email}
                    onChange={(e) => setAddStaffForm({ ...addStaffForm, email: e.target.value })}
                  />
                  {addStaffErrors.email && <span className="admin-form-error">⚠ {addStaffErrors.email}</span>}
                </div>

                <div className="admin-form-group">
                  <label>Temporary Password *</label>
                  <input
                    type="password"
                    className="admin-form-input"
                    placeholder="Minimum 6 characters"
                    value={addStaffForm.password}
                    onChange={(e) => setAddStaffForm({ ...addStaffForm, password: e.target.value })}
                  />
                  {addStaffErrors.password && <span className="admin-form-error">⚠ {addStaffErrors.password}</span>}
                </div>

                <div className="admin-form-group">
                  <label>Operational Role</label>
                  <select
                    className="admin-form-select"
                    value={addStaffForm.role}
                    onChange={(e) => setAddStaffForm({ ...addStaffForm, role: e.target.value })}
                  >
                    <option value="STAFF">👨‍🍳 Canteen Staff (Kitchen &amp; Queue Management)</option>
                    <option value="ADMIN">🛡️ Administrator (Full System Control)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Contact Phone (Optional)</label>
                  <input
                    type="tel"
                    className="admin-form-input"
                    placeholder="Phone number"
                    value={addStaffForm.phone_number}
                    onChange={(e) => setAddStaffForm({ ...addStaffForm, phone_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setShowAddStaffModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={addStaffSubmitting}
                >
                  {addStaffSubmitting ? 'Creating Account…' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: INSPECT TRANSACTION DETAILS (TASK S.3)
      ══════════════════════════════════════════════════════════════════════ */}
      {inspectTx && (
        <div className="admin-modal-overlay" onClick={() => setInspectTx(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">💳 Transaction Details</h2>
              <button className="admin-modal-close" onClick={() => setInspectTx(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 8, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>
                  <code style={{ color: '#2563eb' }}>{inspectTx.transaction_id}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Associated Order:</span>
                  <strong>{inspectTx.order_number}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                  <strong>{inspectTx.customer_name} ({inspectTx.customer_email || 'N/A'})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                  <span className="badge-method">{inspectTx.payment_method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>
                    ₹{parseFloat(inspectTx.amount).toFixed(2)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
                  <span className={`badge-status ${inspectTx.status.toLowerCase()}`}>{inspectTx.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                  <span>{new Date(inspectTx.timestamp).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn-primary" onClick={() => setInspectTx(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Food Item Modal */}
      {showAddFoodModal && (
        <AddFoodItemModal
          onClose={() => setShowAddFoodModal(false)}
          onSuccess={(item) => {
            loadFoodItems();
            showToast(`Food item "${item.name}" added and published to homepage!`, 'success');
          }}
        />
      )}
    </div>
  );
}
