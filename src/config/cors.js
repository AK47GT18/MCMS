/**
 * MCMS Configuration - CORS Settings
 * Cross-Origin Resource Sharing configuration
 */

const env = require('./env');

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  env.FRONTEND_URL,
].filter(Boolean);

/**
 * Parse CORS headers for a request
 * @param {string} origin - Request origin header
 * @returns {Object} CORS headers object
 */
function getCorsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
  
  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (env.NODE_ENV === 'development') {
    // In development, allow all origins
    headers['Access-Control-Allow-Origin'] = origin || '*';
  }
  
  return headers;
}

/**
 * Apply CORS headers to response
 * @param {http.ServerResponse} res - Response object
 * @param {string} origin - Request origin
 */
function applyCors(res, origin) {
  const headers = getCorsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

module.exports = {
  allowedOrigins,
  getCorsHeaders,
  applyCors,
};
