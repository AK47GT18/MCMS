/**
 * Sync Service
 * Handles data synchronization between client and server
 */
const SyncService = {
  syncQueue: [],
  isSyncing: false,
  lastSyncTime: null,
  syncInterval: 5 * 60 * 1000, // 5 minutes

  /**
   * Initialize sync service
   */
  init() {
    console.log('Sync Service initialized');
    
    // Load sync queue from storage
    this.loadQueue();

    // Set up auto-sync
    setInterval(() => {
      this.autoSync();
    }, this.syncInterval);

    // Sync on online event
    window.addEventListener('online', () => {
      this.syncNow();
    });
  },

  /**
   * Add item to sync queue
   */
  enqueue(action, resource, data) {
    const item = {
      id: `sync-${Date.now()}-${Math.random()}`,
      action: action, // 'create', 'update', 'delete'
      resource: resource, // 'projects', 'tasks', 'commitments', etc.
      data: data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    };

    this.syncQueue.push(item);
    this.saveQueue();

    NotificationComponent.info(`Queued ${action} operation for ${resource}`);
    
    return item.id;
  },

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;
    const itemsCopy = [...this.syncQueue];

    for (const item of itemsCopy) {
      try {
        const response = await this.processItem(item);
        
        if (response.success) {
          // Remove from queue
          this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
          console.log(`Synced: ${item.action} ${item.resource}`);
        } else {
          item.retries++;
          if (item.retries >= item.maxRetries) {
            console.error(`Max retries reached for item ${item.id}`);
            this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
          }
        }
      } catch (error) {
        console.error('Sync error:', error);
        item.retries++;
      }
    }

    this.saveQueue();
    this.isSyncing = false;
    this.lastSyncTime = Date.now();
  },

  /**
   * Process individual sync item
   */
  async processItem(item) {
    const endpoint = `/api/v1/${item.resource}`;
    let response;

    try {
      switch (item.action) {
        case 'create':
          response = await AjaxHandler.post(endpoint, item.data);
          break;
        case 'update':
          response = await AjaxHandler.put(`${endpoint}/${item.data.id}`, item.data);
          break;
        case 'delete':
          response = await AjaxHandler.delete(`${endpoint}/${item.data.id}`);
          break;
        default:
          throw new Error(`Unknown action: ${item.action}`);
      }

      return { success: true, response };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Automatic sync
   */
  autoSync() {
    if (navigator.onLine && this.syncQueue.length > 0) {
      this.processSyncQueue();
    }
  },

  /**
   * Manual sync now
   */
  syncNow() {
    if (this.syncQueue.length === 0) {
      NotificationComponent.info('Nothing to sync');
      return;
    }

    NotificationComponent.info('Syncing data...');
    this.processSyncQueue();
  },

  /**
   * Save queue to localStorage
   */
  saveQueue() {
    try {
      localStorage.setItem('mcms_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  },

  /**
   * Load queue from localStorage
   */
  loadQueue() {
    try {
      const saved = localStorage.getItem('mcms_sync_queue');
      if (saved) {
        this.syncQueue = JSON.parse(saved);
        console.log(`Loaded ${this.syncQueue.length} items from sync queue`);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  },

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      isOnline: navigator.onLine
    };
  },

  /**
   * Clear sync queue
   */
  clearQueue() {
    this.syncQueue = [];
    this.saveQueue();
    NotificationComponent.info('Sync queue cleared');
  },

  /**
   * Get sync queue
   */
  getQueue() {
    return this.syncQueue;
  }
};
