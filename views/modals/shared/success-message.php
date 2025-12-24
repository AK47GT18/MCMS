<?php
/**
 * Success Message Modal
 * Display success notifications
 */
?>

<div class="modal fade" id="successModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content modal-success">
            <div class="modal-header">
                <h5 class="modal-title">✅ Success</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <p id="successMessage">Operation completed successfully!</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-success" data-dismiss="modal">OK</button>
            </div>
        </div>
    </div>
</div>

<script>
const SuccessModal = {
    show: function(message, title = 'Success', callback = null) {
        document.querySelector('#successModal .modal-title').textContent = '✅ ' + title;
        document.getElementById('successMessage').textContent = message;
        
        const btn = document.querySelector('#successModal .btn-success');
        btn.onclick = () => {
            ModalManager?.hide('successModal');
            if (callback) {
                callback();
            }
        };
        
        ModalManager?.show('successModal');
    },
    
    showAndRedirect: function(message, redirectUrl, delay = 2000) {
        this.show(message, 'Success', () => {
            setTimeout(() => {
                location.href = redirectUrl;
            }, delay);
        });
    }
};
</script>
