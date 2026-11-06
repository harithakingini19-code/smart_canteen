import React, { useState, useMemo, useRef, useEffect } from 'react';
import './InventoryOverview.css';

// ─── Inline Food Illustrations matching screenshot ──────────────────────────
const FoodImages = {
  tomatoes: (
    <svg viewBox="0 0 36 36" width="34" height="34" fill="none">
      <circle cx="16" cy="22" r="11" fill="#EF4444" />
      <circle cx="13" cy="18" r="4" fill="#F87171" opacity="0.6" />
      <circle cx="23" cy="21" r="10" fill="#DC2626" />
      <circle cx="21" cy="17" r="3.5" fill="#EF4444" opacity="0.7" />
      {/* Green stem */}
      <path d="M18 12 C18 9, 20 7, 22 6 C20 8, 22 9, 20 12 Z" fill="#15803D" />
      <path d="M17 11 L13 8 C15 9, 15 11, 17 12 Z" fill="#16A34A" />
      <path d="M21 11 L25 9 C23 10, 23 11, 21 12 Z" fill="#16A34A" />
    </svg>
  ),
  chicken: (
    <svg viewBox="0 0 36 36" width="34" height="34" fill="none">
      {/* Wooden plate */}
      <ellipse cx="18" cy="24" rx="16" ry="7" fill="#E2C9A5" stroke="#C4A47C" strokeWidth="1" />
      {/* Meat */}
      <ellipse cx="16" cy="21" rx="10" ry="5.5" fill="#FBCFE8" />
      <ellipse cx="15" cy="20" rx="8" ry="4" fill="#F472B6" opacity="0.3" />
      <ellipse cx="21" cy="20" rx="8" ry="5" fill="#FDA4AF" />
      <path d="M12 20 Q16 17 21 19" stroke="#FB7185" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  egg: (
    <svg viewBox="0 0 36 36" width="34" height="34" fill="none">
      <ellipse cx="18" cy="19" rx="10" ry="13" fill="#D97706" />
      <ellipse cx="18" cy="19" rx="9" ry="12" fill="#F59E0B" />
      <ellipse cx="16" cy="15" rx="5" ry="7" fill="#FDE68A" opacity="0.5" />
    </svg>
  ),
  pasta: (
    <svg viewBox="0 0 36 36" width="34" height="34" fill="none">
      <rect x="7" y="15" width="22" height="11" rx="4" fill="#FCD34D" stroke="#D97706" strokeWidth="1" />
      <path d="M11 16 L11 25 M15 16 L15 25 M19 16 L19 25 M23 16 L23 25" stroke="#B45309" strokeWidth="1.2" />
      <ellipse cx="14" cy="14" rx="6" ry="3.5" fill="#FDE68A" stroke="#D97706" strokeWidth="0.8" />
      <ellipse cx="22" cy="13" rx="6" ry="3.5" fill="#FDE68A" stroke="#D97706" strokeWidth="0.8" />
    </svg>
  ),
  oil: (
    <svg viewBox="0 0 36 36" width="34" height="34" fill="none">
      {/* Bottle neck */}
      <rect x="16" y="7" width="4" height="6" fill="#FDE68A" stroke="#D97706" strokeWidth="0.8" />
      <rect x="15" y="5" width="6" height="3" rx="1" fill="#CA8A04" />
      {/* Bottle body */}
      <path d="M13 14 C13 13, 15 13, 16 13 L20 13 C21 13, 23 13, 23 14 L25 28 C25 29, 24 30, 23 30 L13 30 C12 30, 11 29, 11 28 Z" fill="#FEF08A" stroke="#EAB308" strokeWidth="1" />
      {/* Label & Olive */}
      <rect x="13.5" y="19" width="9" height="7" rx="1.5" fill="#FFFFFF" opacity="0.9" />
      <circle cx="18" cy="22.5" r="2" fill="#65A30D" />
    </svg>
  ),
};

// ─── Exact Sample Items from Screenshot ─────────────────────────────────────
const INITIAL_ITEMS = [
  {
    id: 1,
    name: 'Tomatoes',
    imageKey: 'tomatoes',
    quantity: '120kg',
    storage: 'Freezer',
    lastUpdated: 'Aug 15, 2024, 14:30',
    status: 'Good',
  },
  {
    id: 2,
    name: 'Chicken Breast',
    imageKey: 'chicken',
    quantity: '40kg',
    storage: 'Freezer',
    lastUpdated: 'Aug 15, 2024, 14:30',
    status: 'Low Stock',
  },
  {
    id: 3,
    name: 'Egg',
    imageKey: 'egg',
    quantity: '0kg',
    storage: 'Freezer 2',
    lastUpdated: 'Aug 15, 2024, 14:30',
    status: 'Out of Stock',
  },
  {
    id: 4,
    name: 'Pasta',
    imageKey: 'pasta',
    quantity: '40kg',
    storage: 'Pantry',
    lastUpdated: 'Aug 15, 2024, 14:30',
    status: 'Expired',
  },
  {
    id: 5,
    name: 'Oil',
    imageKey: 'oil',
    quantity: '120kg',
    storage: 'Pantry',
    lastUpdated: 'Aug 15, 2024, 14:30',
    status: 'Good',
  },
  {
    id: 6,
    name: 'Tomatoes',
    imageKey: 'tomatoes',
    quantity: '120kg',
    storage: 'Freezer',
    lastUpdated: 'Aug 15, 2024, 14:30',
    status: 'Good',
  },
  {
    id: 7,
    name: 'Chicken Breast',
    imageKey: 'chicken',
    quantity: '40kg',
    storage: 'Freezer',
    lastUpdated: 'Aug 15, 2024, 14:30',
    status: 'Low Stock',
  },
  {
    id: 8,
    name: 'Egg',
    imageKey: 'egg',
    quantity: '0kg',
    storage: 'Freezer 2',
    lastUpdated: 'Aug 15, 2024, 14:30',
    status: 'Out of Stock',
  },
  {
    id: 9,
    name: 'Pasta',
    imageKey: 'pasta',
    quantity: '40kg',
    storage: 'Pantry',
    lastUpdated: 'Aug 15, 2024, 14:30',
    status: 'Expired',
  },
];

export default function InventoryOverview({ user, onToast }) {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [storageFilter, setStorageFilter] = useState('ALL');
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Overview Card Numbers State with Persistence
  const defaultStats = {
    total: 120,
    lowStock: 8,
    expired: 40,
    outOfStock: 15,
  };

  const [cardStats, setCardStats] = useState(() => {
    try {
      const saved = localStorage.getItem('canteen_inventory_card_stats');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultStats;
  });

  const [editingCardKey, setEditingCardKey] = useState(null);
  const [inlineValue, setInlineValue] = useState('');
  const [showEditStatsModal, setShowEditStatsModal] = useState(false);
  const [statsModalForm, setStatsModalForm] = useState(defaultStats);

  // Active Menu / Modals
  const [activeMenuId, setActiveMenuId] = useState(2); // Row 2 menu shown open in screenshot!
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Form State
  const initialForm = {
    name: '',
    imageKey: 'tomatoes',
    quantity: '',
    storage: 'Freezer',
    status: 'Good',
  };
  const [formData, setFormData] = useState(initialForm);

  const filterPopoverRef = useRef(null);

  // Close popup menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target)) {
        setShowFilterPopover(false);
      }
      if (!e.target.closest('.inv-actions-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchStorage = item.storage.toLowerCase().includes(q);
        const matchStatus = item.status.toLowerCase().includes(q);
        if (!matchName && !matchStorage && !matchStatus) return false;
      }
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (storageFilter !== 'ALL' && item.storage !== storageFilter) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, statusFilter, storageFilter]);

  // Selection handlers
  const isAllSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Add Item
  const handleOpenAdd = () => {
    setFormData(initialForm);
    setShowAddModal(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newItem = {
      id: Date.now(),
      name: formData.name,
      imageKey: formData.imageKey,
      quantity: formData.quantity || '0kg',
      storage: formData.storage,
      lastUpdated: 'Aug 15, 2024, 14:30',
      status: formData.status,
    };

    setItems((prev) => [newItem, ...prev]);
    setShowAddModal(false);
    if (onToast) onToast(`✅ Item "${newItem.name}" added to inventory.`);
  };

  // Edit Item
  const handleOpenEdit = (item) => {
    setActiveMenuId(null);
    setEditingItem(item);
    setFormData({
      name: item.name,
      imageKey: item.imageKey || 'tomatoes',
      quantity: item.quantity,
      storage: item.storage,
      status: item.status,
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingItem || !formData.name.trim()) return;

    const updated = {
      ...editingItem,
      name: formData.name,
      imageKey: formData.imageKey,
      quantity: formData.quantity,
      storage: formData.storage,
      status: formData.status,
      lastUpdated: 'Aug 15, 2024, 14:30',
    };

    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    if (viewingItem?.id === updated.id) setViewingItem(updated);
    setEditingItem(null);
    if (onToast) onToast(`✅ Item "${updated.name}" updated successfully.`);
  };

  // Delete Item
  const handleDeleteConfirm = () => {
    if (!deletingItem) return;
    setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(deletingItem.id);
      return next;
    });
    if (viewingItem?.id === deletingItem.id) setViewingItem(null);
    if (onToast) onToast(`🗑️ Item "${deletingItem.name}" removed.`);
    setDeletingItem(null);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Good':
        return 'inv-badge-good';
      case 'Low Stock':
        return 'inv-badge-low';
      case 'Out of Stock':
        return 'inv-badge-outofstock';
      case 'Expired':
        return 'inv-badge-expired';
      default:
        return 'inv-badge-good';
    }
  };

  const getCardLabel = (key) => {
    switch (key) {
      case 'total':
        return 'Total Items';
      case 'lowStock':
        return 'Low Stock Items';
      case 'expired':
        return 'Expired Items';
      case 'outOfStock':
        return 'Out of Stock Items';
      default:
        return 'Overview Metric';
    }
  };

  const handleStartInlineEdit = (key, currentValue) => {
    setEditingCardKey(key);
    setInlineValue(String(currentValue));
  };

  const handleSaveInlineEdit = (key) => {
    const num = parseInt(inlineValue, 10);
    const updatedNum = isNaN(num) || num < 0 ? 0 : num;
    const updated = { ...cardStats, [key]: updatedNum };
    setCardStats(updated);
    localStorage.setItem('canteen_inventory_card_stats', JSON.stringify(updated));
    setEditingCardKey(null);
    if (onToast) onToast(`✅ ${getCardLabel(key)} updated to ${updatedNum}`);
  };

  const handleCancelInlineEdit = () => {
    setEditingCardKey(null);
  };

  const handleOpenStatsModal = () => {
    setStatsModalForm(cardStats);
    setShowEditStatsModal(true);
  };

  const handleSaveStatsModal = (e) => {
    e.preventDefault();
    const updated = {
      total: Math.max(0, parseInt(statsModalForm.total, 10) || 0),
      lowStock: Math.max(0, parseInt(statsModalForm.lowStock, 10) || 0),
      expired: Math.max(0, parseInt(statsModalForm.expired, 10) || 0),
      outOfStock: Math.max(0, parseInt(statsModalForm.outOfStock, 10) || 0),
    };
    setCardStats(updated);
    localStorage.setItem('canteen_inventory_card_stats', JSON.stringify(updated));
    setShowEditStatsModal(false);
    if (onToast) onToast('✅ Overview card numbers updated successfully.');
  };

  const handleResetDefaultStats = () => {
    setCardStats(defaultStats);
    setStatsModalForm(defaultStats);
    localStorage.setItem('canteen_inventory_card_stats', JSON.stringify(defaultStats));
    setShowEditStatsModal(false);
    if (onToast) onToast('Reset overview numbers to default values.');
  };

  const displayName = user
    ? user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name || 'Sam Sam'
    : 'Sam Sam';

  return (
    <div className="inv-container">
      {/* ─── Top Header Section (Matching Screenshot) ────────────────────────── */}
      <div className="inv-header">
        <div className="inv-title-area">
          <h1>Inventory Management</h1>
          <p className="inv-subtitle">Today, August 16th 2024</p>
        </div>

        <div className="inv-header-right">
          {/* Search pill */}
          <div className="inv-header-search">
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Bell Icon */}
          <button className="inv-header-bell" title="Notifications">
            🔔
            <span className="inv-header-bell-dot" />
          </button>

          {/* User Chip */}
          <div className="inv-user-chip">
            <div className="inv-user-avatar">
              <span>👤</span>
            </div>
            <span className="inv-user-name">{displayName}</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>▾</span>
          </div>
        </div>
      </div>

      {/* ─── Top Overview Cards (Exact 4 Cards from Screenshot) ──────────────── */}
      <div className="inv-cards-grid">
        {/* 1. Total Items */}
        <div className="inv-card">
          <div>
            <div className="inv-card-top">
              <div className="inv-card-icon-box inv-icon-total">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                  <path d="m3.3 7 8.7 5 8.7-5"/>
                  <path d="M12 22V12"/>
                </svg>
              </div>
              <div className="inv-card-title">Total Items</div>
              <button type="button" className="inv-card-quick-edit-icon" title="Edit number" onClick={() => handleStartInlineEdit('total', cardStats.total)}>✎</button>
            </div>
            <div className="inv-card-subtitle">Total Items in stock</div>
          </div>
          {editingCardKey === 'total' ? (
            <div className="inv-card-edit-inline">
              <input type="number" min="0" className="inv-card-edit-input" value={inlineValue}
                onChange={(e) => setInlineValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit('total'); if (e.key === 'Escape') handleCancelInlineEdit(); }}
                autoFocus />
              <button type="button" className="inv-card-save-btn" onClick={() => handleSaveInlineEdit('total')}>✓</button>
              <button type="button" className="inv-card-cancel-btn" onClick={handleCancelInlineEdit}>✕</button>
            </div>
          ) : (
            <div className="inv-card-value-wrap" title="Click to edit" onClick={() => handleStartInlineEdit('total', cardStats.total)}>
              <div className="inv-card-value">{cardStats.total}</div>
              <span className="inv-card-edit-hint">✎</span>
            </div>
          )}
        </div>

        {/* 2. Low Stock Items */}
        <div className="inv-card">
          <div>
            <div className="inv-card-top">
              <div className="inv-card-icon-box inv-icon-low">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 14v4"/>
                  <path d="M3.34 19a10 10 0 1 1 17.32 0"/>
                </svg>
              </div>
              <div className="inv-card-title">Low Stock Items</div>
              <button type="button" className="inv-card-quick-edit-icon" title="Edit number" onClick={() => handleStartInlineEdit('lowStock', cardStats.lowStock)}>✎</button>
            </div>
            <div className="inv-card-subtitle">Number of items that are running low</div>
          </div>
          {editingCardKey === 'lowStock' ? (
            <div className="inv-card-edit-inline">
              <input type="number" min="0" className="inv-card-edit-input" value={inlineValue}
                onChange={(e) => setInlineValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit('lowStock'); if (e.key === 'Escape') handleCancelInlineEdit(); }}
                autoFocus />
              <button type="button" className="inv-card-save-btn" onClick={() => handleSaveInlineEdit('lowStock')}>✓</button>
              <button type="button" className="inv-card-cancel-btn" onClick={handleCancelInlineEdit}>✕</button>
            </div>
          ) : (
            <div className="inv-card-value-wrap" title="Click to edit" onClick={() => handleStartInlineEdit('lowStock', cardStats.lowStock)}>
              <div className="inv-card-value">{cardStats.lowStock}</div>
              <span className="inv-card-edit-hint">✎</span>
            </div>
          )}
        </div>

        {/* 3. Expired Items */}
        <div className="inv-card">
          <div>
            <div className="inv-card-top">
              <div className="inv-card-icon-box inv-icon-expired">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="inv-card-title">Expired Items</div>
              <button type="button" className="inv-card-quick-edit-icon" title="Edit number" onClick={() => handleStartInlineEdit('expired', cardStats.expired)}>✎</button>
            </div>
            <div className="inv-card-subtitle">Number of items past their expiration date</div>
          </div>
          {editingCardKey === 'expired' ? (
            <div className="inv-card-edit-inline">
              <input type="number" min="0" className="inv-card-edit-input" value={inlineValue}
                onChange={(e) => setInlineValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit('expired'); if (e.key === 'Escape') handleCancelInlineEdit(); }}
                autoFocus />
              <button type="button" className="inv-card-save-btn" onClick={() => handleSaveInlineEdit('expired')}>✓</button>
              <button type="button" className="inv-card-cancel-btn" onClick={handleCancelInlineEdit}>✕</button>
            </div>
          ) : (
            <div className="inv-card-value-wrap" title="Click to edit" onClick={() => handleStartInlineEdit('expired', cardStats.expired)}>
              <div className="inv-card-value">{cardStats.expired}</div>
              <span className="inv-card-edit-hint">✎</span>
            </div>
          )}
        </div>

        {/* 4. Out of Stock Items */}
        <div className="inv-card">
          <div>
            <div className="inv-card-top">
              <div className="inv-card-icon-box inv-icon-outofstock">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                </svg>
              </div>
              <div className="inv-card-title">Out of Stock Items</div>
              <button type="button" className="inv-card-quick-edit-icon" title="Edit number" onClick={() => handleStartInlineEdit('outOfStock', cardStats.outOfStock)}>✎</button>
            </div>
            <div className="inv-card-subtitle">Count of items currently out of stock</div>
          </div>
          {editingCardKey === 'outOfStock' ? (
            <div className="inv-card-edit-inline">
              <input type="number" min="0" className="inv-card-edit-input" value={inlineValue}
                onChange={(e) => setInlineValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit('outOfStock'); if (e.key === 'Escape') handleCancelInlineEdit(); }}
                autoFocus />
              <button type="button" className="inv-card-save-btn" onClick={() => handleSaveInlineEdit('outOfStock')}>✓</button>
              <button type="button" className="inv-card-cancel-btn" onClick={handleCancelInlineEdit}>✕</button>
            </div>
          ) : (
            <div className="inv-card-value-wrap" title="Click to edit" onClick={() => handleStartInlineEdit('outOfStock', cardStats.outOfStock)}>
              <div className="inv-card-value">{cardStats.outOfStock}</div>
              <span className="inv-card-edit-hint">✎</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Inventory Overview Main Card ────────────────────────────────────── */}
      <div className="inv-overview-card">
        {/* Card Header with controls */}
        <div className="inv-overview-top">
          <h2 className="inv-overview-heading">Inventory Overview</h2>

          <div className="inv-overview-actions">
            {/* Search Item Input */}
            <div className="inv-table-search">
              <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>🔍</span>
              <input
                type="text"
                placeholder="Search Item"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Dropdown */}
            <div className="inv-filter-wrap" ref={filterPopoverRef}>
              <button
                type="button"
                className={`inv-filter-btn ${statusFilter !== 'ALL' || storageFilter !== 'ALL' ? 'active' : ''}`}
                onClick={() => setShowFilterPopover((prev) => !prev)}
              >
                <span>▽ Filter</span>
                <span>▾</span>
              </button>

              {showFilterPopover && (
                <div className="inv-filter-popover">
                  <div className="inv-filter-group">
                    <label>Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Good">Good</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>

                  <div className="inv-filter-group" style={{ marginBottom: 0 }}>
                    <label>Storage Location</label>
                    <select
                      value={storageFilter}
                      onChange={(e) => setStorageFilter(e.target.value)}
                    >
                      <option value="ALL">All Locations</option>
                      <option value="Freezer">Freezer</option>
                      <option value="Freezer 2">Freezer 2</option>
                      <option value="Pantry">Pantry</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* + Add Item Button (Teal Pill Button) */}
            <button
              type="button"
              className="inv-add-btn"
              onClick={handleOpenAdd}
            >
              <span>+ Add Item</span>
            </button>
          </div>
        </div>

        {/* ─── Inventory Overview Table ─────────────────────────────────────── */}
        <div className="inv-table-wrapper">
          <table className="inv-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="inv-checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Item Name</th>
                <th style={{ textAlign: 'center' }}>Image</th>
                <th>Quantity</th>
                <th>Storage Location</th>
                <th>Last Updated</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const isMenuOpen = activeMenuId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={isSelected ? 'row-selected' : ''}
                  >
                    {/* Checkbox */}
                    <td>
                      <input
                        type="checkbox"
                        className="inv-checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                      />
                    </td>

                    {/* Item Name */}
                    <td>
                      <span className="inv-item-name">{item.name}</span>
                    </td>

                    {/* Image */}
                    <td>
                      <div className="inv-img-thumb" style={{ margin: '0 auto' }}>
                        {FoodImages[item.imageKey] || FoodImages.tomatoes}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td>
                      <span className="inv-qty">{item.quantity}</span>
                    </td>

                    {/* Storage Location */}
                    <td>
                      <span className="inv-location">{item.storage}</span>
                    </td>

                    {/* Last Updated */}
                    <td>
                      <span className="inv-date">{item.lastUpdated}</span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`inv-status-badge ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Action Column */}
                    <td>
                      <div className="inv-actions-cell inv-actions-container">
                        {/* Edit Pencil Icon Button */}
                        <button
                          type="button"
                          className="inv-icon-btn"
                          title="Edit Item"
                          onClick={() => handleOpenEdit(item)}
                        >
                          ✎
                        </button>

                        {/* Three-dot Menu Button */}
                        <button
                          type="button"
                          className="inv-icon-btn"
                          title="More options"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId((prev) => (prev === item.id ? null : item.id));
                          }}
                        >
                          •••
                        </button>

                        {/* Popup Dropdown Menu (matching screenshot popup) */}
                        {isMenuOpen && (
                          <div className="inv-popup-menu">
                            <button
                              type="button"
                              className="inv-menu-item delete"
                              onClick={() => {
                                setActiveMenuId(null);
                                setDeletingItem(item);
                              }}
                            >
                              <span>🗑</span>
                              <span>Delete</span>
                            </button>

                            <button
                              type="button"
                              className="inv-menu-item"
                              onClick={() => {
                                setActiveMenuId(null);
                                setViewingItem(item);
                              }}
                            >
                              <span>📄</span>
                              <span>View Details</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add Item Modal ─────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="inv-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="inv-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3 className="inv-modal-title">Add Inventory Item</h3>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="inv-form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Tomatoes"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Quantity</label>
                  <input
                    type="text"
                    placeholder="e.g. 120kg"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="inv-form-group">
                  <label>Storage Location</label>
                  <select
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                  >
                    <option value="Freezer">Freezer</option>
                    <option value="Freezer 2">Freezer 2</option>
                    <option value="Pantry">Pantry</option>
                  </select>
                </div>
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Item Image</label>
                  <select
                    value={formData.imageKey}
                    onChange={(e) => setFormData({ ...formData, imageKey: e.target.value })}
                  >
                    <option value="tomatoes">Tomatoes</option>
                    <option value="chicken">Chicken Breast</option>
                    <option value="egg">Egg</option>
                    <option value="pasta">Pasta</option>
                    <option value="oil">Cooking Oil</option>
                  </select>
                </div>

                <div className="inv-form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Good">Good</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="inv-modal-actions">
                <button
                  type="button"
                  className="inv-btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="inv-btn-submit">
                  + Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Item Modal ────────────────────────────────────────────────── */}
      {editingItem && (
        <div className="inv-modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="inv-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3 className="inv-modal-title">Edit Item: {editingItem.name}</h3>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setEditingItem(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="inv-form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Quantity</label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="inv-form-group">
                  <label>Storage Location</label>
                  <select
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                  >
                    <option value="Freezer">Freezer</option>
                    <option value="Freezer 2">Freezer 2</option>
                    <option value="Pantry">Pantry</option>
                  </select>
                </div>
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Item Image</label>
                  <select
                    value={formData.imageKey}
                    onChange={(e) => setFormData({ ...formData, imageKey: e.target.value })}
                  >
                    <option value="tomatoes">Tomatoes</option>
                    <option value="chicken">Chicken Breast</option>
                    <option value="egg">Egg</option>
                    <option value="pasta">Pasta</option>
                    <option value="oil">Cooking Oil</option>
                  </select>
                </div>

                <div className="inv-form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Good">Good</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="inv-modal-actions">
                <button
                  type="button"
                  className="inv-btn-cancel"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="inv-btn-submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Details Modal ─────────────────────────────────────────────── */}
      {viewingItem && (
        <div className="inv-modal-overlay" onClick={() => setViewingItem(null)}>
          <div className="inv-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="inv-img-thumb">
                  {FoodImages[viewingItem.imageKey] || FoodImages.tomatoes}
                </div>
                <h3 className="inv-modal-title">{viewingItem.name}</h3>
              </div>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setViewingItem(null)}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Quantity
                </span>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginTop: 2 }}>
                  {viewingItem.quantity}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Storage Location
                </span>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginTop: 2 }}>
                  {viewingItem.storage}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Last Updated
                </span>
                <div style={{ fontSize: '0.95rem', color: '#475569', marginTop: 2 }}>
                  {viewingItem.lastUpdated}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Current Status
                </span>
                <div style={{ marginTop: 4 }}>
                  <span className={`inv-status-badge ${getStatusBadgeClass(viewingItem.status)}`}>
                    {viewingItem.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="inv-modal-actions">
              <button
                type="button"
                className="inv-btn-cancel"
                onClick={() => {
                  const toEdit = viewingItem;
                  setViewingItem(null);
                  handleOpenEdit(toEdit);
                }}
              >
                ✎ Edit Item
              </button>
              <button
                type="button"
                className="inv-btn-submit"
                onClick={() => setViewingItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ──────────────────────────────────────── */}
      {deletingItem && (
        <div className="inv-modal-overlay" onClick={() => setDeletingItem(null)}>
          <div className="inv-modal-box" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3 className="inv-modal-title" style={{ color: '#ef4444' }}>
                Delete Item
              </h3>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setDeletingItem(null)}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.5, margin: '8px 0 20px' }}>
              Are you sure you want to delete <strong>"{deletingItem.name}"</strong> from inventory? This action cannot be undone.
            </p>

            <div className="inv-modal-actions">
              <button
                type="button"
                className="inv-btn-cancel"
                onClick={() => setDeletingItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inv-btn-danger"
                onClick={handleDeleteConfirm}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Stats Modal ─────────────────────────────────────────────────── */}
      {showEditStatsModal && (
        <div className="inv-modal-overlay" onClick={() => setShowEditStatsModal(false)}>
          <div className="inv-modal-box" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3 className="inv-modal-title">Edit Overview Numbers</h3>
              <button type="button" className="inv-modal-close" onClick={() => setShowEditStatsModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveStatsModal}>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Total Items</label>
                  <input type="number" min="0" value={statsModalForm.total}
                    onChange={(e) => setStatsModalForm({ ...statsModalForm, total: e.target.value })} />
                </div>
                <div className="inv-form-group">
                  <label>Low Stock Items</label>
                  <input type="number" min="0" value={statsModalForm.lowStock}
                    onChange={(e) => setStatsModalForm({ ...statsModalForm, lowStock: e.target.value })} />
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Expired Items</label>
                  <input type="number" min="0" value={statsModalForm.expired}
                    onChange={(e) => setStatsModalForm({ ...statsModalForm, expired: e.target.value })} />
                </div>
                <div className="inv-form-group">
                  <label>Out of Stock Items</label>
                  <input type="number" min="0" value={statsModalForm.outOfStock}
                    onChange={(e) => setStatsModalForm({ ...statsModalForm, outOfStock: e.target.value })} />
                </div>
              </div>
              <div className="inv-modal-actions">
                <button type="button" className="inv-btn-cancel" onClick={handleResetDefaultStats}>Reset Defaults</button>
                <button type="button" className="inv-btn-cancel" onClick={() => setShowEditStatsModal(false)}>Cancel</button>
                <button type="submit" className="inv-btn-submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
