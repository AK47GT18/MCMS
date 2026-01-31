/**
 * Response Cache - LRU Cache Implementation
 * Provides optional caching for API responses with TTL and size limits
 */

export class ResponseCache {
  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate cache key from request details
   */
  generateKey(url, method = 'GET', body = null) {
    const bodyStr = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyStr}`;
  }

  /**
   * Store response in cache
   */
  set(key, value, ttl = this.defaultTTL) {
    // If cache is full, remove oldest entry (LRU)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const entry = {
      value,
      expiresAt: Date.now() + ttl,
    };

    this.cache.set(key, entry);
  }

  /**
   * Get response from cache if valid
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidate(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Clear all cached responses
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }
}

// Singleton instance
export const responseCache = new ResponseCache();
export default responseCache;
