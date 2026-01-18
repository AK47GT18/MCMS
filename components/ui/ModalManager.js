// ModalManager - Handles centered confirmation and error modals
export class ModalManager {
    constructor() {
        this.createOverlay();
    }

    createOverlay() {
        // Create modal overlay if not exists
        if (!document.getElementById('modal-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'modal-overlay';
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-container" id="modal-container">
                    <div class="modal-content" id="modal-content"></div>
                </div>
            `;
            document.body.appendChild(overlay);

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }
    }

    show(options) {
        // options: { type, title, message, confirmText, cancelText, onConfirm, onCancel }
        const overlay = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');

        const type = options.type || 'info'; // success, error, warning, info, confirm
        const title = options.title || 'Notification';
        const message = options.message || '';
        const confirmText = options.confirmText || 'OK';
        const cancelText = options.cancelText || 'Cancel';
        const showCancel = options.type === 'confirm';

        // Icon and color based on type
        const iconConfig = {
            success: { icon: 'fa-check-circle', color: 'var(--emerald)', bgColor: '#DCFCE7' },
            error: { icon: 'fa-times-circle', color: 'var(--red)', bgColor: '#FEE2E2' },
            warning: { icon: 'fa-exclamation-triangle', color: 'var(--orange)', bgColor: '#FEF3C7' },
            info: { icon: 'fa-info-circle', color: 'var(--blue)', bgColor: '#DBEAFE' },
            confirm: { icon: 'fa-question-circle', color: 'var(--blue)', bgColor: '#DBEAFE' }
        };

        const config = iconConfig[type] || iconConfig.info;

        content.innerHTML = `
            <div class="modal-icon" style="background: ${config.bgColor}; color: ${config.color};">
                <i class="fas ${config.icon}"></i>
            </div>
            <h3 class="modal-title">${title}</h3>
            <p class="modal-message">${message}</p>
            <div class="modal-actions">
                ${showCancel ? `<button class="btn btn-secondary modal-cancel">${cancelText}</button>` : ''}
                <button class="btn ${type === 'error' ? 'btn-danger' : 'btn-primary'} modal-confirm">${confirmText}</button>
            </div>
        `;

        // Add event listeners
        const confirmBtn = content.querySelector('.modal-confirm');
        const cancelBtn = content.querySelector('.modal-cancel');

        confirmBtn?.addEventListener('click', () => {
            if (options.onConfirm) options.onConfirm();
            this.close();
        });

        cancelBtn?.addEventListener('click', () => {
            if (options.onCancel) options.onCancel();
            this.close();
        });

        // Show modal with animation
        overlay.classList.add('active');
        container.classList.add('active');
    }

    success(title, message = '') {
        this.show({ type: 'success', title, message });
    }

    error(title, message = '') {
        this.show({ type: 'error', title, message });
    }

    warning(title, message = '') {
        this.show({ type: 'warning', title, message });
    }

    info(title, message = '') {
        this.show({ type: 'info', title, message });
    }

    confirm(title, message, onConfirm, onCancel) {
        this.show({
            type: 'confirm',
            title,
            message,
            confirmText: 'Yes, Proceed',
            cancelText: 'Cancel',
            onConfirm,
            onCancel
        });
    }

    close() {
        const overlay = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        
        container?.classList.remove('active');
        setTimeout(() => {
            overlay?.classList.remove('active');
        }, 200);
    }
}

// Auto-initialize and expose globally
export const modal = new ModalManager();
if (typeof window !== 'undefined') {
    window.modal = modal;
}
