/**
 * Assets API Module
 * Equipment/asset management operations
 */

import client from './client.js';

const assets = {
  /**
   * Get all assets with pagination
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await client.get(`/assets${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get asset by ID
   */
  async getById(id) {
    return await client.get(`/assets/${id}`);
  },

  /**
   * Create new asset
   */
  async create(assetData) {
    return await client.post('/assets', assetData);
  },

  /**
   * Update asset by ID
   */
  async update(id, assetData) {
    return await client.put(`/assets/${id}`, assetData);
  },

  /**
   * Delete asset by ID
   */
  async remove(id) {
    return await client.delete(`/assets/${id}`);
  },

  /**
   * Assign asset to project
   */
  async assignToProject(id, projectId) {
    return await client.post(`/assets/${id}/assign`, { projectId });
  },

  /**
   * Get asset maintenance history
   */
  async getMaintenanceHistory(id) {
    return await client.get(`/assets/${id}/maintenance`);
  },

  /**
   * Get available assets
   */
  async getAvailable() {
    return await client.get('/assets?status=available');
  },

  /**
   * Flag asset issue (Breakdown)
   */
  async flagIssue(id, description) {
    return await client.put(`/assets/${id}/issue`, { description });
  },

  /**
   * Check out asset to project
   */
  async checkOut(id, data) {
    return await client.post(`/assets/${id}/checkout`, data);
  },

  /**
   * Check in asset from project
   */
  async checkIn(id, data) {
    return await client.post(`/assets/${id}/checkin`, data);
  },

  /**
   * Resolve asset maintenance issue
   */
  async resolveIssue(id, resolutionNotes) {
    return await client.put(`/assets/${id}/resolve`, { resolutionNotes });
  }
};

export default assets;
