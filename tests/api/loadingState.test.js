/**
 * API Client Integration Tests - Loading State
 * Tests for the loading state manager
 */

import { loadingState } from '../src/api/loadingState.js';

describe('API Client - Loading State', () => {
  beforeEach(() => {
    loadingState.reset();
  });

  test('Increments counter on request start', () => {
    const id = loadingState.startLoading();
    
    expect(loadingState.isLoading()).toBe(true);
    expect(loadingState.getLoadingCount()).toBe(1);
    expect(loadingState.isLoading(id)).toBe(true);
  });

  test('Decrements counter on request end', () => {
    const id = loadingState.startLoading();
    loadingState.stopLoading(id);
    
    expect(loadingState.isLoading()).toBe(false);
    expect(loadingState.getLoadingCount()).toBe(0);
  });

  test('Tracks multiple concurrent requests', () => {
    const id1 = loadingState.startLoading();
    const id2 = loadingState.startLoading();
    const id3 = loadingState.startLoading();
    
    expect(loadingState.getLoadingCount()).toBe(3);
    expect(loadingState.getActiveRequests()).toHaveLength(3);
    
    loadingState.stopLoading(id2);
    expect(loadingState.getLoadingCount()).toBe(2);
  });

  test('Emits events correctly', (done) => {
    let startFired = false;
    let endFired = false;
    
    loadingState.on('loadingstart', () => {
      startFired = true;
    });
    
    loadingState.on('loadingend', () => {
      endFired = true;
      expect(startFired).toBe(true);
      done();
    });
    
    const id = loadingState.startLoading();
    loadingState.stopLoading(id);
  });

  test('Cleans up on error', () => {
    const id = loadingState.startLoading();
    
    // Simulate error cleanup
    loadingState.stopLoading(id);
    
    expect(loadingState.isLoading(id)).toBe(false);
    expect(loadingState.getLoadingCount()).toBe(0);
  });

  test('Handles unsubscribe correctly', () => {
    let callCount = 0;
    const unsubscribe = loadingState.on('loadingstart', () => {
      callCount++;
    });
    
    loadingState.startLoading();
    unsubscribe();
    loadingState.startLoading();
    
    expect(callCount).toBe(1);
  });
});
