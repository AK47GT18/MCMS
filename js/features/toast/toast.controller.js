/**
 * Toast Controller
 * Orchestrates the application logic for Toasts.
 */

import { ToastView } from './toast.view.js';

export class ToastController {
    constructor() {
        this.view = new ToastView();
    }

    addToast(type, title, message, duration) {
        // Validate inputs purely for internal safety
        if (!['success', 'error', 'info', 'warning'].includes(type)) {
            type = 'info';
        }

        const el = this.view.createToastElement(type, title, message);
        this.view.show(el, duration);
    }
}
