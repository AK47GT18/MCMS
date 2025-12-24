<?php
/**
 * Task Complete Modal
 * Mark task as complete
 */
?>

<div class="modal fade" id="taskCompleteModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Mark Task as Complete</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="taskCompleteForm" class="modal-form">
                <div class="modal-body">
                    <input type="hidden" name="task_id" id="taskIdField">
                    
                    <div class="form-group">
                        <label>Completion Notes</label>
                        <textarea name="notes" class="form-control" rows="4" placeholder="Add any notes about task completion..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Completion Percentage</label>
                        <input type="range" name="completion_percentage" class="form-control-range" min="0" max="100" value="100" id="completionRange">
                        <small id="completionValue">100%</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary modal-submit">Mark Complete</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
const TaskCompleteModal = {
    show: function(taskId) {
        document.getElementById('taskIdField').value = taskId;
        ModalManager?.show('taskCompleteModal');
    }
};

document.getElementById('completionRange')?.addEventListener('input', (e) => {
    document.getElementById('completionValue').textContent = e.target.value + '%';
});

document.getElementById('taskCompleteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const taskId = formData.get('task_id');
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/tasks/${taskId}/complete`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Task marked as complete');
            ModalManager?.hide('taskCompleteModal');
            location.reload();
        } else {
            AlertsComponent?.error(data.message || 'Failed to mark task as complete');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
