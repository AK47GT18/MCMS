/**
 * API Configuration
 * Centralized configuration for API client
 */

export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: '/api/v1',
  
  // Request timeout in milliseconds
  TIMEOUT: 30000, // 30 seconds
  
  // Retry configuration
  RETRY: {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 5000, // 5 seconds
    shouldRetry: (status) => {
      // Retry on network errors and 5xx server errors
      return !status || status >= 500;
    },
  },
  
  // Cache configuration
  CACHE: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100, // Maximum number of cached responses
  },
  
  // Token storage
  TOKEN_KEY: 'mcms_auth_token',
  
  // Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export default API_CONFIG;
