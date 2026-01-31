/**
 * Vendors API Module
 * Vendor management operations
 */

import client from './client.js';

const vendors = {
  /**
   * Get all vendors with pagination
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await client.get(`/vendors${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get vendor by ID
   */
  async getById(id) {
    return await client.get(`/vendors/${id}`);
  },

  /**
   * Create new vendor
   */
  async create(vendorData) {
    return await client.post('/vendors', vendorData);
  },

  /**
   * Update vendor by ID
   */
  async update(id, vendorData) {
    return await client.put(`/vendors/${id}`, vendorData);
  },

  /**
   * Delete vendor by ID
   */
  async remove(id) {
    return await client.delete(`/vendors/${id}`);
  },
};

export default vendors;
