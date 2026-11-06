import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './TaskManagement.css';
import {
  fetchTasks,
  fetchTaskSummary,
  fetchStaffMembers,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from '../services/tasks';

const DEMO_TASKS = [
  {
    id: 1,
    task_id: 'TSK-1001',
    name: 'Restock Beverage Refrigerator',
    description: 'Refill milk cartons, canned juices, and cold soda bottles before lunch rush',
    assigned_to: 1,
    assigned_to_name: 'Alex Rivera',
    assigned_to_email: 'alex@smartcanteen.com',
    priority: 'HIGH',
    status: 'PENDING',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    task_id: 'TSK-1002',
    name: 'Inspect Freezer Temperature Logs',
    description: 'Check both main kitchen walk-in freezers and record current temperatures in logbook',
    assigned_to: 2,
    assigned_to_name: 'Sam Staff',
    assigned_to_email: 'sam@smartcanteen.com',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    due_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    task_id: 'TSK-1003',
    name: 'Prep Vegetable Trays for Sandwiches',
    description: 'Wash and slice fresh tomatoes, onions, lettuce, and cucumber for the salad counter',
    assigned_to: 3,
    assigned_to_name: 'Maria Santos',
    assigned_to_email: 'maria@smartcanteen.com',
    priority: 'LOW',
    status: 'COMPLETED',
    due_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    task_id: 'TSK-1004',
    name: 'Deep Clean Deep Fryer & Replace Oil',
    description: 'Filter existing cooking oil, clean frying vats, and dispose of used grease in grease trap',
    assigned_to: 4,
    assigned_to_name: 'John Chef',
    assigned_to_email: 'john@smartcanteen.com',
    priority: 'HIGH',
    status: 'PENDING',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    task_id: 'TSK-1005',
    name: 'Restock Paper Cups, Napkins & Cutlery',
    description: 'Replenish all self-service dining hall dispensers and token receipt printers',
    assigned_to: 2,
    assigned_to_name: 'Sam Staff',
    assigned_to_email: 'sam@smartcanteen.com',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    due_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    task_id: 'TSK-1006',
    name: 'Daily Register Cash Reconciliation',
    description: 'Count cash drawers at end of shift and cross-check totals with electronic POS summary',
    assigned_to: 1,
    assigned_to_name: 'Alex Rivera',
    assigned_to_email: 'alex@smartcanteen.com',
    priority: 'LOW',
    status: 'COMPLETED',
    due_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_STAFF = [
  { id: 1, name: 'Alex Rivera', email: 'alex@smartcanteen.com', role: 'STAFF' },
  { id: 2, name: 'Sam Staff', email: 'sam@smartcanteen.com', role: 'STAFF' },
  { id: 3, name: 'Maria Santos', email: 'maria@smartcanteen.com', role: 'STAFF' },
  { id: 4, name: 'John Chef', email: 'john@smartcanteen.com', role: 'STAFF' },
];

export default function TaskManagement({ user, isAdmin, onToast }) {
  // Determine if viewing as Administrator
  const userIsAdmin = isAdmin !== undefined ? Boolean(isAdmin) : (user?.role === 'ADMIN');

  // ─── State ────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  // Selection (Admin bulk actions)
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());

  // Active Menu / Modals
  const [activeMenuTaskId, setActiveMenuTaskId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  // Form State (Admin create/edit)
  const initialForm = {
    name: '',
    description: '',
    assigned_to: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    due_date: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const filterPopoverRef = useRef(null);

  // ─── Matcher: Check if task is assigned to the current staff member ─────────
  const isTaskAssignedToUser = useCallback((task, currentUser) => {
    if (!currentUser) return false;
    // Primary check: user ID match (numeric or string)
    if (task.assigned_to !== null && task.assigned_to !== undefined && currentUser.id !== undefined) {
      if (String(task.assigned_to) === String(currentUser.id)) return true;
    }
    // Fallback check: email match
    if (task.assigned_to_email && currentUser.email) {
      if (task.assigned_to_email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) return true;
    }
    // Fallback check: username match
    if (task.assigned_to_username && currentUser.username) {
      if (task.assigned_to_username.trim().toLowerCase() === currentUser.username.trim().toLowerCase()) return true;
    }
    // Fallback check: full name match
    const fullName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
    if (fullName && task.assigned_to_name && fullName.toLowerCase() === task.assigned_to_name.trim().toLowerCase()) {
      return true;
    }
    return false;
  }, []);

  // ─── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target)) {
        setShowFilterPopover(false);
      }
      if (!e.target.closest('.task-action-cell-container')) {
        setActiveMenuTaskId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Shared LocalStorage Helper for Sync ─────────────────────────────────
  const syncSharedTasks = (taskList) => {
    try {
      localStorage.setItem('smart_canteen_shared_tasks', JSON.stringify(taskList));
    } catch {}
    window.dispatchEvent(new CustomEvent('canteen:tasks-updated'));
  };

  // ─── Load Data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, staffData] = await Promise.all([
        fetchTasks().catch(() => null),
        userIsAdmin ? fetchStaffMembers().catch(() => []) : Promise.resolve([]),
      ]);

      let allTasks = [];
      if (tasksData && tasksData.length > 0) {
        allTasks = tasksData;
        try {
          localStorage.setItem('smart_canteen_shared_tasks', JSON.stringify(tasksData));
        } catch {}
      } else {
        // Fallback to shared localStorage or DEMO_TASKS
        try {
          const stored = localStorage.getItem('smart_canteen_shared_tasks');
          allTasks = stored ? JSON.parse(stored) : DEMO_TASKS;
        } catch {
          allTasks = DEMO_TASKS;
        }
      }

      setTasks(allTasks);

      if (userIsAdmin) {
        setStaffMembers(staffData && staffData.length > 0 ? staffData : DEFAULT_STAFF);
      }
      setError('');
    } catch (err) {
      console.error('Error loading task management data:', err);
      let fallback = DEMO_TASKS;
      try {
        const stored = localStorage.getItem('smart_canteen_shared_tasks');
        if (stored) fallback = JSON.parse(stored);
      } catch {}
      setTasks(fallback);
      if (userIsAdmin) setStaffMembers(DEFAULT_STAFF);
      setError('');
    } finally {
      setLoading(false);
    }
  }, [userIsAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Listen for cross-tab or cross-component updates ───────────────────────
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem('smart_canteen_shared_tasks');
        if (stored) {
          setTasks(JSON.parse(stored));
        }
      } catch {}
    };
    window.addEventListener('canteen:tasks-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('canteen:tasks-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // ─── Scoped Tasks by Role ─────────────────────────────────────────────────
  // Admin sees all tasks; Staff sees only tasks assigned to their user ID
  const scopedTasks = useMemo(() => {
    if (userIsAdmin) {
      return tasks;
    }
    return tasks.filter((t) => isTaskAssignedToUser(t, user));
  }, [tasks, userIsAdmin, user, isTaskAssignedToUser]);

  // ─── Computed Summary Cards ───────────────────────────────────────────────
  // Admin summary is based on all tasks; Staff summary is based only on their tasks
  const currentSummary = useMemo(() => {
    const total = scopedTasks.length;
    const pending = scopedTasks.filter((t) => t.status === 'PENDING').length;
    const in_progress = scopedTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const completed = scopedTasks.filter((t) => t.status === 'COMPLETED').length;
    return { total, pending, in_progress, completed };
  }, [scopedTasks]);

  // ─── Filtered Tasks (Search + Active Filters) ──────────────────────────────
  const filteredTasks = useMemo(() => {
    return scopedTasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (task.name || '').toLowerCase().includes(q);
        const matchId = (task.task_id || '').toLowerCase().includes(q);
        const matchDesc = (task.description || '').toLowerCase().includes(q);
        const matchStaff = (task.assigned_to_name || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDesc && !matchStaff) return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && task.status !== statusFilter) {
        return false;
      }
      // Priority filter
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
        return false;
      }
      // Staff filter (Admin only)
      if (userIsAdmin && staffFilter !== 'ALL') {
        if (staffFilter === 'unassigned') {
          if (task.assigned_to) return false;
        } else if (String(task.assigned_to) !== String(staffFilter)) {
          return false;
        }
      }
      return true;
    });
  }, [scopedTasks, searchQuery, statusFilter, priorityFilter, staffFilter, userIsAdmin]);

  // ─── Admin Form Management ────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    if (!userIsAdmin) return;
    setFormData({
      name: '',
      description: '',
      assigned_to: staffMembers[0]?.id ? String(staffMembers[0].id) : '',
      priority: 'MEDIUM',
      status: 'PENDING',
      due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleOpenEditModal = (task) => {
    if (!userIsAdmin) return;
    setActiveMenuTaskId(null);
    setEditingTask(task);
    setFormData({
      name: task.name || '',
      description: task.description || '',
      assigned_to: task.assigned_to ? String(task.assigned_to) : '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'PENDING',
      due_date: task.due_date || '',
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Task Name is required';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!userIsAdmin || !validateForm()) return;

    setFormSubmitting(true);
    try {
      const payload = {
        ...formData,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to, 10) : null,
      };
      let created;
      try {
        created = await createTask(payload);
      } catch {
        const assignedStaffObj = staffMembers.find((s) => String(s.id) === String(payload.assigned_to));
        created = {
          id: Date.now(),
          task_id: `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
          ...payload,
          assigned_to_name: assignedStaffObj?.name || (payload.assigned_to ? 'Staff Member' : 'Unassigned'),
          assigned_to_email: assignedStaffObj?.email || '',
          created_at: new Date().toISOString(),
        };
      }

      setTasks((prev) => {
        const updated = [created, ...prev];
        syncSharedTasks(updated);
        return updated;
      });

      setShowAddModal(false);
      if (onToast) onToast(`✅ Task "${created.name}" created and assigned successfully!`);
    } catch (err) {
      console.error(err);
      if (onToast) onToast('❌ Failed to create task. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!userIsAdmin || !validateForm() || !editingTask) return;

    setFormSubmitting(true);
    try {
      const payload = {
        ...formData,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to, 10) : null,
      };
      let updated;
      try {
        updated = await updateTask(editingTask.id, payload);
      } catch {
        const assignedStaffObj = staffMembers.find((s) => String(s.id) === String(payload.assigned_to));
        updated = {
          ...editingTask,
          ...payload,
          assigned_to_name: assignedStaffObj?.name || (payload.assigned_to ? editingTask.assigned_to_name : 'Unassigned'),
          assigned_to_email: assignedStaffObj?.email || editingTask.assigned_to_email,
        };
      }

      setTasks((prev) => {
        const updatedList = prev.map((t) => (t.id === editingTask.id ? updated : t));
        syncSharedTasks(updatedList);
        return updatedList;
      });

      if (viewingTask?.id === editingTask.id) {
        setViewingTask(updated);
      }
      setEditingTask(null);
      if (onToast) onToast(`✅ Task "${updated.name}" updated successfully!`);
    } catch (err) {
      console.error(err);
      if (onToast) onToast('❌ Failed to update task. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // ─── Status Updates (Admin & Staff) ───────────────────────────────────────
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      try {
        await updateTaskStatus(taskId, newStatus);
      } catch {
        // Fallback to local state update
      }

      setTasks((prev) => {
        const updatedList = prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
        syncSharedTasks(updatedList);
        return updatedList;
      });

      if (viewingTask?.id === taskId) {
        setViewingTask((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      if (onToast) onToast(`Status updated to ${formatStatusLabel(newStatus)}`);
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Failed to update task status.');
    }
  };

  // ─── Deletion (Admin only) ────────────────────────────────────────────────
  const confirmDeleteTask = async () => {
    if (!userIsAdmin || !deletingTask) return;
    try {
      try {
        await deleteTask(deletingTask.id);
      } catch {
        // Fallback to local state delete
      }

      setTasks((prev) => {
        const updatedList = prev.filter((t) => t.id !== deletingTask.id);
        syncSharedTasks(updatedList);
        return updatedList;
      });

      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingTask.id);
        return next;
      });

      if (viewingTask?.id === deletingTask.id) {
        setViewingTask(null);
      }
      if (onToast) onToast(`🗑️ Task "${deletingTask.name}" deleted.`);
      setDeletingTask(null);
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Failed to delete task.');
    }
  };

  // ─── Checkbox Selection (Admin only) ──────────────────────────────────────
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(filteredTasks.map((t) => t.id));
      setSelectedTaskIds(allIds);
    } else {
      setSelectedTaskIds(new Set());
    }
  };

  const handleSelectTask = (id) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkComplete = async () => {
    const ids = Array.from(selectedTaskIds);
    try {
      await Promise.all(ids.map((id) => updateTaskStatus(id, 'COMPLETED').catch(() => null)));
      setTasks((prev) => {
        const updatedList = prev.map((t) => (selectedTaskIds.has(t.id) ? { ...t, status: 'COMPLETED' } : t));
        syncSharedTasks(updatedList);
        return updatedList;
      });
      setSelectedTaskIds(new Set());
      if (onToast) onToast(`Marked ${ids.length} tasks as Completed.`);
    } catch {
      if (onToast) onToast('Failed to complete some tasks.');
    }
  };

  const handleBulkDelete = async () => {
    if (!userIsAdmin) return;
    const ids = Array.from(selectedTaskIds);
    if (!window.confirm(`Are you sure you want to delete ${ids.length} selected tasks?`)) return;
    try {
      await Promise.all(ids.map((id) => deleteTask(id).catch(() => null)));
      setTasks((prev) => {
        const updatedList = prev.filter((t) => !selectedTaskIds.has(t.id));
        syncSharedTasks(updatedList);
        return updatedList;
      });
      setSelectedTaskIds(new Set());
      if (onToast) onToast(`Deleted ${ids.length} tasks.`);
    } catch {
      if (onToast) onToast('Failed to delete some tasks.');
    }
  };

  // ─── Helper Formats ───────────────────────────────────────────────────────
  const formatStatusLabel = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatPriorityLabel = (priority) => {
    switch (priority) {
      case 'LOW':
        return 'Low';
      case 'MEDIUM':
        return 'Medium';
      case 'HIGH':
        return 'High';
      default:
        return priority;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getHeaderDate = () => {
    const today = new Date();
    const day = today.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? 'st'
        : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
        ? 'rd'
        : 'th';
    const month = today.toLocaleDateString('en-US', { month: 'long' });
    const year = today.getFullYear();
    return `Today, ${month} ${day}${suffix} ${year}`;
  };

  const currentDisplayName = user
    ? user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name || user.username || user.email || (userIsAdmin ? 'Admin' : 'Staff')
    : userIsAdmin ? 'Administrator' : 'Staff';

  const isAllSelected =
    filteredTasks.length > 0 && filteredTasks.every((t) => selectedTaskIds.has(t.id));

  const hasActiveFilters =
    statusFilter !== 'ALL' || priorityFilter !== 'ALL' || (userIsAdmin && staffFilter !== 'ALL');

  return (
    <div className="task-mgmt-container">
      {/* ─── Top Header Section ────────────────────────────────────────────── */}
      <div className="task-mgmt-header">
        <div className="task-mgmt-title-block">
          <h1>{userIsAdmin ? 'Task Management' : 'My Tasks'}</h1>
          <p className="task-mgmt-subtitle">
            {userIsAdmin
              ? getHeaderDate()
              : `Assigned tasks for ${currentDisplayName} • ${getHeaderDate()}`}
          </p>
        </div>

        <div className="task-mgmt-header-controls">
          <div className="task-header-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder={userIsAdmin ? 'Search all tasks...' : 'Search my tasks...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="task-user-chip">
            <div className="task-user-chip-avatar">
              {currentDisplayName.charAt(0).toUpperCase()}
            </div>
            <span className="task-user-chip-name">{currentDisplayName}</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {userIsAdmin ? '🛡️' : '👨‍🍳'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Dashboard Summary Cards (Top Row) ──────────────────────────────── */}
      <div className="task-stats-grid">
        {/* Card 1: Total Tasks */}
        <div className="task-stat-card">
          <div>
            <div className="task-stat-top">
              <div className="task-stat-icon-wrapper task-stat-icon-total">
                <span>📋</span>
              </div>
              <div className="task-stat-title">Total Tasks</div>
            </div>
            <div className="task-stat-subtitle">
              {userIsAdmin ? 'Total tasks created in system' : 'Total tasks assigned to you'}
            </div>
          </div>
          <div className="task-stat-value">{currentSummary.total}</div>
        </div>

        {/* Card 2: Pending Tasks */}
        <div className="task-stat-card">
          <div>
            <div className="task-stat-top">
              <div className="task-stat-icon-wrapper task-stat-icon-pending">
                <span>⏳</span>
              </div>
              <div className="task-stat-title">Pending Tasks</div>
            </div>
            <div className="task-stat-subtitle">
              {userIsAdmin ? 'Number of tasks awaiting progress' : 'Tasks waiting to be started'}
            </div>
          </div>
          <div className="task-stat-value">{currentSummary.pending}</div>
        </div>

        {/* Card 3: In Progress Tasks */}
        <div className="task-stat-card">
          <div>
            <div className="task-stat-top">
              <div className="task-stat-icon-wrapper task-stat-icon-progress">
                <span>⚡</span>
              </div>
              <div className="task-stat-title">In Progress Tasks</div>
            </div>
            <div className="task-stat-subtitle">
              {userIsAdmin ? 'Tasks currently being worked on' : 'Tasks currently in progress'}
            </div>
          </div>
          <div className="task-stat-value">{currentSummary.in_progress}</div>
        </div>

        {/* Card 4: Completed Tasks */}
        <div className="task-stat-card">
          <div>
            <div className="task-stat-top">
              <div className="task-stat-icon-wrapper task-stat-icon-completed">
                <span>✅</span>
              </div>
              <div className="task-stat-title">Completed Tasks</div>
            </div>
            <div className="task-stat-subtitle">
              {userIsAdmin ? 'Tasks marked as finished' : 'Tasks marked as completed'}
            </div>
          </div>
          <div className="task-stat-value">{currentSummary.completed}</div>
        </div>
      </div>

      {/* ─── Task Overview Table Card (Bottom Section) ─────────────────────── */}
      <div className="task-overview-card">
        {/* Header with Search, Filter button, and Add Task button */}
        <div className="task-overview-header">
          <h2 className="task-overview-heading">
            {userIsAdmin ? 'Task Overview' : 'My Tasks Overview'}
          </h2>

          <div className="task-overview-actions">
            {/* Search Bar */}
            <div className="task-table-search">
              <span>🔍</span>
              <input
                type="text"
                placeholder={userIsAdmin ? 'Search Item...' : 'Search my items...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Dropdown */}
            <div className="task-filter-wrapper" ref={filterPopoverRef}>
              <button
                type="button"
                className={`task-filter-btn ${hasActiveFilters ? 'active' : ''}`}
                onClick={() => setShowFilterPopover((prev) => !prev)}
              >
                <span>▽ Filter</span>
                <span>▾</span>
              </button>

              {showFilterPopover && (
                <div className="task-filter-popover">
                  <div className="task-filter-popover-header">
                    <span className="task-filter-popover-title">Filter Tasks</span>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="task-filter-reset-btn"
                        onClick={() => {
                          setStatusFilter('ALL');
                          setPriorityFilter('ALL');
                          if (userIsAdmin) setStaffFilter('ALL');
                        }}
                      >
                        Reset All
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="task-filter-group">
                    <label>Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div className="task-filter-group" style={{ marginBottom: userIsAdmin ? 12 : 0 }}>
                    <label>Priority</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  {/* Staff Member Filter (Admin only) */}
                  {userIsAdmin && (
                    <div className="task-filter-group" style={{ marginBottom: 0 }}>
                      <label>Assigned Staff</label>
                      <select
                        value={staffFilter}
                        onChange={(e) => setStaffFilter(e.target.value)}
                      >
                        <option value="ALL">All Staff Members</option>
                        <option value="unassigned">Unassigned</option>
                        {staffMembers.map((sm) => (
                          <option key={sm.id} value={sm.id}>
                            {sm.name} ({sm.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Add Task Button (Admin Only - Teal Pill Button matching screenshot) */}
            {userIsAdmin && (
              <button
                type="button"
                className="task-add-btn"
                onClick={handleOpenAddModal}
              >
                <span>+ Add Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Bulk Selection Bar (Admin only) */}
        {userIsAdmin && selectedTaskIds.size > 0 && (
          <div className="task-bulk-bar">
            <span className="task-bulk-info">
              {selectedTaskIds.size} task{selectedTaskIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="task-bulk-actions">
              <button
                type="button"
                className="task-bulk-btn task-bulk-btn-complete"
                onClick={handleBulkComplete}
              >
                ✓ Mark Completed
              </button>
              <button
                type="button"
                className="task-bulk-btn task-bulk-btn-delete"
                onClick={handleBulkDelete}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="task-loading-state">
            <div className="task-spinner" />
            <span>Loading tasks...</span>
          </div>
        )}

        {/* Error Box */}
        {!loading && error && (
          <div className="task-empty-state">
            <div className="task-empty-icon">⚠</div>
            <div className="task-empty-title">Could not load tasks</div>
            <p>{error}</p>
            <button
              type="button"
              className="task-btn-primary"
              style={{ marginTop: 12 }}
              onClick={loadData}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredTasks.length === 0 && (
          <div className="task-empty-state">
            <div className="task-empty-icon">📝</div>
            <div className="task-empty-title">
              {userIsAdmin ? 'No tasks found' : 'No tasks assigned to you'}
            </div>
            <p>
              {hasActiveFilters || searchQuery
                ? 'Try adjusting your search query or filters.'
                : userIsAdmin
                ? 'Click "+ Add Task" above to create your first canteen task.'
                : 'You have no pending or assigned tasks right now.'}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && filteredTasks.length > 0 && (
          <div className="task-table-wrapper">
            <table className="task-table">
              <thead>
                <tr>
                  {userIsAdmin && (
                    <th style={{ width: 44 }}>
                      <input
                        type="checkbox"
                        className="task-checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th>Task ID</th>
                  <th>Task Name</th>
                  <th>Description</th>
                  {userIsAdmin && <th>Assigned Staff</th>}
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const isSelected = selectedTaskIds.has(task.id);
                  const isMenuOpen = activeMenuTaskId === task.id;
                  const isOverdue =
                    task.due_date &&
                    task.status !== 'COMPLETED' &&
                    new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

                  return (
                    <tr
                      key={task.id}
                      className={isSelected ? 'row-selected' : ''}
                    >
                      {/* Checkbox (Admin Only) */}
                      {userIsAdmin && (
                        <td>
                          <input
                            type="checkbox"
                            className="task-checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectTask(task.id)}
                          />
                        </td>
                      )}

                      {/* Task ID */}
                      <td>
                        <span className="task-id-badge">
                          {task.task_id || `TSK-${task.id}`}
                        </span>
                      </td>

                      {/* Task Name */}
                      <td
                        className="task-name-cell"
                        onClick={() => setViewingTask(task)}
                        title="Click to view details"
                      >
                        {task.name}
                      </td>

                      {/* Description */}
                      <td>
                        <div className="task-desc-cell" title={task.description}>
                          {task.description || '—'}
                        </div>
                      </td>

                      {/* Assigned Staff (Admin Only) */}
                      {userIsAdmin && (
                        <td>
                          <div className="task-staff-cell">
                            <div className="task-staff-avatar-sm">
                              {(task.assigned_to_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="task-staff-name">
                              {task.assigned_to_name || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Priority Badge */}
                      <td>
                        <span
                          className={`task-badge badge-priority-${(
                            task.priority || 'medium'
                          ).toLowerCase()}`}
                        >
                          {formatPriorityLabel(task.priority)}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td>
                        <span
                          className={`task-date-cell ${isOverdue ? 'overdue' : ''}`}
                          title={isOverdue ? 'Overdue!' : ''}
                        >
                          {formatDate(task.due_date)}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td>
                        {!userIsAdmin ? (
                          <select
                            className={`task-status-select-inline badge-status-${(
                              task.status || 'pending'
                            ).toLowerCase()}`}
                            value={task.status || 'PENDING'}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            title="Update status"
                          >
                            <option value="PENDING">⏳ Pending</option>
                            <option value="IN_PROGRESS">⚡ In Progress</option>
                            <option value="COMPLETED">✅ Completed</option>
                          </select>
                        ) : (
                          <span
                            className={`task-badge badge-status-${(
                              task.status || 'pending'
                            ).toLowerCase()}`}
                          >
                            {formatStatusLabel(task.status)}
                          </span>
                        )}
                      </td>

                      {/* Action Cell */}
                      <td>
                        {userIsAdmin ? (
                          /* Admin Actions: Edit & Delete Dropdown */
                          <div className="task-actions-cell task-action-cell-container">
                            <button
                              type="button"
                              className="task-action-icon-btn"
                              title="Edit Task"
                              onClick={() => handleOpenEditModal(task)}
                            >
                              ✎
                            </button>

                            <button
                              type="button"
                              className="task-action-icon-btn"
                              title="More Actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuTaskId((prev) =>
                                  prev === task.id ? null : task.id
                                );
                              }}
                            >
                              •••
                            </button>

                            {isMenuOpen && (
                              <div className="task-action-menu-dropdown">
                                <button
                                  type="button"
                                  className="task-menu-item"
                                  onClick={() => {
                                    setActiveMenuTaskId(null);
                                    setViewingTask(task);
                                  }}
                                >
                                  <span>📄</span>
                                  <span>View Details</span>
                                </button>

                                <button
                                  type="button"
                                  className="task-menu-item delete"
                                  onClick={() => {
                                    setActiveMenuTaskId(null);
                                    setDeletingTask(task);
                                  }}
                                >
                                  <span>🗑</span>
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Staff Actions: Status Advance & View Details (No Admin actions) */
                          <div className="task-staff-actions-cell">
                            {task.status === 'PENDING' && (
                              <button
                                type="button"
                                className="task-quick-status-btn in-progress"
                                onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                                title="Start Task"
                              >
                                ⚡ Start
                              </button>
                            )}
                            {task.status === 'IN_PROGRESS' && (
                              <button
                                type="button"
                                className="task-quick-status-btn completed"
                                onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                                title="Mark Completed"
                              >
                                ✅ Done
                              </button>
                            )}
                            {task.status === 'COMPLETED' && (
                              <span className="task-status-done-tag" title="Task Completed">
                                ✓ Done
                              </span>
                            )}
                            <button
                              type="button"
                              className="task-action-icon-btn"
                              title="View Task Details"
                              onClick={() => setViewingTask(task)}
                            >
                              📄
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Add Task Modal (Admin Only) ─────────────────────────────────────── */}
      {userIsAdmin && showAddModal && (
        <div className="task-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="task-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="task-modal-header">
              <h3 className="task-modal-title">Add New Task</h3>
              <button
                type="button"
                className="task-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitAdd}>
              <div className="task-form-group">
                <label className="task-form-label">Task Name *</label>
                <input
                  type="text"
                  className="task-form-input"
                  placeholder="e.g. Clean kitchen counter & restock cups"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {formErrors.name && (
                  <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                    {formErrors.name}
                  </span>
                )}
              </div>

              <div className="task-form-group">
                <label className="task-form-label">Description</label>
                <textarea
                  className="task-form-textarea"
                  rows={3}
                  placeholder="Provide instructions or details for staff..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="task-form-row">
                <div className="task-form-group">
                  <label className="task-form-label">Assigned Staff</label>
                  <select
                    className="task-form-select"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {staffMembers.map((sm) => (
                      <option key={sm.id} value={sm.id}>
                        {sm.name} ({sm.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="task-form-group">
                  <label className="task-form-label">Priority</label>
                  <select
                    className="task-form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="task-form-row">
                <div className="task-form-group">
                  <label className="task-form-label">Due Date</label>
                  <input
                    type="date"
                    className="task-form-input"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                <div className="task-form-group">
                  <label className="task-form-label">Initial Status</label>
                  <select
                    className="task-form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="task-modal-actions">
                <button
                  type="button"
                  className="task-btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="task-btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Creating...' : '+ Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Task Modal (Admin Only) ───────────────────────────────────── */}
      {userIsAdmin && editingTask && (
        <div className="task-modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="task-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="task-modal-header">
              <h3 className="task-modal-title">
                Edit Task: {editingTask.task_id || `TSK-${editingTask.id}`}
              </h3>
              <button
                type="button"
                className="task-modal-close"
                onClick={() => setEditingTask(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitEdit}>
              <div className="task-form-group">
                <label className="task-form-label">Task Name *</label>
                <input
                  type="text"
                  className="task-form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {formErrors.name && (
                  <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                    {formErrors.name}
                  </span>
                )}
              </div>

              <div className="task-form-group">
                <label className="task-form-label">Description</label>
                <textarea
                  className="task-form-textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="task-form-row">
                <div className="task-form-group">
                  <label className="task-form-label">Assigned Staff</label>
                  <select
                    className="task-form-select"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {staffMembers.map((sm) => (
                      <option key={sm.id} value={sm.id}>
                        {sm.name} ({sm.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="task-form-group">
                  <label className="task-form-label">Priority</label>
                  <select
                    className="task-form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="task-form-row">
                <div className="task-form-group">
                  <label className="task-form-label">Due Date</label>
                  <input
                    type="date"
                    className="task-form-input"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                <div className="task-form-group">
                  <label className="task-form-label">Status</label>
                  <select
                    className="task-form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="task-modal-actions">
                <button
                  type="button"
                  className="task-btn-secondary"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="task-btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Task Details Modal (Admin & Staff) ────────────────────────── */}
      {viewingTask && (
        <div className="task-modal-overlay" onClick={() => setViewingTask(null)}>
          <div className="task-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="task-modal-header">
              <div>
                <span className="task-id-badge" style={{ fontSize: '0.85rem' }}>
                  {viewingTask.task_id || `TSK-${viewingTask.id}`}
                </span>
                <h3 className="task-modal-title" style={{ marginTop: 6 }}>
                  {viewingTask.name}
                </h3>
              </div>
              <button
                type="button"
                className="task-modal-close"
                onClick={() => setViewingTask(null)}
              >
                ×
              </button>
            </div>

            <div className="task-details-grid">
              <div className="task-details-item">
                <span className="task-details-item-label">Description</span>
                <p className="task-details-item-value" style={{ fontWeight: 400, lineHeight: 1.5 }}>
                  {viewingTask.description || 'No description provided.'}
                </p>
              </div>

              <div className="task-form-row">
                <div className="task-details-item">
                  <span className="task-details-item-label">Assigned Staff</span>
                  <div className="task-staff-cell" style={{ marginTop: 4 }}>
                    <div className="task-staff-avatar-sm">
                      {(viewingTask.assigned_to_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="task-details-item-value">
                      {viewingTask.assigned_to_name || 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="task-details-item">
                  <span className="task-details-item-label">Priority</span>
                  <div style={{ marginTop: 4 }}>
                    <span
                      className={`task-badge badge-priority-${(
                        viewingTask.priority || 'medium'
                      ).toLowerCase()}`}
                    >
                      {formatPriorityLabel(viewingTask.priority)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="task-form-row">
                <div className="task-details-item">
                  <span className="task-details-item-label">Due Date</span>
                  <span className="task-details-item-value" style={{ marginTop: 4 }}>
                    {formatDate(viewingTask.due_date)}
                  </span>
                </div>

                <div className="task-details-item">
                  <span className="task-details-item-label">Current Status</span>
                  <div style={{ marginTop: 4 }}>
                    <span
                      className={`task-badge badge-status-${(
                        viewingTask.status || 'pending'
                      ).toLowerCase()}`}
                    >
                      {formatStatusLabel(viewingTask.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Status Updater (Available to both Admin and Staff) */}
              <div className="task-status-actions-box">
                <div className="task-status-actions-title">Update Status:</div>
                <div className="task-status-btn-group">
                  <button
                    type="button"
                    className={`task-status-quick-btn ${viewingTask.status === 'PENDING' ? 'active' : ''}`}
                    onClick={() => handleStatusChange(viewingTask.id, 'PENDING')}
                  >
                    ⏳ Pending
                  </button>
                  <button
                    type="button"
                    className={`task-status-quick-btn ${viewingTask.status === 'IN_PROGRESS' ? 'active' : ''}`}
                    onClick={() => handleStatusChange(viewingTask.id, 'IN_PROGRESS')}
                  >
                    ⚡ In Progress
                  </button>
                  <button
                    type="button"
                    className={`task-status-quick-btn ${viewingTask.status === 'COMPLETED' ? 'active' : ''}`}
                    onClick={() => handleStatusChange(viewingTask.id, 'COMPLETED')}
                  >
                    ✅ Completed
                  </button>
                </div>
              </div>
            </div>

            <div className="task-modal-actions">
              {/* Only Admin can see Edit button inside View Details */}
              {userIsAdmin && (
                <button
                  type="button"
                  className="task-btn-secondary"
                  onClick={() => {
                    const toEdit = viewingTask;
                    setViewingTask(null);
                    handleOpenEditModal(toEdit);
                  }}
                >
                  ✎ Edit Task
                </button>
              )}
              <button
                type="button"
                className="task-btn-primary"
                onClick={() => setViewingTask(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal (Admin Only) ─────────────────────────── */}
      {userIsAdmin && deletingTask && (
        <div className="task-modal-overlay" onClick={() => setDeletingTask(null)}>
          <div className="task-modal-box" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="task-modal-header">
              <h3 className="task-modal-title" style={{ color: '#ef4444' }}>
                Delete Task
              </h3>
              <button
                type="button"
                className="task-modal-close"
                onClick={() => setDeletingTask(null)}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.5, margin: '8px 0 20px' }}>
              Are you sure you want to permanently delete task{' '}
              <strong>"{deletingTask.name}"</strong> (
              {deletingTask.task_id || `TSK-${deletingTask.id}`})? This action cannot be undone.
            </p>

            <div className="task-modal-actions">
              <button
                type="button"
                className="task-btn-secondary"
                onClick={() => setDeletingTask(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="task-btn-danger"
                onClick={confirmDeleteTask}
              >
                🗑 Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
