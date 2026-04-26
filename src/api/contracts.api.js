/**
 * Contracts API Module
 * Contract management operations
 */

import client from './client.js';

const contracts = {
  /**
   * Get all contracts with pagination
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await client.get(`/contracts${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get contract by ID
   */
  async getById(id) {
    return await client.get(`/contracts/${id}`);
  },

  /**
   * Create new contract
   */
  async create(contractData) {
    return await client.post('/contracts', contractData);
  },

  /**
   * Update contract by ID
   */
  async update(id, contractData) {
    return await client.put(`/contracts/${id}`, contractData);
  },

  /**
   * Delete contract by ID
   */
  async remove(id) {
    return await client.delete(`/contracts/${id}`);
  },

  /**
   * Get all versions for a contract
   */
  async getVersions(contractId) {
    return await client.get(`/contracts/${contractId}/versions`);
  },
};

export default contracts;
