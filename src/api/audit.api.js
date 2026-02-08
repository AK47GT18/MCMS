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
    return await client.get(`/audit-logs${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get audit log by ID
   */
  async getById(id) {
    return await client.get(`/audit-logs/${id}`);
  },

  /**
   * Get audit logs by user
   */
  async getByUser(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await client.get(`/audit-logs/user/${userId}${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get audit logs by date range
   */
  async getByDateRange(startDate, endDate) {
    return await client.get(`/audit-logs?startDate=${startDate}&endDate=${endDate}`);
  },

  /**
   * Get audit logs by severity
   */
  async getBySeverity(severity) {
    return await client.get(`/audit-logs?severity=${severity}`);
  },
};

export default audit;
