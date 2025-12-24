<?php
/**
 * Contract Quick View Modal
 * Display contract summary
 */
?>

<div class="modal fade" id="contractQuickViewModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="contractNo">Contract</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Vendor:</strong> <span id="contractVendor"></span></p>
                        <p><strong>Status:</strong> <span id="contractStatus" class="badge"></span></p>
                        <p><strong>Amount:</strong> MWK <span id="contractAmount"></span></p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Start Date:</strong> <span id="contractStart"></span></p>
                        <p><strong>End Date:</strong> <span id="contractEnd"></span></p>
                        <p><strong>Project:</strong> <span id="contractProject"></span></p>
                    </div>
                </div>
                <hr>
                <p><strong>Description:</strong></p>
                <p id="contractDesc"></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <a id="contractViewBtn" href="#" class="btn btn-primary">View Full</a>
            </div>
        </div>
    </div>
</div>

<script>
const ContractQuickViewModal = {
    show: async function(contractId) {
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/contracts/${contractId}`);
            const data = await response.json();
            
            if (data.success) {
                this.display(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    },
    
    display: function(contract) {
        document.getElementById('contractNo').textContent = contract.contractNo;
        document.getElementById('contractVendor').textContent = contract.vendor;
        document.getElementById('contractStatus').textContent = contract.status;
        document.getElementById('contractStatus').className = 'badge badge-' + contract.status;
        document.getElementById('contractAmount').textContent = contract.amount.toLocaleString();
        document.getElementById('contractStart').textContent = new Date(contract.startDate).toLocaleDateString();
        document.getElementById('contractEnd').textContent = new Date(contract.endDate).toLocaleDateString();
        document.getElementById('contractProject').textContent = contract.projectName;
        document.getElementById('contractDesc').textContent = contract.description;
        document.getElementById('contractViewBtn').href = `<?php echo BASE_URL; ?>/contracts/${contract.id}/view`;
        
        ModalManager?.show('contractQuickViewModal');
    }
};
</script>
