/**
 * Loading State Manager
 * Tracks active API requests and emits loading events for UI integration
 */

class LoadingStateManager {
  constructor() {
    this.activeRequests = new Map();
    this.globalCounter = 0;
    this.listeners = new Map();
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start loading for a request
   */
  startLoading(requestId = null) {
    const id = requestId || this.generateRequestId();
    
    if (!this.activeRequests.has(id)) {
      this.activeRequests.set(id, {
        id,
        startTime: Date.now(),
      });
      
      this.globalCounter++;
      this.emit('loadingstart', { requestId: id, total: this.globalCounter });
      
      if (this.globalCounter === 1) {
        this.emit('globalloadingstart', { total: 1 });
      }
    }

    return id;
  }

  /**
   * Stop loading for a request
   */
  stopLoading(requestId) {
    if (this.activeRequests.has(requestId)) {
      const request = this.activeRequests.get(requestId);
      const duration = Date.now() - request.startTime;
      
      this.activeRequests.delete(requestId);
      this.globalCounter = Math.max(0, this.globalCounter - 1);
      
      this.emit('loadingend', { requestId, duration, total: this.globalCounter });
      
      if (this.globalCounter === 0) {
        this.emit('globalloadingend', { total: 0 });
      }
    }
  }

  /**
   * Check if loading (global or specific request)
   */
  isLoading(requestId = null) {
    if (requestId) {
      return this.activeRequests.has(requestId);
    }
    return this.globalCounter > 0;
  }

  /**
   * Get all active request IDs
   */
  getActiveRequests() {
    return Array.from(this.activeRequests.keys());
  }

  /**
   * Get global loading count
   */
  getLoadingCount() {
    return this.globalCounter;
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in loading state listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Clear all active requests (for cleanup/reset)
   */
  reset() {
    this.activeRequests.clear();
    this.globalCounter = 0;
    this.emit('globalloadingend', { total: 0 });
  }
}

// Singleton instance
export const loadingState = new LoadingStateManager();
export default loadingState;
