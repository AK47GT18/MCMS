<?php
/**
 * Delete Confirmation Modal
 * Reusable delete confirmation dialog
 */
?>

<div class="modal fade" id="deleteConfirmModal" tabindex="-1">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">⚠️ Confirm Delete</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <p id="deleteConfirmMessage">Are you sure you want to delete this item?</p>
                <p class="text-muted small">This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="deleteConfirmBtn">Delete</button>
            </div>
        </div>
    </div>
</div>

<script>
const DeleteConfirmModal = {
    show: function(itemName, callback) {
        document.getElementById('deleteConfirmMessage').textContent = `Are you sure you want to delete "${itemName}"?`;
        
        const btn = document.getElementById('deleteConfirmBtn');
        btn.onclick = async () => {
            if (callback) {
                await callback();
            }
            ModalManager?.hide('deleteConfirmModal');
        };
        
        ModalManager?.show('deleteConfirmModal');
    }
};
</script>
