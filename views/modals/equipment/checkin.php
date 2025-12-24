<?php
/**
 * Equipment Checkin Modal
 * Return equipment to storage
 */
?>

<div class="modal fade" id="equipmentCheckinModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Check In Equipment</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="checkinForm" class="modal-form">
                <div class="modal-body">
                    <input type="hidden" name="equipment_id" id="equipmentIdField">
                    
                    <div class="form-group">
                        <label>Condition</label>
                        <select name="condition" class="form-control" required>
                            <option value="">Select condition</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor - Needs Repair</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Operating Hours</label>
                        <input type="number" name="hours" class="form-control" step="0.1" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Return Notes</label>
                        <textarea name="notes" class="form-control" rows="3" placeholder="Damage, repairs needed, etc..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary modal-submit">Check In</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
const EquipmentCheckinModal = {
    show: function(equipmentId) {
        document.getElementById('equipmentIdField').value = equipmentId;
        ModalManager?.show('equipmentCheckinModal');
    }
};

document.getElementById('checkinForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/equipment/checkin`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Equipment checked in');
            ModalManager?.hide('equipmentCheckinModal');
            location.reload();
        } else {
            AlertsComponent?.error(data.message || 'Failed to check in equipment');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
