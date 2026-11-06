import api from './api';

/**
 * Staff Task Management API Services
 */

/**
 * Fetch tasks with optional filters:
 * @param {Object} params - { search, status, priority, assigned_to }
 */
export async function fetchTasks(params = {}) {
  const response = await api.get('/tasks/', { params });
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Fetch summary statistics for Task Dashboard KPI cards:
 * returns { total, pending, in_progress, completed }
 */
export async function fetchTaskSummary() {
  const response = await api.get('/tasks/summary/');
  return response.data;
}

/**
 * Fetch active staff members to assign tasks to.
 */
export async function fetchStaffMembers() {
  const response = await api.get('/tasks/staff-members/');
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Create a new task.
 * @param {Object} data - { name, description, assigned_to, priority, status, due_date }
 */
export async function createTask(data) {
  const response = await api.post('/tasks/', data);
  return response.data;
}

/**
 * Update an existing task.
 * @param {number|string} id - Task ID
 * @param {Object} data - fields to update
 */
export async function updateTask(id, data) {
  const response = await api.patch(`/tasks/${id}/`, data);
  return response.data;
}

/**
 * Delete a task.
 * @param {number|string} id - Task ID
 */
export async function deleteTask(id) {
  const response = await api.delete(`/tasks/${id}/`);
  return response.data;
}

/**
 * Update task status.
 * @param {number|string} id - Task ID
 * @param {string} status - PENDING, IN_PROGRESS, COMPLETED
 */
export async function updateTaskStatus(id, status) {
  const response = await api.patch(`/tasks/${id}/update-status/`, { status });
  return response.data;
}
