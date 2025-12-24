/**
 * Offline Service
 * Handles offline functionality and caching
 */
const OfflineService = {
  isOnline: navigator.onLine,
  db: null,
  queue: [],

  /**
   * Initialize offline service
   */
  init() {
    console.log('Offline Service initialized');
    
    // Set up event listeners
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());

    // Initialize IndexedDB
    this.initDatabase();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  },

  /**
   * Initialize IndexedDB
   */
  initDatabase() {
    const request = indexedDB.open('MCMS_DB', 1);

    request.onerror = () => {
      console.error('Database failed to open');
    };

    request.onsuccess = () => {
      this.db = request.result;
      console.log('Database opened successfully');
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'url' });
      }

      if (!db.objectStoreNames.contains('form-data')) {
        db.createObjectStore('form-data', { keyPath: 'id', autoIncrement: true });
      }
    };
  },

  /**
   * Save data for offline use
   */
  cacheData(url, data) {
    if (!this.db) return;

    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    store.put({
      url: url,
      data: data,
      timestamp: Date.now()
    });
  },

  /**
   * Get cached data
   */
  getCachedData(url) {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(url);

      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Queue request for later
   */
  queueRequest(method, url, data = null) {
    if (!this.db) return;

    const transaction = this.db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    store.add({
      method: method,
      url: url,
      data: data,
      timestamp: Date.now()
    });

    this.queue.push({ method, url, data });
  },

  /**
   * Handle online event
   */
  onOnline() {
    this.isOnline = true;
    console.log('Application is online');
    NotificationComponent.success('Back online - syncing data...');
    this.syncQueue();
  },

  /**
   * Handle offline event
   */
  onOffline() {
    this.isOnline = false;
    console.log('Application is offline');
    NotificationComponent.warning('No internet connection - changes will be synced when online');
  },

  /**
   * Sync queued requests
   */
  syncQueue() {
    if (!this.isOnline || this.queue.length === 0) return;

    const requests = [...this.queue];
    requests.forEach(req => {
      AjaxHandler[req.method.toLowerCase()](req.url, req.data)
        .then(() => {
          this.queue = this.queue.filter(r => r !== req);
          console.log('Synced request:', req);
        })
        .catch(error => {
          console.error('Sync error:', error);
        });
    });
  },

  /**
   * Clear cache
   */
  clearCache() {
    if (!this.db) return;

    const transaction = this.db.transaction(['cache', 'requests'], 'readwrite');
    transaction.objectStore('cache').clear();
    transaction.objectStore('requests').clear();
    this.queue = [];
    console.log('Cache cleared');
  },

  /**
   * Get storage usage
   */
  getStorageUsage() {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        const percentUsed = (estimate.usage / estimate.quota) * 100;
        console.log(`Storage usage: ${percentUsed.toFixed(2)}%`);
        return percentUsed;
      });
    }
  }
};
