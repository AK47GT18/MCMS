<?php
/**
 * Project Quick View Modal
 * Display project summary
 */
?>

<div class="modal fade" id="projectQuickViewModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="projectTitle">Project Details</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Manager:</strong> <span id="projectManager"></span></p>
                        <p><strong>Status:</strong> <span id="projectStatus" class="badge"></span></p>
                        <p><strong>Budget:</strong> MWK <span id="projectBudget"></span></p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Start Date:</strong> <span id="projectStart"></span></p>
                        <p><strong>End Date:</strong> <span id="projectEnd"></span></p>
                        <p><strong>Progress:</strong> <span id="projectProgress"></span>%</p>
                    </div>
                </div>
                <div class="progress mt-3">
                    <div class="progress-bar" id="projectProgressBar" role="progressbar" style="width: 0%"></div>
                </div>
                <hr>
                <p><strong>Description:</strong></p>
                <p id="projectDescription"></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <a id="projectViewBtn" href="#" class="btn btn-primary">View Full</a>
            </div>
        </div>
    </div>
</div>

<script>
const ProjectQuickViewModal = {
    show: async function(projectId) {
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}`);
            const data = await response.json();
            
            if (data.success) {
                this.display(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    },
    
    display: function(project) {
        document.getElementById('projectTitle').textContent = project.name;
        document.getElementById('projectManager').textContent = project.manager;
        document.getElementById('projectStatus').textContent = project.status;
        document.getElementById('projectStatus').className = 'badge badge-' + project.status;
        document.getElementById('projectBudget').textContent = project.budget.toLocaleString();
        document.getElementById('projectStart').textContent = new Date(project.startDate).toLocaleDateString();
        document.getElementById('projectEnd').textContent = new Date(project.endDate).toLocaleDateString();
        document.getElementById('projectProgress').textContent = project.progress;
        document.getElementById('projectProgressBar').style.width = project.progress + '%';
        document.getElementById('projectDescription').textContent = project.description;
        document.getElementById('projectViewBtn').href = `<?php echo BASE_URL; ?>/projects/${project.id}/view`;
        
        ModalManager?.show('projectQuickViewModal');
    }
};
</script>
