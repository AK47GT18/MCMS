<?php
/**
 * Reject Transaction Modal
 * Reject financial transaction
 */
?>

<div class="modal fade" id="rejectTransactionModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Reject Transaction</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="rejectTransForm" class="modal-form">
                <div class="modal-body">
                    <input type="hidden" name="transaction_id" id="transactionIdField">
                    
                    <div class="alert alert-warning">
                        <strong>Amount to Reject:</strong> MWK <span id="rejectAmount"></span>
                    </div>
                    
                    <div class="form-group">
                        <label>Rejection Reason <span class="required">*</span></label>
                        <textarea name="reason" class="form-control" rows="4" placeholder="Explain why this transaction is being rejected..." required></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-danger modal-submit">Reject</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
const RejectTransactionModal = {
    show: async function(transactionId) {
        document.getElementById('transactionIdField').value = transactionId;
        
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/finance/transactions/${transactionId}`);
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('rejectAmount').textContent = data.data.amount.toLocaleString();
            }
        } catch (error) {
            console.error('Error:', error);
        }
        
        ModalManager?.show('rejectTransactionModal');
    }
};

document.getElementById('rejectTransForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transactionId = formData.get('transaction_id');
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/finance/transactions/${transactionId}/reject`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Transaction rejected');
            ModalManager?.hide('rejectTransactionModal');
            location.reload();
        } else {
            AlertsComponent?.error(data.message || 'Failed to reject transaction');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
