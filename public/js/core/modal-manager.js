/**
 * Modal Manager
 */
const ModalManager = {
  modals: {},

  /**
   * Open modal
   */
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
      
      // Store reference
      this.modals[modalId] = modal;
    }
  },

  /**
   * Close modal
   */
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
      
      // Remove reference
      delete this.modals[modalId];
    }
  },

  /**
   * Close all modals
   */
  closeAll() {
    Object.keys(this.modals).forEach(modalId => {
      this.close(modalId);
    });
  },

  /**
   * Create dynamic modal
   */
  create(title, content, options = {}) {
    const modalId = `modal-${Date.now()}`;
    
    const modalHTML = `
      <div class="modal-overlay" id="${modalId}">
        <div class="modal ${options.size || ''}">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <div class="modal-close" onclick="ModalManager.close('${modalId}')">
              <i class="fas fa-times"></i>
            </div>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.open(modalId);

    return modalId;
  },

  /**
   * Confirm dialog
   */
  confirm(message, onConfirm, onCancel) {
    const content = `<p style="font-size: 14px; color: var(--slate-700);">${message}</p>`;
    const footer = `
      <button class="btn btn-secondary" onclick="ModalManager.closeAndExecute('${Date.now()}', 'cancel')">Cancel</button>
      <button class="btn btn-primary" onclick="ModalManager.closeAndExecute('${Date.now()}', 'confirm')">Confirm</button>
    `;

    const modalId = this.create('Confirm', content, { footer });
    
    // Store callbacks
    this.modals[modalId] = {
      element: document.getElementById(modalId),
      onConfirm,
      onCancel
    };
  },

  /**
   * Alert dialog
   */
  alert(message, type = 'info') {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    const content = `
      <div style="text-align: center; padding: 20px;">
        <i class="fas ${icons[type]}" style="font-size: 48px; color: var(--${type === 'error' ? 'red' : type === 'warning' ? 'amber' : type === 'success' ? 'emerald' : 'blue'}); margin-bottom: 16px;"></i>
        <p style="font-size: 14px; color: var(--slate-700);">${message}</p>
      </div>
    `;
    
    const footer = `<button class="btn btn-primary" onclick="ModalManager.close('${Date.now()}')">OK</button>`;
    
    this.create('Alert', content, { footer, size: 'modal-sm' });
  }
};

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    const modalId = e.target.id;
    ModalManager.close(modalId);
  }
});