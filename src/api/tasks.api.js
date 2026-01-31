/**
 * Tasks API Module
 * Task management operations
 */

import client from './client.js';

const tasks = {
  /**
   * Get all tasks with pagination
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await client.get(`/tasks${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get task by ID
   */
  async getById(id) {
    return await client.get(`/tasks/${id}`);
  },

  /**
   * Create new task
   */
  async create(taskData) {
    return await client.post('/tasks', taskData);
  },

  /**
   * Update task by ID
   */
  async update(id, taskData) {
    return await client.put(`/tasks/${id}`, taskData);
  },

  /**
   * Delete task by ID
   */
  async remove(id) {
    return await client.delete(`/tasks/${id}`);
  },

  /**
   * Mark task as complete
   */
  async complete(id) {
    return await client.post(`/tasks/${id}/complete`);
  },

  /**
   * Get tasks by project
   */
  async getByProject(projectId) {
    return await client.get(`/tasks?projectId=${projectId}`);
  },

  /**
   * Get tasks by status
   */
  async getByStatus(status) {
    return await client.get(`/tasks?status=${status}`);
  },
};

export default tasks;
