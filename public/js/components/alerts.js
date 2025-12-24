/**
 * Alerts Component
 * Handles alert display, dismissal, and animations
 */

const AlertsComponent = (() => {
    const selectors = {
        container: '.alerts-container',
        alert: '.alert',
        closeBtn: '.alert-close',
        alert_success: '.alert-success',
        alert_error: '.alert-error',
        alert_warning: '.alert-warning',
        alert_info: '.alert-info'
    };

    /**
     * Initialize alerts
     */
    const init = () => {
        setupEventListeners();
        autoCloseAlerts();
    };

    /**
     * Setup close button event listeners
     */
    const setupEventListeners = () => {
        document.addEventListener('click', (e) => {
            if (e.target.closest(selectors.closeBtn)) {
                const alert = e.target.closest(selectors.alert);
                closeAlert(alert);
            }
        });
    };

    /**
     * Close alert with fade out animation
     */
    const closeAlert = (alertElement) => {
        if (!alertElement) return;

        alertElement.classList.add('fade-out');
        setTimeout(() => {
            alertElement.remove();
        }, 300);
    };

    /**
     * Auto-close alerts after delay
     */
    const autoCloseAlerts = () => {
        document.querySelectorAll(selectors.alert).forEach((alert) => {
            const isSuccess = alert.classList.contains('alert-success');
            const isInfo = alert.classList.contains('alert-info');
            const delay = (isSuccess || isInfo) ? 5000 : 7000;

            setTimeout(() => {
                closeAlert(alert);
            }, delay);
        });
    };

    /**
     * Show dynamic alert
     */
    const show = (message, type = 'info', title = '') => {
        const container = document.querySelector(selectors.container);
        if (!container) return;

        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <div class="alert-content">
                    ${getIconForType(type)}
                    <div class="alert-message">
                        ${title ? `<strong>${title}</strong><br>` : ''}
                        ${message}
                    </div>
                </div>
                <button type="button" class="alert-close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `;

        const alertElement = document.createElement('div');
        alertElement.innerHTML = alertHtml;
        container.appendChild(alertElement.firstElementChild);

        const newAlert = container.querySelector(`[role="alert"]:last-child`);
        setTimeout(() => closeAlert(newAlert), 5000);
    };

    /**
     * Get icon for alert type
     */
    const getIconForType = (type) => {
        const icons = {
            success: '<span class="alert-icon">✓</span>',
            error: '<span class="alert-icon">✕</span>',
            warning: '<span class="alert-icon">⚠</span>',
            info: '<span class="alert-icon">ℹ</span>'
        };
        return icons[type] || icons.info;
    };

    /**
     * Show success alert
     */
    const success = (message, title = 'Success') => show(message, 'success', title);

    /**
     * Show error alert
     */
    const error = (message, title = 'Error') => show(message, 'error', title);

    /**
     * Show warning alert
     */
    const warning = (message, title = 'Warning') => show(message, 'warning', title);

    /**
     * Show info alert
     */
    const info = (message, title = 'Information') => show(message, 'info', title);

    return {
        init,
        show,
        success,
        error,
        warning,
        info,
        closeAlert
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AlertsComponent.init());
} else {
    AlertsComponent.init();
}
