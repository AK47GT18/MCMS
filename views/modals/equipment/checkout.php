<?php
/**
 * Equipment Checkout Modal
 * Check out equipment from storage
 */
?>

<div class="modal fade" id="equipmentCheckoutModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Check Out Equipment</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="checkoutForm" class="modal-form">
                <div class="modal-body">
                    <input type="hidden" name="equipment_id" id="equipmentIdField">
                    
                    <div class="form-group">
                        <label>Assigned To</label>
                        <select name="assigned_to" class="form-control" required>
                            <option value="">Select person/team</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Project</label>
                        <select name="project_id" class="form-control" required>
                            <option value="">Select project</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Expected Return Date</label>
                        <input type="date" name="expected_return_date" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes" class="form-control" rows="3" placeholder="Condition, notes, etc..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary modal-submit">Check Out</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
const EquipmentCheckoutModal = {
    show: function(equipmentId) {
        document.getElementById('equipmentIdField').value = equipmentId;
        ModalManager?.show('equipmentCheckoutModal');
    }
};

document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/equipment/checkout`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Equipment checked out');
            ModalManager?.hide('equipmentCheckoutModal');
            location.reload();
        } else {
            AlertsComponent?.error(data.message || 'Failed to check out equipment');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
