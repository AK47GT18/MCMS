/**
 * Requisitions API Module
 * Requisition management operations
 */

import client from './client.js';

const requisitions = {
  /**
   * Get all requisitions with pagination
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await client.get(`/requisitions${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get requisition by ID
   */
  async getById(id) {
    return await client.get(`/requisitions/${id}`);
  },

  /**
   * Create new requisition
   */
  async create(requisitionData) {
    return await client.post('/requisitions', requisitionData);
  },

  /**
   * Update requisition by ID
   */
  async update(id, requisitionData) {
    return await client.put(`/requisitions/${id}`, requisitionData);
  },

  /**
   * Approve requisition
   */
  async approve(id) {
    return await client.post(`/requisitions/${id}/approve`);
  },

  /**
   * Reject requisition
   */
  async reject(id, reason) {
    return await client.post(`/requisitions/${id}/reject`, { reason });
  },

  /**
   * Get pending requisitions
   */
  async getPending() {
    return await client.get('/requisitions/pending');
  },
};

export default requisitions;
