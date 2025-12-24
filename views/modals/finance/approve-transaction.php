<?php
/**
 * Approve Transaction Modal
 * Approve financial transaction
 */
?>

<div class="modal fade" id="approveTransactionModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Approve Transaction</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="approveTransForm" class="modal-form">
                <div class="modal-body">
                    <input type="hidden" name="transaction_id" id="transactionIdField">
                    
                    <div class="alert alert-info">
                        <strong>Amount to Approve:</strong> MWK <span id="approveAmount"></span>
                    </div>
                    
                    <div class="form-group">
                        <label>Approval Notes</label>
                        <textarea name="notes" class="form-control" rows="3" placeholder="Approval comments..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success modal-submit">Approve</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
const ApproveTransactionModal = {
    show: async function(transactionId) {
        document.getElementById('transactionIdField').value = transactionId;
        
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/finance/transactions/${transactionId}`);
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('approveAmount').textContent = data.data.amount.toLocaleString();
            }
        } catch (error) {
            console.error('Error:', error);
        }
        
        ModalManager?.show('approveTransactionModal');
    }
};

document.getElementById('approveTransForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transactionId = formData.get('transaction_id');
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/finance/transactions/${transactionId}/approve`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Transaction approved');
            ModalManager?.hide('approveTransactionModal');
            location.reload();
        } else {
            AlertsComponent?.error(data.message || 'Failed to approve transaction');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
