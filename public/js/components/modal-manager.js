/**
 * Modal Manager Component
 * Enhanced modal handling with show, hide, and utility methods
 */

const ModalManager = (() => {
    const selectors = {
        modal: '.modal',
        backdrop: '.modal-backdrop',
        closeBtn: '.modal-close, [data-dismiss="modal"]',
        confirmBtn: '#confirmBtn'
    };

    const modals = new Map();

    /**
     * Initialize modal manager
     */
    const init = () => {
        setupEventListeners();
        cacheModals();
    };

    /**
     * Cache all modals on page
     */
    const cacheModals = () => {
        document.querySelectorAll(selectors.modal).forEach((modal) => {
            modals.set(modal.id, modal);
        });
    };

    /**
     * Setup global event listeners
     */
    const setupEventListeners = () => {
        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                const backdrop = e.target.getAttribute('data-backdrop');
                if (backdrop !== 'static') {
                    hide(e.target.id);
                }
            }
        });

        // Close button
        document.addEventListener('click', (e) => {
            const closeBtn = e.target.closest(selectors.closeBtn);
            if (closeBtn) {
                const modal = closeBtn.closest(selectors.modal);
                if (modal) hide(modal.id);
            }
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector(`${selectors.modal}.show`);
                if (activeModal && activeModal.getAttribute('data-keyboard') !== 'false') {
                    hide(activeModal.id);
                }
            }
        });

        // Confirm button handler
        document.addEventListener('click', (e) => {
            if (e.target.id === 'confirmBtn') {
                handleConfirm(e.target);
            }
        });
    };

    /**
     * Show modal by ID
     */
    const show = (modalId) => {
        const modal = modals.get(modalId) || document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal ${modalId} not found`);
            return;
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Add show class
        modal.classList.add('show');
        modal.style.display = 'block';

        // Create and add backdrop
        createBackdrop();

        // Trigger animation
        setTimeout(() => {
            modal.classList.add('fade-in');
        }, 10);
    };

    /**
     * Hide modal by ID
     */
    const hide = (modalId) => {
        const modal = modals.get(modalId) || document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('fade-in');
        modal.classList.remove('show');
        modal.style.display = 'none';

        // Remove backdrop
        removeBackdrop();

        // Restore body scroll
        document.body.style.overflow = '';
    };

    /**
     * Hide all modals
     */
    const hideAll = () => {
        modals.forEach((modal) => {
            hide(modal.id);
        });
    };

    /**
     * Toggle modal visibility
     */
    const toggle = (modalId) => {
        const modal = modals.get(modalId) || document.getElementById(modalId);
        if (!modal) return;

        if (modal.classList.contains('show')) {
            hide(modalId);
        } else {
            show(modalId);
        }
    };

    /**
     * Create backdrop overlay
     */
    const createBackdrop = () => {
        let backdrop = document.querySelector(selectors.backdrop);
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
        }
    };

    /**
     * Remove backdrop overlay
     */
    const removeBackdrop = () => {
        const backdrop = document.querySelector(selectors.backdrop);
        if (backdrop) {
            backdrop.classList.remove('show');
            setTimeout(() => {
                backdrop.remove();
            }, 300);
        }
    };

    /**
     * Handle confirmation action
     */
    const handleConfirm = (btn) => {
        const action = btn.getAttribute('data-action');
        if (!action) return;

        // Check if it's a URL or callback
        if (action.startsWith('http://') || action.startsWith('https://') || action.startsWith('/')) {
            window.location.href = action;
        } else if (typeof window[action] === 'function') {
            window[action]();
        }

        // Hide modal
        const modal = btn.closest(selectors.modal);
        if (modal) hide(modal.id);
    };

    /**
     * Show confirmation modal
     */
    const showConfirm = (title, message, onConfirm, options = {}) => {
        const confirmId = options.id || 'confirmModal';
        const modal = document.getElementById(confirmId);

        if (!modal) {
            console.warn(`Confirmation modal ${confirmId} not found`);
            return;
        }

        // Update modal content
        const titleEl = modal.querySelector('.modal-title');
        const messageEl = modal.querySelector('.confirm-message');
        const confirmBtn = modal.querySelector(selectors.confirmBtn);

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        // Set confirm action
        if (typeof onConfirm === 'function') {
            confirmBtn?.setAttribute('data-action', 'window.__confirmCallback');
            window.__confirmCallback = () => {
                onConfirm();
                hide(confirmId);
            };
        } else if (typeof onConfirm === 'string') {
            confirmBtn?.setAttribute('data-action', onConfirm);
        }

        // Update button text if provided
        if (options.confirmText && confirmBtn) {
            confirmBtn.textContent = options.confirmText;
        }

        // Show modal
        show(confirmId);
    };

    /**
     * Show loading modal
     */
    const showLoading = (title = 'Processing', message = 'Please wait...', options = {}) => {
        const loadingId = options.id || 'loadingModal';
        const modal = document.getElementById(loadingId);

        if (!modal) {
            console.warn(`Loading modal ${loadingId} not found`);
            return;
        }

        // Update content
        const titleEl = modal.querySelector('.modal-title');
        const messageEl = modal.querySelector('.loading-message');

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        show(loadingId);
    };

    /**
     * Hide loading modal
     */
    const hideLoading = (modalId = 'loadingModal') => {
        hide(modalId);
    };

    /**
     * Check if modal is visible
     */
    const isVisible = (modalId) => {
        const modal = modals.get(modalId) || document.getElementById(modalId);
        return modal ? modal.classList.contains('show') : false;
    };

    return {
        init,
        show,
        hide,
        hideAll,
        toggle,
        showConfirm,
        showLoading,
        hideLoading,
        isVisible,
        createBackdrop,
        removeBackdrop
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ModalManager.init());
} else {
    ModalManager.init();
}
