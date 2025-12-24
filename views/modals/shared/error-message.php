<?php
/**
 * Error Message Modal
 * Display error notifications
 */
?>

<div class="modal fade" id="errorModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content modal-error">
            <div class="modal-header">
                <h5 class="modal-title">❌ Error</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <p id="errorMessage">An error occurred. Please try again.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script>
const ErrorModal = {
    show: function(message, title = 'Error') {
        document.querySelector('#errorModal .modal-title').textContent = '❌ ' + title;
        document.getElementById('errorMessage').textContent = message;
        ModalManager?.show('errorModal');
    },
    
    showError: function(error) {
        let message = 'An unexpected error occurred';
        
        if (typeof error === 'string') {
            message = error;
        } else if (error.message) {
            message = error.message;
        } else if (error.response?.data?.message) {
            message = error.response.data.message;
        }
        
        this.show(message);
    }
};
</script>
