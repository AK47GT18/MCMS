/**
 * Request/Response Interceptor System
 * Provides a flexible way to intercept and modify requests/responses
 */

import API_CONFIG from './config.js';
import { createErrorFromResponse, AuthenticationError } from './errors.js';
import loadingState from './loadingState.js';

/**
 * Interceptor Manager
 * Manages registration and execution of request/response interceptors
 */
class InterceptorManager {
  constructor() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * Register request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
    return () => this.removeRequestInterceptor(interceptor);
  }

  /**
   * Remove request interceptor
   */
  removeRequestInterceptor(interceptor) {
    const index = this.requestInterceptors.indexOf(interceptor);
    if (index > -1) {
      this.requestInterceptors.splice(index, 1);
    }
  }

  /**
   * Register response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
    return () => this.removeResponseInterceptor(interceptor);
  }

  /**
   * Remove response interceptor
   */
  removeResponseInterceptor(interceptor) {
    const index = this.responseInterceptors.indexOf(interceptor);
    if (index > -1) {
      this.responseInterceptors.splice(index, 1);
    }
  }

  /**
   * Execute request interceptors in order
   */
  async executeRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    
    for (const interceptor of this.requestInterceptors) {
      try {
        modifiedConfig = await interceptor(modifiedConfig);
      } catch (error) {
        console.error('Request interceptor error:', error);
        throw error;
      }
    }
    
    return modifiedConfig;
  }

  /**
   * Execute response interceptors in order
   */
  async executeResponseInterceptors(response, config) {
    let modifiedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      try {
        modifiedResponse = await interceptor(modifiedResponse, config);
      } catch (error) {
        console.error('Response interceptor error:', error);
        throw error;
      }
    }
    
    return modifiedResponse;
  }

  /**
   * Clear all interceptors
   */
  clear() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }
}

// ============================================
// Built-in Interceptors
// ============================================

/**
 * Auth Interceptor - Adds authorization header
 */
export function authInterceptor(config) {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
  
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  
  return config;
}

/**
 * Logging Interceptor - Logs requests and responses
 */
export function loggingInterceptor(config) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] API Request:`, {
    method: config.method,
    url: config.url,
    headers: config.headers,
  });
  
  config._startTime = Date.now();
  return config;
}

/**
 * Loading Interceptor - Manages loading states
 */
export function loadingInterceptor(config) {
  if (!config._skipLoading) {
    config._loadingId = loadingState.startLoading();
  }
  return config;
}

/**
 * Response Logging Interceptor
 */
export function responseLoggingInterceptor(response, config) {
  if (config._startTime) {
    const duration = Date.now() - config._startTime;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] API Response:`, {
      method: config.method,
      url: config.url,
      status: response.status,
      duration: `${duration}ms`,
    });
  }
  return response;
}

/**
 * Response Loading Interceptor - Stops loading
 */
export function responseLoadingInterceptor(response, config) {
  if (config._loadingId) {
    loadingState.stopLoading(config._loadingId);
  }
  return response;
}

/**
 * Error Interceptor - Transforms errors
 */
export async function errorInterceptor(response, config) {
  if (!response.ok) {
    let errorData = null;
    let message = response.statusText || 'Request failed';
    
    try {
      errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch {
      // Response is not JSON
    }
    
    // Handle 401 - redirect to login
    if (response.status === 401) {
      localStorage.removeItem(API_CONFIG.TOKEN_KEY);
      
      // Emit auth error event
      window.dispatchEvent(new CustomEvent('auth:unauthorized', {
        detail: { message, data: errorData }
      }));
      
      throw new AuthenticationError(message, errorData);
    }
    
    throw createErrorFromResponse(response.status, message, errorData);
  }
  
  return response;
}

// Singleton instance
export const interceptorManager = new InterceptorManager();

// Register built-in interceptors
interceptorManager.addRequestInterceptor(authInterceptor);
interceptorManager.addRequestInterceptor(loggingInterceptor);
interceptorManager.addRequestInterceptor(loadingInterceptor);

interceptorManager.addResponseInterceptor(responseLoggingInterceptor);
interceptorManager.addResponseInterceptor(errorInterceptor);
interceptorManager.addResponseInterceptor(responseLoadingInterceptor);

export default interceptorManager;
