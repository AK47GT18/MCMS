/**
 * Users API Module
 * CRUD operations for user management
 */

import client from './client.js';

const users = {
  /**
   * Get all users with pagination
   */
  async getAll(params = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const queryString = new URLSearchParams({ page, limit, sortBy, sortOrder }).toString();
    return await client.get(`/users?${queryString}`);
  },

  /**
   * Get user by ID
   */
  async getById(id) {
    return await client.get(`/users/${id}`);
  },

  /**
   * Create new user
   */
  async create(userData) {
    return await client.post('/users', userData);
  },

  /**
   * Update user by ID
   */
  async update(id, userData) {
    return await client.put(`/users/${id}`, userData);
  },

  /**
   * Delete user by ID
   */
  async remove(id) {
    return await client.delete(`/users/${id}`);
  },

  /**
   * Lock user account
   */
  async lock(id) {
    return await client.post(`/users/${id}/lock`);
  },

  /**
   * Unlock user account
   */
  async unlock(id) {
    return await client.post(`/users/${id}/unlock`);
  },

  /**
   * Get users by role
   */
  async getByRole(role) {
    return await client.get(`/users?role=${encodeURIComponent(role)}`);
  },
};

export default users;
