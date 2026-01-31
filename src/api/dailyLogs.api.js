/**
 * Daily Logs API Module
 * Field supervisor daily log operations
 */

import client from './client.js';

const dailyLogs = {
  /**
   * Get all daily logs with pagination
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await client.get(`/daily-logs${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get daily log by ID
   */
  async getById(id) {
    return await client.get(`/daily-logs/${id}`);
  },

  /**
   * Create new daily log
   */
  async create(logData) {
    return await client.post('/daily-logs', logData);
  },

  /**
   * Update daily log by ID
   */
  async update(id, logData) {
    return await client.put(`/daily-logs/${id}`, logData);
  },

  /**
   * Get logs by project
   */
  async getByProject(projectId) {
    return await client.get(`/daily-logs?projectId=${projectId}`);
  },

  /**
   * Get logs by date range
   */
  async getByDateRange(startDate, endDate) {
    return await client.get(`/daily-logs?startDate=${startDate}&endDate=${endDate}`);
  },
};

export default dailyLogs;
