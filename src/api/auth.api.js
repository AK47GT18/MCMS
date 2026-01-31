/**
 * Authentication API Module
 * Handles user authentication and password management
 */

import client from './client.js';
import API_CONFIG from './config.js';

const auth = {
  /**
   * Login with email and password
   */
  async login(email, password) {
    const response = await client.post('/auth/login', { email, password });
    
    // Store token
    if (response.token) {
      localStorage.setItem(API_CONFIG.TOKEN_KEY, response.token);
    }
    
    return response;
  },

  /**
   * Register new user
   */
  async register(userData) {
    const response = await client.post('/auth/register', userData);
    
    // Store token
    if (response.token) {
      localStorage.setItem(API_CONFIG.TOKEN_KEY, response.token);
    }
    
    return response;
  },

  /**
   * Get current user profile
   */
  async getProfile() {
    return await client.get('/auth/me');
  },

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    return await client.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    return await client.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    return await client.post('/auth/reset-password', { token, newPassword });
  },

  /**
   * Logout - clear token and cache
   */
  logout() {
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    client.clearCache();
    
    // Emit logout event
    window.dispatchEvent(new CustomEvent('auth:logout'));
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem(API_CONFIG.TOKEN_KEY);
  },

  /**
   * Get stored token
   */
  getToken() {
    return localStorage.getItem(API_CONFIG.TOKEN_KEY);
  },
};

export default auth;
