/**
 * Notification Manager
 * Handles user notifications and alerts
 */
const NotificationManager = {
  notifications: [],

  /**
   * Initialize notification system
   */
  init() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      `;
      document.body.appendChild(container);
    }
  },

  /**
   * Show notification
   */
  show(message, type = 'info', duration = 4000) {
    this.init();

    const notificationId = `notification-${Date.now()}`;
    const container = document.getElementById('notification-container');

    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      background: white;
      padding: 16px 20px;
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideInRight 0.3s ease;
      border-left: 4px solid var(--${type === 'error' ? 'red' : type === 'success' ? 'emerald' : type === 'warning' ? 'amber' : 'blue'});
    `;

    const iconMap = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    const colorMap = {
      success: 'var(--emerald)',
      error: 'var(--red)',
      warning: 'var(--amber)',
      info: 'var(--blue)'
    };

    notification.innerHTML = `
      <i class="fas ${iconMap[type]}" style="color: ${colorMap[type]};"></i>
      <div style="flex: 1; font-size: 14px; font-weight: 500; color: var(--slate-900);">${message}</div>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; color: var(--slate-400); font-size: 16px;">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(notification);
    this.notifications.push(notificationId);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        const el = document.getElementById(notificationId);
        if (el) {
          el.style.animation = 'slideOutRight 0.3s ease';
          setTimeout(() => el.remove(), 300);
        }
        this.notifications = this.notifications.filter(id => id !== notificationId);
      }, duration);
    }
  },

  /**
   * Show success notification
   */
  success(message, duration = 4000) {
    this.show(message, 'success', duration);
  },

  /**
   * Show error notification
   */
  error(message, duration = 5000) {
    this.show(message, 'error', duration);
  },

  /**
   * Show warning notification
   */
  warning(message, duration = 4000) {
    this.show(message, 'warning', duration);
  },

  /**
   * Show info notification
   */
  info(message, duration = 4000) {
    this.show(message, 'info', duration);
  },

  /**
   * Clear all notifications
   */
  clear() {
    const container = document.getElementById('notification-container');
    if (container) {
      container.innerHTML = '';
    }
    this.notifications = [];
  }
};

// Add CSS animations to document if not already present
if (!document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => NotificationManager.init());
} else {
  NotificationManager.init();
}
