/**
 * Notification Service
 * Manages the state of notifications (add, clear, retrieve)
 * Implements a simple Observer pattern for UI updates.
 */

class NotificationService {
    constructor() {
        this.notifications = [];
        this.subscribers = [];
    }

    /**
     * Add a new notification
     * @param {string} type - 'success', 'error', 'info'
     * @param {string} title 
     * @param {string} message 
     */
    add(type, title, message) {
        const notification = {
            id: Date.now(), // Simple ID
            type,
            title,
            message,
            timestamp: new Date()
        };

        // Add to beginning of list
        this.notifications.unshift(notification);
        
        // Notify subscribers
        this._notify();
    }

    /**
     * Clear all notifications
     */
    clear() {
        this.notifications = [];
        this._notify();
    }

    /**
     * Get current notifications
     * @returns {Array} copy of notifications
     */
    getAll() {
        return [...this.notifications];
    }

    /**
     * Subscribe to changes
     * @param {Function} callback - Function to call with new list
     */
    subscribe(callback) {
        this.subscribers.push(callback);
    }

    /**
     * Internal: Notify all subscribers
     */
    _notify() {
        this.subscribers.forEach(cb => cb(this.notifications));
    }
}

// Export a singleton instance
export const notificationService = new NotificationService();
