/**
 * Notifications Component
 * Handles toast notifications, alerts, and notification panel
 */
const NotificationComponent = {
  container: null,
  notifications: [],

  /**
   * Initialize notifications container
   */
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notifications-container';
      this.container.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 10000;
        max-width: 400px;
      `;
      document.body.appendChild(this.container);
    }
  },

  /**
   * Show notification toast
   */
  toast(message, type = 'info', duration = 3000) {
    this.init();

    const id = `notification-${Date.now()}`;
    const notification = document.createElement('div');
    
    const colors = {
      success: { bg: '#DCFCE7', text: '#166534', icon: 'fa-check-circle', borderColor: '#86EFAC' },
      error: { bg: '#FEE2E2', text: '#991B1B', icon: 'fa-exclamation-circle', borderColor: '#FECACA' },
      warning: { bg: '#FEF3C7', text: '#92400E', icon: 'fa-exclamation-triangle', borderColor: '#FDE68A' },
      info: { bg: '#DBEAFE', text: '#1E40AF', icon: 'fa-info-circle', borderColor: '#BAE6FD' }
    };

    const style = colors[type] || colors.info;

    notification.id = id;
    notification.style.cssText = `
      background: ${style.bg};
      border: 2px solid ${style.borderColor};
      color: ${style.text};
      padding: 16px 20px;
      border-radius: 10px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 14px;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;

    notification.innerHTML = `
      <i class="fas ${style.icon}" style="font-size: 18px;"></i>
      <span>${message}</span>
      <button onclick="NotificationComponent.remove('${id}')" style="
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 16px;
        margin-left: auto;
        padding: 0;
      ">
        <i class="fas fa-times"></i>
      </button>
    `;

    this.container.appendChild(notification);
    this.notifications.push(id);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  },

  /**
   * Remove notification
   */
  remove(id) {
    const notification = document.getElementById(id);
    if (notification) {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        notification.remove();
        this.notifications = this.notifications.filter(n => n !== id);
      }, 300);
    }
  },

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications.forEach(id => this.remove(id));
  },

  /**
   * Show success notification
   */
  success(message, duration = 3000) {
    return this.toast(message, 'success', duration);
  },

  /**
   * Show error notification
   */
  error(message, duration = 5000) {
    return this.toast(message, 'error', duration);
  },

  /**
   * Show warning notification
   */
  warning(message, duration = 4000) {
    return this.toast(message, 'warning', duration);
  },

  /**
   * Show info notification
   */
  info(message, duration = 3000) {
    return this.toast(message, 'info', duration);
  },

  /**
   * Open notifications panel (in header)
   */
  openPanel() {
    // Create modal with notifications panel
    const modalId = 'notifications-panel-modal';
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal" style="max-width: 500px;">
          <div class="modal-header">
            <h3 class="modal-title">
              <i class="fas fa-bell" style="color: var(--orange); margin-right: 10px;"></i>
              Notifications
            </h3>
            <div class="modal-close" onclick="NotificationComponent.closePanel()">
              <i class="fas fa-times"></i>
            </div>
          </div>
          <div class="modal-body" id="notifications-panel-body">
            <div style="text-align: center; padding: 40px 20px; color: var(--slate-500);">
              <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
              <div style="font-size: 16px; font-weight: 600;">No new notifications</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          NotificationComponent.closePanel();
        }
      });
    }

    modal.classList.add('show');
    this.loadPanelNotifications();
  },

  /**
   * Close notifications panel
   */
  closePanel() {
    const modal = document.getElementById('notifications-panel-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  },

  /**
   * Load notifications for panel
   */
  loadPanelNotifications() {
    const panelBody = document.getElementById('notifications-panel-body');
    if (!panelBody) return;

    // Sample notifications data
    const notificationsData = [
      {
        id: 1,
        title: 'Contract Approved',
        message: 'CNT-2024-001 has been approved by Larry Kambala',
        time: '2 hours ago',
        read: false,
        icon: 'fa-check-circle',
        color: '#10B981'
      },
      {
        id: 2,
        title: 'New Task Assigned',
        message: 'You have been assigned to task TK-2024-045',
        time: '4 hours ago',
        read: false,
        icon: 'fa-tasks',
        color: '#3B82F6'
      },
      {
        id: 3,
        title: 'Budget Alert',
        message: 'M1 Road project has reached 90% of allocated budget',
        time: '1 day ago',
        read: true,
        icon: 'fa-exclamation-circle',
        color: '#F59E0B'
      }
    ];

    panelBody.innerHTML = notificationsData.map(notif => `
      <div style="
        padding: 16px;
        border-bottom: 1px solid var(--slate-200);
        cursor: pointer;
        transition: var(--transition);
        background: ${notif.read ? 'white' : '#FFF7ED'};
      " onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='${notif.read ? 'white' : '#FFF7ED'}'">
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <div style="
            width: 40px;
            height: 40px;
            background: ${notif.color}20;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${notif.color};
            font-size: 18px;
            flex-shrink: 0;
          ">
            <i class="fas ${notif.icon}"></i>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="
              font-weight: 700;
              color: var(--slate-900);
              font-size: 14px;
              margin-bottom: 4px;
            ">${notif.title}</div>
            <div style="
              font-size: 13px;
              color: var(--slate-600);
              line-height: 1.4;
            ">${notif.message}</div>
            <div style="
              font-size: 11px;
              color: var(--slate-400);
              margin-top: 8px;
            ">${notif.time}</div>
          </div>
          ${!notif.read ? '<div style="width: 8px; height: 8px; background: var(--orange); border-radius: 50%; flex-shrink: 0; margin-top: 6px;"></div>' : ''}
        </div>
      </div>
    `).join('');
  }
};

// Add styles for animations
if (!document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
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
