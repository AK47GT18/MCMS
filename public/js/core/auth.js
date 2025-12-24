/**
 * Authentication Manager
 */
const AuthManager = {
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = StorageUtil.get(AppConfig.storage.token);
    return token !== null;
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return StorageUtil.get(AppConfig.storage.user);
  },

  /**
   * Login user
   */
  async login(email, password) {
    try {
      const response = await fetch(`${AppConfig.api.baseUrl}/auth/login`, {
        method: 'POST',
        headers: AppConfig.api.headers,
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        StorageUtil.set(AppConfig.storage.token, data.token);
        StorageUtil.set(AppConfig.storage.user, data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Connection error' };
    }
  },

  /**
   * Logout user
   */
  logout() {
    StorageUtil.remove(AppConfig.storage.token);
    StorageUtil.remove(AppConfig.storage.user);
    window.location.href = AppConfig.routes.login;
  },

  /**
   * Get auth token
   */
  getToken() {
    return StorageUtil.get(AppConfig.storage.token);
  },

  /**
   * Refresh token
   */
  async refreshToken() {
    try {
      const response = await fetch(`${AppConfig.api.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          ...AppConfig.api.headers,
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      const data = await response.json();

      if (data.success) {
        StorageUtil.set(AppConfig.storage.token, data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }
};