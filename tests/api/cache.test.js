/**
 * API Client Integration Tests - Cache
 * Tests for the LRU cache implementation
 */

import { responseCache } from '../src/api/cache.js';

describe('API Client - Cache', () => {
  beforeEach(() => {
    responseCache.clear();
  });

  test('Caches GET responses', () => {
    const key = responseCache.generateKey('/users', 'GET');
    const data = { users: [{ id: 1, name: 'Test' }] };
    
    responseCache.set(key, data);
    const cached = responseCache.get(key);
    
    expect(cached).toEqual(data);
  });

  test('Returns cached response if fresh', () => {
    const key = responseCache.generateKey('/users', 'GET');
    const data = { users: [] };
    
    responseCache.set(key, data, 10000); // 10 seconds TTL
    
    setTimeout(() => {
      const cached = responseCache.get(key);
      expect(cached).toEqual(data);
    }, 1000);
  });

  test('Invalidates cache on TTL expiry', (done) => {
    const key = responseCache.generateKey('/users', 'GET');
    const data = { users: [] };
    
    responseCache.set(key, data, 100); // 100ms TTL
    
    setTimeout(() => {
      const cached = responseCache.get(key);
      expect(cached).toBeNull();
      done();
    }, 150);
  });

  test('Invalidates cache on mutations', () => {
    const getKey = responseCache.generateKey('/users', 'GET');
    const data = { users: [] };
    
    responseCache.set(getKey, data);
    
    // Invalidate all /users entries
    const deleted = responseCache.invalidate('/users');
    
    expect(deleted).toBeGreaterThan(0);
    expect(responseCache.get(getKey)).toBeNull();
  });

  test('LRU eviction works correctly', () => {
    const cache = new (responseCache.constructor)(3); // Max 3 items
    
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4'); // Should evict key1
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key4')).toBe('value4');
  });

  test('Manual cache clearing works', () => {
    responseCache.set('key1', 'value1');
    responseCache.set('key2', 'value2');
    
    responseCache.clear();
    
    expect(responseCache.size).toBe(0);
    expect(responseCache.get('key1')).toBeNull();
  });

  test('Cleanup removes expired entries', (done) => {
    responseCache.set('key1', 'value1', 100);
    responseCache.set('key2', 'value2', 5000);
    
    setTimeout(() => {
      const removed = responseCache.cleanup();
      
      expect(removed).toBe(1);
      expect(responseCache.get('key1')).toBeNull();
      expect(responseCache.get('key2')).toBe('value2');
      done();
    }, 150);
  });
});
