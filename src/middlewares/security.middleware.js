/**
 * MCMS Middleware - Security Headers
 * Protects against common web vulnerabilities
 */

const env = require('../config/env');

/**
 * Security headers configuration
 */
const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // XSS protection (legacy, but still useful)
  'X-XSS-Protection': '1; mode=block',
  
  // Don't send referrer for cross-origin requests
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Prevent Cross-Origin Resource Sharing leaks
  'Cross-Origin-Opener-Policy': 'same-origin',
  
  // Permissions policy
  'Permissions-Policy': 'geolocation=(self), microphone=()',
};

/**
 * Content Security Policy (only in production)
 */
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
  'font-src': ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
  'img-src': ["'self'", "data:", "https:", "blob:"],
  'connect-src': ["'self'", "ws:", "wss:", "https:"],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
};

/**
 * Build CSP header string
 */
function buildCSP() {
  return Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Apply security headers to response
 * @param {http.ServerResponse} res - Response object
 */
function applySecurityHeaders(res) {
  // Apply basic security headers
  for (const [header, value] of Object.entries(securityHeaders)) {
    res.setHeader(header, value);
  }
  
  // Apply CSP in production only (too restrictive for development)
  if (env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy', buildCSP());
    
    // HSTS - only in production with HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

/**
 * Security headers middleware
 */
function securityMiddleware(req, res, next) {
  applySecurityHeaders(res);
  
  if (typeof next === 'function') {
    return next();
  }
  return true;
}

/**
 * Request body size limit check
 * @param {number} maxBytes - Maximum allowed body size
 */
function bodySizeLimit(maxBytes = 10 * 1024 * 1024) { // 10MB default
  return async (req, res) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxBytes) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Request body too large',
        maxSize: `${Math.round(maxBytes / 1024 / 1024)}MB`,
      }));
      return false;
    }
    
    return true;
  };
}

module.exports = {
  applySecurityHeaders,
  securityMiddleware,
  bodySizeLimit,
  securityHeaders,
  buildCSP,
};
