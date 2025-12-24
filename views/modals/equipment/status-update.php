<?php
/**
 * Equipment Status Update Modal
 * Update equipment status
 */
?>

<div class="modal fade" id="equipmentStatusUpdateModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Update Equipment Status</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="statusUpdateForm" class="modal-form">
                <div class="modal-body">
                    <input type="hidden" name="equipment_id" id="equipmentIdField">
                    
                    <div class="form-group">
                        <label>New Status</label>
                        <select name="status" class="form-control" required>
                            <option value="">Select status</option>
                            <option value="active">Active</option>
                            <option value="in_use">In Use</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Reason</label>
                        <textarea name="reason" class="form-control" rows="3" placeholder="Reason for status change..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary modal-submit">Update Status</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
const EquipmentStatusUpdateModal = {
    show: function(equipmentId) {
        document.getElementById('equipmentIdField').value = equipmentId;
        ModalManager?.show('equipmentStatusUpdateModal');
    }
};

document.getElementById('statusUpdateForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const equipmentId = formData.get('equipment_id');
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/equipment/${equipmentId}/status`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Equipment status updated');
            ModalManager?.hide('equipmentStatusUpdateModal');
            location.reload();
        } else {
            AlertsComponent?.error(data.message || 'Failed to update status');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
