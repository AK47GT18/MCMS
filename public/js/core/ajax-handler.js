/**
 * AJAX Request Handler
 */
const AjaxHandler = {
  /**
   * Make GET request
   */
  async get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    return this.request(fullUrl, {
      method: 'GET'
    });
  },

  /**
   * Make POST request
   */
  async post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Make PUT request
   */
  async put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Make DELETE request
   */
  async delete(url) {
    return this.request(url, {
      method: 'DELETE'
    });
  },

  /**
   * Generic request handler
   */
  async request(url, options = {}) {
    const token = AuthManager.getToken();
    
    const defaultOptions = {
      headers: {
        ...AppConfig.api.headers,
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        AuthManager.logout();
        return;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('AJAX Error:', error);
      throw error;
    }
  },

  /**
   * Upload file
   */
  async uploadFile(url, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);

    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const token = AuthManager.getToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData
      });

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
};