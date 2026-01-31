/**
 * Procurement API Module
 * Procurement management operations
 */

import client from './client.js';

const procurement = {
  /**
   * Get all procurement records with pagination
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await client.get(`/procurement${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get procurement record by ID
   */
  async getById(id) {
    return await client.get(`/procurement/${id}`);
  },

  /**
   * Create new procurement record
   */
  async create(procurementData) {
    return await client.post('/procurement', procurementData);
  },

  /**
   * Update procurement record by ID
   */
  async update(id, procurementData) {
    return await client.put(`/procurement/${id}`, procurementData);
  },
};

export default procurement;
