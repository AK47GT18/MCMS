<?php
/**
 * Commitments Modal
 * Manage project commitments and deadlines
 */
?>

<div class="modal fade" id="commitmentsModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Project Commitments</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="commitments-list" id="commitmentsList">
                    <!-- Commitments loaded dynamically -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script>
const CommitmentsModal = {
    show: async function(projectId) {
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}/commitments`);
            const data = await response.json();
            
            if (data.success) {
                this.renderCommitments(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    },
    
    renderCommitments: function(commitments) {
        const list = document.getElementById('commitmentsList');
        list.innerHTML = '';
        
        if (!commitments.length) {
            list.innerHTML = '<p class="text-center">No commitments</p>';
            return;
        }
        
        commitments.forEach(commitment => {
            const item = document.createElement('div');
            item.className = 'commitment-item';
            item.innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <h6>${commitment.title}</h6>
                        <p class="text-muted">${commitment.description}</p>
                    </div>
                    <div class="col-md-4 text-right">
                        <p><strong>Due:</strong> ${new Date(commitment.dueDate).toLocaleDateString()}</p>
                        <span class="badge badge-${commitment.status}">${commitment.status}</span>
                    </div>
                </div>
            `;
            list.appendChild(item);
        });
        
        ModalManager?.show('commitmentsModal');
    }
};
</script>
