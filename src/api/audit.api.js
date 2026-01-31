/**
 * Audit API Module
 * Audit log and security tracking operations
 */

import client from './client.js';

const audit = {
  /**
   * Get all audit logs with pagination
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await client.get(`/audit${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get audit log by ID
   */
  async getById(id) {
    return await client.get(`/audit/${id}`);
  },

  /**
   * Get audit logs by user
   */
  async getByUser(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await client.get(`/audit/user/${userId}${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get audit logs by date range
   */
  async getByDateRange(startDate, endDate) {
    return await client.get(`/audit?startDate=${startDate}&endDate=${endDate}`);
  },

  /**
   * Get audit logs by severity
   */
  async getBySeverity(severity) {
    return await client.get(`/audit?severity=${severity}`);
  },
};

export default audit;
