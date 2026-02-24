/**
 * API Client - Base HTTP Client
 * Centralized fetch wrapper with interceptors, retry logic, caching, and error handling
 */

import API_CONFIG from './config.js';
import { NetworkError, TimeoutError, createErrorFromResponse } from './errors.js';
import interceptorManager from './interceptors.js';
import responseCache from './cache.js';
import loadingState from './loadingState.js';

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * API Client Class
 */
class APIClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || API_CONFIG.BASE_URL;
    this.timeout = config.timeout || API_CONFIG.TIMEOUT;
    this.cachingEnabled = config.cachingEnabled !== false && API_CONFIG.CACHE.enabled;
    
    // Request deduplication tracking
    this.pendingRequests = new Map();
    
    // AbortController registry for cancellation
    this.abortControllers = new Map();
    
    // Response transformers
    this.responseTransformers = [];
  }

  /**
   * Build full URL
   */
  buildURL(endpoint) {
    // Handle absolute URLs
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    // Remove trailing slash from base URL if present
    const cleanBaseURL = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    
    return `${cleanBaseURL}/${cleanEndpoint}`;
  }

  /**
   * Make HTTP request with retry logic
   */
  async request(endpoint, options = {}) {
    console.trace(`[DEBUG] API Request trace for: ${endpoint}`);
    const {
      method = 'GET',
      headers = {},
      body = null,
      retryConfig = API_CONFIG.RETRY,
      skipCache = false,
      skipLoading = false,
      skipDeduplication = false,
      timeout = this.timeout,
      requestId = null,
    } = options;

    // Build request config
    let config = {
      method: method.toUpperCase(),
      url: this.buildURL(endpoint),
      headers: {
        ...API_CONFIG.HEADERS,
        ...headers,
      },
      body,
      timeout,
      _skipLoading: skipLoading,
      _skipCache: skipCache,
      _skipDeduplication: skipDeduplication,
      _requestId: requestId || this.generateRequestId(method, endpoint, body),
    };

    // If body is FormData, we must let the browser set the Content-Type header with boundaries
    if (body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Request deduplication - prevent duplicate in-flight requests
    if (!skipDeduplication && this.pendingRequests.has(config._requestId)) {
      console.log(`[Deduplication] Returning existing request for ${config._requestId}`);
      return this.pendingRequests.get(config._requestId);
    }

    // Check cache for GET requests
    if (this.cachingEnabled && method === 'GET' && !skipCache) {
      const cacheKey = responseCache.generateKey(config.url, method);
      const cachedResponse = responseCache.get(cacheKey);
      
      if (cachedResponse) {
        console.log(`[Cache Hit] ${config.url}`);
        return cachedResponse;
      }
    }

    // Execute request interceptors
    config = await interceptorManager.executeRequestInterceptors(config);

    // Attempt request with retry logic
    let lastError;
    const maxAttempts = retryConfig?.maxAttempts || 1;
    
    // Create promise for deduplication
    const requestPromise = (async () => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await this.executeRequest(config);
          
          // Execute response interceptors
          const processedResponse = await interceptorManager.executeResponseInterceptors(response, config);
          
          // Parse response
          let data = await this.parseResponse(processedResponse);
          
          // Apply response transformers
          data = await this.transformResponse(data, config);
          
          // Cache GET responses
          if (this.cachingEnabled && method === 'GET' && !skipCache) {
            const cacheKey = responseCache.generateKey(config.url, method);
            responseCache.set(cacheKey, data);
          }
          
          // Invalidate cache on mutations
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            this.invalidateCacheForEndpoint(endpoint);
          }
          
          return data;
        } catch (error) {
          lastError = error;
          
          // Stop loading on error
          if (config._loadingId) {
            loadingState.stopLoading(config._loadingId);
          }
          
          // If request was cancelled, don't retry
          if (error.name === 'AbortError') {
            throw new NetworkError('Request cancelled');
          }
          
          // Check if we should retry
          const shouldRetry = attempt < maxAttempts && 
                              retryConfig?.shouldRetry && 
                              retryConfig.shouldRetry(error.statusCode);
          
          if (!shouldRetry) {
            throw error;
          }
          
          // Calculate backoff delay
          const delay = Math.min(
            retryConfig.initialDelay * Math.pow(2, attempt - 1),
            retryConfig.maxDelay
          );
          
          console.log(`[Retry ${attempt}/${maxAttempts}] ${config.url} after ${delay}ms`);
          await sleep(delay);
        }
      }
      
      throw lastError;
    })();
    
    // Store in pending requests for deduplication
    if (!config._skipDeduplication) {
      this.pendingRequests.set(config._requestId, requestPromise);
      
      // Clean up after request completes (success or error)
      requestPromise.finally(() => {
        this.pendingRequests.delete(config._requestId);
        this.abortControllers.delete(config._requestId);
      });
    }
    
    return requestPromise;
  }

  /**
   * Execute fetch request with timeout
   */
  async executeRequest(config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    // Store controller for potential cancellation
    this.abortControllers.set(config._requestId, controller);

    try {
      const fetchOptions = {
        method: config.method,
        headers: config.headers,
        signal: controller.signal,
      };

      if (config.body) {
        if (config.body instanceof FormData) {
          fetchOptions.body = config.body;
        } else {
          fetchOptions.body = typeof config.body === 'string' 
            ? config.body 
            : JSON.stringify(config.body);
        }
      }

      const response = await fetch(config.url, fetchOptions);
      clearTimeout(timeoutId);
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new TimeoutError(`Request timeout after ${config.timeout}ms`);
      }
      
      throw new NetworkError(error.message || 'Network request failed');
    }
  }

  /**
   * Parse response based on content type
   */
  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  /**
   * Generate unique request ID for deduplication
   */
  generateRequestId(method, endpoint, body) {
    const bodyStr = body ? JSON.stringify(body) : '';
    return `${method}:${endpoint}:${bodyStr}`;
  }
  
  /**
   * Transform response data using registered transformers
   */
  async transformResponse(data, config) {
    let transformed = data;
    
    for (const transformer of this.responseTransformers) {
      transformed = await transformer(transformed, config);
    }
    
    return transformed;
  }
  
  /**
   * Register response transformer
   */
  addResponseTransformer(transformer) {
    this.responseTransformers.push(transformer);
    return () => this.removeResponseTransformer(transformer);
  }
  
  /**
   * Remove response transformer
   */
  removeResponseTransformer(transformer) {
    const index = this.responseTransformers.indexOf(transformer);
    if (index > -1) {
      this.responseTransformers.splice(index, 1);
    }
  }
  
  /**
   * Cancel a specific request by ID
   */
  cancelRequest(requestId) {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
      this.pendingRequests.delete(requestId);
      return true;
    }
    return false;
  }
  
  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    let count = 0;
    for (const [requestId, controller] of this.abortControllers.entries()) {
      controller.abort();
      count++;
    }
    this.abortControllers.clear();
    this.pendingRequests.clear();
    return count;
  }

  /**
   * Invalidate cache for an endpoint pattern
   */
  invalidateCacheForEndpoint(endpoint) {
    const pattern = endpoint.split('?')[0]; // Remove query params
    responseCache.invalidate(pattern);
  }

  /**
   * Convenience method: GET request
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Convenience method: POST request
   */
  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * Convenience method: PUT request
   */
  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * Convenience method: PATCH request
   */
  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * Convenience method: DELETE request
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Clear response cache
   */
  clearCache() {
    responseCache.clear();
  }

  /**
   * Get loading state
   */
  isLoading(requestId = null) {
    return loadingState.isLoading(requestId);
  }
  
  /**
   * Get number of pending requests
   */
  getPendingRequestCount() {
    return this.pendingRequests.size;
  }
}

// Export singleton instance
export const client = new APIClient();
export default client;
