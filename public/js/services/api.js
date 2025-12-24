/**
 * API Service
 * Handles all HTTP requests to the backend API
 */
const ApiService = {
  /**
   * Make GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options
    });
  },

  /**
   * Make POST request
   */
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  },

  /**
   * Make PUT request
   */
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  },

  /**
   * Make PATCH request
   */
  async patch(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    });
  },

  /**
   * Make DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  },

  /**
   * Core request method
   */
  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const config = this.buildConfig(options);

    try {
      const response = await fetch(url, config);
      return this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Build full URL
   */
  buildUrl(endpoint) {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    const baseUrl = AppConfig.api.baseUrl || '/api';
    return baseUrl + endpoint;
  },

  /**
   * Build fetch config
   */
  buildConfig(options) {
    const config = {
      headers: {
        ...AppConfig.api.headers,
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = localStorage.getItem(AppConfig.storage.token);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },

  /**
   * Handle successful response
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle authentication errors
    if (response.status === 401) {
      // Clear stored auth data
      localStorage.removeItem(AppConfig.storage.token);
      localStorage.removeItem(AppConfig.storage.user);
      
      // Redirect to login
      if (typeof AuthManager !== 'undefined') {
        AuthManager.logout();
      } else {
        window.location.href = AppConfig.routes.login;
      }
      
      throw new Error('Unauthorized');
    }

    // Handle other errors
    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  },

  /**
   * Handle request error
   */
  handleError(error) {
    if (error instanceof TypeError) {
      // Network error
      return new Error('Network error: Unable to reach the server');
    }
    
    return error;
  }
};
