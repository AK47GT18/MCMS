/**
 * Modals Component
 * Handles modal display and interactions
 */
const ModalsComponent = {
  activeModal: null,

  /**
   * Open modal by ID
   */
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.warn(`Modal not found: ${modalId}`);
      return;
    }

    // Close any existing modal
    if (this.activeModal) {
      this.close(this.activeModal);
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    this.activeModal = modalId;

    // Add click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close(modalId);
      }
    });
  },

  /**
   * Close modal by ID
   */
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
      this.activeModal = null;
    }
  },

  /**
   * Close all modals
   */
  closeAll() {
    if (this.activeModal) {
      this.close(this.activeModal);
    }
  },

  /**
   * Check if modal is open
   */
  isOpen(modalId) {
    const modal = document.getElementById(modalId);
    return modal && modal.classList.contains('show');
  },

  /**
   * Show loading state in modal body
   */
  showLoading(modalId) {
    const modal = document.getElementById(modalId);
    const body = modal?.querySelector('.modal-body');
    
    if (body) {
      body.innerHTML = `
        <div style="text-align: center; padding: 48px;">
          <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: var(--orange); margin-bottom: 16px;"></i>
          <div style="color: var(--slate-400);">Loading...</div>
        </div>
      `;
    }
  },

  /**
   * Show error state in modal body
   */
  showError(modalId, message) {
    const modal = document.getElementById(modalId);
    const body = modal?.querySelector('.modal-body');
    
    if (body) {
      body.innerHTML = `
        <div style="text-align: center; padding: 48px; color: var(--slate-500);">
          <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
          <div style="font-size: 16px; font-weight: 600;">${message}</div>
        </div>
      `;
    }
  }
};

// Initialize modal close buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const modal = this.closest('.modal-overlay');
      if (modal) {
        const modalId = modal.id;
        ModalsComponent.close(modalId);
      }
    });
  });
});
