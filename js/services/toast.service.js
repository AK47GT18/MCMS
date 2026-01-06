/**
 * Toast Service
 * Public API for the application to show toasts.
 * Singleton instance.
 */

import { ToastController } from '../features/toast/toast.controller.js';

class ToastService {
    constructor() {
        this.controller = new ToastController();
    }

    success(title, message, duration = 5000) {
        this.controller.addToast('success', title, message, duration);
    }

    error(title, message, duration = 5000) {
        this.controller.addToast('error', title, message, duration);
    }

    info(title, message, duration = 5000) {
        this.controller.addToast('info', title, message, duration);
    }

    warning(title, message, duration = 5000) {
        this.controller.addToast('warning', title, message, duration);
    }

    /**
     * Legacy support method to ease refactoring
     * @param {string} type 
     * @param {string} title 
     * @param {string} message 
     */
    add(type, title, message) {
        this.controller.addToast(type, title, message);
    }
}

// Export singleton
export const toastService = new ToastService();

// Default export for flexibility
export default toastService;
