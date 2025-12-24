<?php
/**
 * Finance Create Transaction Page
 * Record new financial transaction
 */

$pageTitle = 'Create Transaction';
$currentPage = 'finance';
$breadcrumbs = [
    ['name' => 'Finance', 'url' => BASE_URL . '/finance'],
    ['name' => 'Create Transaction']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>💳 Create Transaction</h1>
        <p>Record a new financial transaction</p>
    </div>
</div>

<div class="form-container">
    <form id="createTransactionForm" action="<?php echo BASE_URL; ?>/api/v1/finance/transactions" method="POST">
        <div class="form-section">
            <h2>Transaction Details</h2>
            
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Transaction Type <span class="required">*</span></label>
                    <select name="type" class="form-control" required>
                        <option value="">Select type</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>
                <div class="form-group col-md-6">
                    <label>Date <span class="required">*</span></label>
                    <input type="date" name="date" class="form-control" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Amount (MWK) <span class="required">*</span></label>
                    <input type="number" name="amount" class="form-control" step="0.01" required>
                </div>
                <div class="form-group col-md-6">
                    <label>Category <span class="required">*</span></label>
                    <select name="category" class="form-control" required>
                        <option value="">Select category</option>
                        <option value="salary">Salary</option>
                        <option value="materials">Materials</option>
                        <option value="equipment">Equipment</option>
                        <option value="labor">Labor</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-12">
                    <label>Description <span class="required">*</span></label>
                    <textarea name="description" class="form-control" rows="3" required></textarea>
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2>Project & Approval</h2>
            
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Project <span class="required">*</span></label>
                    <select name="project_id" class="form-control" required>
                        <option value="">Select project</option>
                    </select>
                </div>
                <div class="form-group col-md-6">
                    <label>Reference No.</label>
                    <input type="text" name="reference_no" class="form-control" placeholder="Invoice, Receipt, etc.">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Approval Required</label>
                    <input type="checkbox" name="requires_approval"> Yes, this requires approval
                </div>
            </div>
        </div>

        <div class="form-actions">
            <a href="<?php echo BASE_URL; ?>/finance" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary">Create Transaction</button>
        </div>
    </form>
</div>

<script>
document.getElementById('createTransactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(e.target.action, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Transaction created successfully');
            setTimeout(() => {
                location.href = '<?php echo BASE_URL; ?>/finance';
            }, 1500);
        } else {
            AlertsComponent?.error(data.message || 'Failed to create transaction');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
