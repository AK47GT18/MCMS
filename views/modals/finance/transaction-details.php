<?php
/**
 * Transaction Details Modal
 * View transaction details
 */
?>

<div class="modal fade" id="transactionDetailsModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Transaction Details</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Type:</strong> <span id="transType" class="badge"></span></p>
                        <p><strong>Amount:</strong> MWK <span id="transAmount"></span></p>
                        <p><strong>Category:</strong> <span id="transCategory"></span></p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Date:</strong> <span id="transDate"></span></p>
                        <p><strong>Status:</strong> <span id="transStatus" class="badge"></span></p>
                        <p><strong>Reference:</strong> <span id="transRef"></span></p>
                    </div>
                </div>
                <hr>
                <p><strong>Project:</strong> <span id="transProject"></span></p>
                <p><strong>Description:</strong> <span id="transDesc"></span></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="editTransBtn">Edit</button>
            </div>
        </div>
    </div>
</div>

<script>
const TransactionDetailsModal = {
    show: async function(transactionId) {
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/finance/transactions/${transactionId}`);
            const data = await response.json();
            
            if (data.success) {
                this.display(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    },
    
    display: function(transaction) {
        document.getElementById('transType').textContent = transaction.type;
        document.getElementById('transType').className = 'badge badge-' + (transaction.type === 'income' ? 'success' : 'danger');
        document.getElementById('transAmount').textContent = transaction.amount.toLocaleString();
        document.getElementById('transCategory').textContent = transaction.category;
        document.getElementById('transDate').textContent = new Date(transaction.date).toLocaleDateString();
        document.getElementById('transStatus').textContent = transaction.status;
        document.getElementById('transRef').textContent = transaction.referenceNo || '-';
        document.getElementById('transProject').textContent = transaction.projectName || '-';
        document.getElementById('transDesc').textContent = transaction.description;
        
        document.getElementById('editTransBtn').onclick = () => {
            location.href = `<?php echo BASE_URL; ?>/finance/transactions/${transaction.id}/edit`;
        };
        
        ModalManager?.show('transactionDetailsModal');
    }
};
</script>
