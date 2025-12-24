<?php
/**
 * Assign Team to Project Modal
 * Assign team members to project
 */
?>

<div class="modal fade" id="assignTeamModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Assign Team Members</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="assignTeamForm" class="modal-form">
                <div class="modal-body">
                    <input type="hidden" name="project_id" id="projectIdField">
                    
                    <div class="form-group">
                        <label>Select Team Members</label>
                        <div id="teamMembersList" class="team-members-list">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary modal-submit">Assign Team</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
const AssignTeamModal = {
    show: async function(projectId) {
        document.getElementById('projectIdField').value = projectId;
        
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/users?role=supervisor`);
            const data = await response.json();
            
            if (data.success) {
                this.renderTeamList(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        
        ModalManager?.show('assignTeamModal');
    },
    
    renderTeamList: function(users) {
        const list = document.getElementById('teamMembersList');
        list.innerHTML = '';
        
        users.forEach(user => {
            const checkbox = document.createElement('div');
            checkbox.className = 'form-check';
            checkbox.innerHTML = `
                <input type="checkbox" name="user_ids" value="${user.id}" id="user_${user.id}" class="form-check-input">
                <label class="form-check-label" for="user_${user.id}">
                    ${user.fullname} (${user.role})
                </label>
            `;
            list.appendChild(checkbox);
        });
    }
};

document.getElementById('assignTeamForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const projectId = formData.get('project_id');
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}/assign-team`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Team assigned successfully');
            ModalManager?.hide('assignTeamModal');
            location.reload();
        } else {
            AlertsComponent?.error(data.message || 'Failed to assign team');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
