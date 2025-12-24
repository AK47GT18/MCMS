<?php
/**
 * Project Status Update Modal
 * Change project status
 */
?>

<div class="modal fade" id="projectStatusUpdateModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Update Project Status</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="statusUpdateForm" class="modal-form">
                <div class="modal-body">
                    <input type="hidden" name="project_id" id="projectIdField">
                    
                    <div class="form-group">
                        <label>New Status</label>
                        <select name="status" class="form-control" required>
                            <option value="">Select status</option>
                            <option value="planning">Planning</option>
                            <option value="in_progress">In Progress</option>
                            <option value="paused">Paused</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes" class="form-control" rows="3" placeholder="Add notes about status change..."></textarea>
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
const ProjectStatusUpdateModal = {
    show: function(projectId) {
        document.getElementById('projectIdField').value = projectId;
        ModalManager?.show('projectStatusUpdateModal');
    }
};

document.getElementById('statusUpdateForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const projectId = formData.get('project_id');
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}/status`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Project status updated');
            ModalManager?.hide('projectStatusUpdateModal');
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
