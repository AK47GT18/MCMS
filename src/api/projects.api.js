/**
 * Projects API Module
 * Project management operations
 */

import client from './client.js';

const projects = {
  /**
   * Get all projects with pagination
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await client.get(`/projects${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get project by ID
   */
  async getById(id) {
    return await client.get(`/projects/${id}`);
  },

  /**
   * Create new project
   */
  async create(projectData) {
    return await client.post('/projects', projectData);
  },

  /**
   * Update project by ID
   */
  async update(id, projectData) {
    return await client.put(`/projects/${id}`, projectData);
  },

  /**
   * Delete project by ID
   */
  async remove(id, reason) {
    const queryString = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return await client.delete(`/projects/${id}${queryString}`);
  },

  /**
   * Get project statistics
   */
  async getStats(id) {
    return await client.get(`/projects/${id}/stats`);
  },

  /**
   * Get project timeline
   */
  async getTimeline(id) {
    return await client.get(`/projects/${id}/timeline`);
  },

  /**
   * Get project tasks
   */
  async getTasks(id) {
    return await client.get(`/projects/${id}/tasks`);
  },
};

export default projects;
