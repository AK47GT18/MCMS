/**
 * Issues API Module
 * Issue tracking and management operations
 */

import client from './client.js';

const issues = {
  /**
   * Get all issues with pagination
   */
  async getAll(params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await client.get(`/issues${queryString ? '?' + queryString : ''}`, options);
  },

  /**
   * Get issue by ID
   */
  async getById(id, options = {}) {
    return await client.get(`/issues/${id}`, options);
  },

  /**
   * Create new issue
   */
  async create(issueData) {
    return await client.post('/issues', issueData);
  },

  /**
   * Update issue by ID
   */
  async update(id, issueData) {
    return await client.put(`/issues/${id}`, issueData);
  },

  /**
   * Resolve issue
   */
  async resolve(id) {
    return await client.post(`/issues/${id}/resolve`);
  },

  /**
   * Escalate issue
   */
  async escalate(id) {
    return await client.post(`/issues/${id}/escalate`);
  },

  /**
   * Get open issues
   */
  async getOpen(options = {}) {
    return await client.get('/issues?status=open', options);
  },
};

export default issues;
