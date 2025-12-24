<?php
/**
 * Loading Spinner Modal
 * Display loading state
 */
?>

<div class="modal fade" id="loadingSpinnerModal" tabindex="-1" data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-body text-center">
                <div class="spinner-container">
                    <div class="spinner">
                        <div class="spinner-border" role="status">
                            <span class="sr-only">Loading...</span>
                        </div>
                    </div>
                    <p id="loadingMessage" class="mt-3">Please wait...</p>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
const LoadingSpinnerModal = {
    show: function(message = 'Loading...') {
        document.getElementById('loadingMessage').textContent = message;
        ModalManager?.show('loadingSpinnerModal', { backdrop: 'static', keyboard: false });
    },
    
    hide: function() {
        ModalManager?.hide('loadingSpinnerModal');
    },
    
    updateMessage: function(message) {
        document.getElementById('loadingMessage').textContent = message;
    }
};

// Override ModalManager's show/hide for loading modal with backdrop settings
const originalShow = ModalManager?.show;
if (originalShow) {
    ModalManager.show = function(modalId, options = {}) {
        if (modalId === 'loadingSpinnerModal') {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.setAttribute('data-backdrop', 'static');
                modal.setAttribute('data-keyboard', 'false');
            }
        }
        return originalShow.call(this, modalId, options);
    };
}
</script>
