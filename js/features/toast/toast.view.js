/**
 * Toast View
 * Handles DOM manipulation for toasts.
 * Strictly presentational.
 */

export class ToastView {
    constructor() {
        this.container = null;
        this.initContainer();
    }

    initContainer() {
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    createToastElement(type, title, message) {
        const el = document.createElement('div');
        el.className = `toast-item toast-${type}`;
        
        const iconMap = {
            success: 'check',
            error: 'times',
            info: 'info',
            warning: 'exclamation'
        };

        el.innerHTML = `
            <div class="toast-icon"><i class="fas fa-${iconMap[type] || 'info'}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;

        return el;
    }

    show(el, duration = 5000) {
        this.container.appendChild(el);
        
        // Force reflow
        void el.offsetWidth;
        
        requestAnimationFrame(() => {
            el.classList.add('show');
        });

        // Setup removal
        const remove = () => {
            el.classList.remove('show');
            el.classList.add('leaving');
            el.addEventListener('transitionend', () => el.remove());
        };

        const closeBtn = el.querySelector('.toast-close');
        if(closeBtn) closeBtn.onclick = remove;

        if (duration > 0) {
            setTimeout(remove, duration);
        }
    }
}
