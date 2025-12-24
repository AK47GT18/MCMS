<?php
/**
 * Finance Edit Transaction Page
 * Edit existing transaction
 */

$transactionId = $_GET['id'] ?? null;
$pageTitle = 'Edit Transaction';
$currentPage = 'finance';
$breadcrumbs = [
    ['name' => 'Finance', 'url' => BASE_URL . '/finance'],
    ['name' => 'Edit Transaction']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>✏️ Edit Transaction</h1>
    </div>
</div>

<div class="form-container">
    <form id="editTransactionForm" action="<?php echo BASE_URL; ?>/api/v1/finance/transactions/<?php echo $transactionId; ?>" method="POST">
        <div class="loading-skeleton"></div>
    </form>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadTransactionData(<?php echo $transactionId; ?>);
});

async function loadTransactionData(transactionId) {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/finance/transactions/${transactionId}`);
        const data = await response.json();

        if (data.success) {
            FormModalComponent?.populateForm(
                document.getElementById('editTransactionForm'),
                data.data
            );
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('Failed to load transaction');
    }
}

document.getElementById('editTransactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(e.target.action, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-HTTP-Method-Override': 'PUT' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Transaction updated successfully');
        } else {
            AlertsComponent?.error(data.message || 'Failed to update transaction');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
