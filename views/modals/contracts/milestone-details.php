<?php
/**
 * Contract Milestone Details Modal
 * View contract milestone information
 */
?>

<div class="modal fade" id="milestoneDetailsModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="milestoneName">Milestone</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Status:</strong> <span id="milestoneStatus" class="badge"></span></p>
                        <p><strong>Amount:</strong> MWK <span id="milestoneAmount"></span></p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Due Date:</strong> <span id="milestoneDueDate"></span></p>
                        <p><strong>Completion:</strong> <span id="milestoneCompletion"></span>%</p>
                    </div>
                </div>
                <hr>
                <p><strong>Description:</strong></p>
                <p id="milestoneDesc"></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script>
const MilestoneDetailsModal = {
    show: function(milestone) {
        document.getElementById('milestoneName').textContent = milestone.name;
        document.getElementById('milestoneStatus').textContent = milestone.status;
        document.getElementById('milestoneStatus').className = 'badge badge-' + milestone.status;
        document.getElementById('milestoneAmount').textContent = milestone.amount.toLocaleString();
        document.getElementById('milestoneDueDate').textContent = new Date(milestone.dueDate).toLocaleDateString();
        document.getElementById('milestoneCompletion').textContent = milestone.completion;
        document.getElementById('milestoneDesc').textContent = milestone.description;
        
        ModalManager?.show('milestoneDetailsModal');
    }
};
</script>
