<?php
/**
 * Upload Contract Document Modal
 * Upload documents to contract
 */
?>

<div class="modal fade" id="uploadDocumentModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Upload Document</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="uploadDocForm" class="modal-form">
                <div class="modal-body">
                    <input type="hidden" name="contract_id" id="contractIdField">
                    
                    <div class="form-group">
                        <label>Document Type</label>
                        <select name="type" class="form-control" required>
                            <option value="">Select type</option>
                            <option value="agreement">Agreement</option>
                            <option value="terms">Terms & Conditions</option>
                            <option value="invoice">Invoice</option>
                            <option value="receipt">Receipt</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>File</label>
                        <input type="file" name="file" class="form-control" required accept=".pdf,.doc,.docx,.xls,.xlsx">
                    </div>
                    
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" class="form-control" rows="2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary modal-submit">Upload</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
const UploadDocumentModal = {
    show: function(contractId) {
        document.getElementById('contractIdField').value = contractId;
        ModalManager?.show('uploadDocumentModal');
    }
};

document.getElementById('uploadDocForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contractId = formData.get('contract_id');
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/contracts/${contractId}/documents`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Document uploaded');
            ModalManager?.hide('uploadDocumentModal');
            location.reload();
        } else {
            AlertsComponent?.error(data.message || 'Failed to upload document');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
