/**
 * Notification UI Controller
 * Handles DOM interactions for notifications (Rendering, Toggle, etc.)
 */

import { notificationService } from '../../services/notification.service.js';

// DOM Elements
let dropdown, list, badge, wrapper;

export function initNotifications() {
    // Select Elements
    dropdown = document.getElementById('notification-dropdown');
    list = document.getElementById('notify-list');
    badge = document.getElementById('notify-badge');
    wrapper = document.querySelector('.notification-wrapper');
    const clearBtn = document.querySelector('.notify-action');
    const bellBtn = document.querySelector('.icon-btn .fa-bell'); // Using the icon inside the btn for click or the btn itself

    // Bind Toggle Event
    if (bellBtn) {
        // Find the parent .icon-btn if we selected the icon, or use the btn itself if it has the class
        const btn = bellBtn.closest('.icon-btn');
        if(btn) {
           btn.addEventListener('click', (e) => {
               e.stopPropagation(); // Prevent immediate close
               toggleDropdown();
           });
        }
    }

    // Bind Clear Event
    if (clearBtn) {
        clearBtn.addEventListener('click', () => notificationService.clear());
    }

    // Bind Click Outside
    document.addEventListener('click', (e) => {
        if (dropdown && dropdown.classList.contains('show')) {
            if (!wrapper.contains(e.target)) {
                closeDropdown();
            }
        }
    });

    // Subscribe to Service
    notificationService.subscribe((notifications) => {
        renderList(notifications);
        updateBadge(notifications.length);
    });

    // Demo Initial Data (Optional - mimicking previous behavior)
    // notificationService.add('info', 'System Online', 'Notification system initialized.');
}

function toggleDropdown() {
    if (!dropdown) return;
    dropdown.classList.toggle('show');
}

function closeDropdown() {
    if (!dropdown) return;
    dropdown.classList.remove('show');
}

function updateBadge(count) {
    if (!badge) return;
    if (count > 0) {
        badge.classList.add('active');
        badge.innerText = count > 99 ? '99+' : count;
    } else {
        badge.classList.remove('active');
        badge.innerText = '0';
    }
}

function renderList(notifications) {
    if (!list) return;
    list.innerHTML = '';

    if (notifications.length === 0) {
        list.innerHTML = '<div style="padding:20px; text-align:center; color:var(--slate-400); font-size:12px;">No new notifications</div>';
        return;
    }

    notifications.forEach(note => {
        const item = document.createElement('div');
        item.className = `notify-item ${note.type}`;
        
        const timeStr = note.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const iconClass = note.type === 'success' ? 'fa-check' :
                          note.type === 'error' ? 'fa-times' : 'fa-info';

        item.innerHTML = `
            <div class="notify-icon"><i class="fas ${iconClass}"></i></div>
            <div class="notify-content">
                <div class="notify-title">${note.title}</div>
                <div class="notify-msg">${note.message}</div>
                <div class="notify-time">${timeStr}</div>
            </div>
        `;
        list.appendChild(item);
    });
}
