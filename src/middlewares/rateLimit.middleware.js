/**
 * MCMS Middleware - Rate Limiting
 * Protects auth endpoints from brute-force attacks
 */

const logger = require('../utils/logger');

/**
 * In-memory rate limit store
 * For production, replace with Redis for distributed rate limiting
 */
class RateLimitStore {
  constructor() {
    this.requests = new Map();
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }
  
  /**
   * Get request count for a key
   */
  get(key) {
    const record = this.requests.get(key);
    if (!record) return null;
    
    // Check if window has expired
    if (Date.now() > record.resetTime) {
      this.requests.delete(key);
      return null;
    }
    
    return record;
  }
  
  /**
   * Increment request count
   */
  increment(key, windowMs) {
    const record = this.get(key);
    
    if (record) {
      record.count++;
      return record;
    }
    
    const newRecord = {
      count: 1,
      resetTime: Date.now() + windowMs,
    };
    this.requests.set(key, newRecord);
    return newRecord;
  }
  
  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

const store = new RateLimitStore();

/**
 * Create rate limiter middleware
 * @param {Object} options - Rate limit configuration
 * @returns {Function} Middleware function
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 5,                    // Max requests per window
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => getClientIP(req),
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
  } = options;
  
  return async (req, res, next) => {
    const key = keyGenerator(req);
    const record = store.increment(key, windowMs);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    
    if (record.count > max) {
      logger.warn('Rate limit exceeded', { ip: key, count: record.count });
      
      res.setHeader('Retry-After', Math.ceil((record.resetTime - Date.now()) / 1000));
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: message,
        retryAfter: Math.ceil((record.resetTime - Date.now()) / 1000),
      }));
      return;
    }
    
    // Continue to next handler
    if (typeof next === 'function') {
      return next();
    }
    return true;
  };
}

/**
 * Get client IP address
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.socket?.remoteAddress ||
         'unknown';
}

// ============================================
// Pre-configured Rate Limiters
// ============================================

/**
 * Login rate limiter - 5 attempts per 15 minutes
 */
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  keyGenerator: (req) => `login:${getClientIP(req)}`,
});

/**
 * Password reset rate limiter - 3 attempts per hour
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset requests. Please try again in an hour.',
  keyGenerator: (req) => `reset:${getClientIP(req)}`,
});

/**
 * Registration rate limiter - 10 attempts per hour
 */
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many registration attempts. Please try again later.',
  keyGenerator: (req) => `register:${getClientIP(req)}`,
});

/**
 * General API rate limiter - 100 requests per minute
 */
const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'API rate limit exceeded. Please slow down.',
  keyGenerator: (req) => `api:${getClientIP(req)}`,
});

module.exports = {
  createRateLimiter,
  loginLimiter,
  passwordResetLimiter,
  registerLimiter,
  apiLimiter,
  getClientIP,
};
