/**
 * Insurance Policies API Module
 * Compliance tracking for insurance and bonds
 */

import client from './client.js';

const insurancePolicies = {
  /**
   * Get all insurance policies
   */
  async getAll() {
    return await client.get('/insurance-policies');
  },

  /**
   * Create new insurance policy
   */
  async create(policyData) {
    return await client.post('/insurance-policies', policyData);
  },

  /**
   * Update insurance policy by ID
   */
  async update(id, policyData) {
    return await client.put(`/insurance-policies/${id}`, policyData);
  },

  /**
   * Delete insurance policy by ID
   */
  async remove(id) {
    return await client.delete(`/insurance-policies/${id}`);
  },
};

export default insurancePolicies;
