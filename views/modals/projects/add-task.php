<?php
/**
 * Add Task to Project Modal
 * Create new task in project
 */
?>

<div class="modal fade" id="addTaskModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Add Task</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="addTaskForm" class="modal-form">
                <div class="modal-body">
                    <input type="hidden" name="project_id" id="projectIdField">
                    
                    <div class="form-group">
                        <label>Task Name</label>
                        <input type="text" name="name" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" class="form-control" rows="3"></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Assigned To</label>
                            <select name="assigned_to" class="form-control" required>
                                <option value="">Select team member</option>
                            </select>
                        </div>
                        <div class="form-group col-md-6">
                            <label>Priority</label>
                            <select name="priority" class="form-control">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Due Date</label>
                            <input type="date" name="due_date" class="form-control" required>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary modal-submit">Add Task</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
const AddTaskModal = {
    show: function(projectId) {
        document.getElementById('projectIdField').value = projectId;
        ModalManager?.show('addTaskModal');
    }
};

document.getElementById('addTaskForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/tasks`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Task added successfully');
            ModalManager?.hide('addTaskModal');
            location.reload();
        } else {
            AlertsComponent?.error(data.message || 'Failed to add task');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
