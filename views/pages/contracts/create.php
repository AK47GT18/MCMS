<?php
/**
 * Contracts Create Page
 * Create new project contract
 */

$pageTitle = 'Create Contract';
$currentPage = 'contracts';
$breadcrumbs = [
    ['name' => 'Contracts', 'url' => BASE_URL . '/contracts'],
    ['name' => 'Create']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📄 Create New Contract</h1>
    </div>
</div>

<div class="form-container">
    <form id="createContractForm" action="<?php echo BASE_URL; ?>/api/v1/contracts" method="POST">
        <div class="form-section">
            <h2>Contract Information</h2>
            
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Contract Number <span class="required">*</span></label>
                    <input type="text" name="contract_no" class="form-control" required>
                </div>
                <div class="form-group col-md-6">
                    <label>Project <span class="required">*</span></label>
                    <select name="project_id" class="form-control" required>
                        <option value="">Select project</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Vendor <span class="required">*</span></label>
                    <input type="text" name="vendor" class="form-control" required>
                </div>
                <div class="form-group col-md-6">
                    <label>Contract Amount (MWK) <span class="required">*</span></label>
                    <input type="number" name="amount" class="form-control" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Start Date <span class="required">*</span></label>
                    <input type="date" name="start_date" class="form-control" required>
                </div>
                <div class="form-group col-md-6">
                    <label>End Date <span class="required">*</span></label>
                    <input type="date" name="end_date" class="form-control" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-12">
                    <label>Description</label>
                    <textarea name="description" class="form-control" rows="4"></textarea>
                </div>
            </div>
        </div>

        <div class="form-actions">
            <a href="<?php echo BASE_URL; ?>/contracts" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary">Create Contract</button>
        </div>
    </form>
</div>

<script>
document.getElementById('createContractForm').addEventListener('submit', async (e) => {
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
            AlertsComponent?.success('Contract created successfully');
            setTimeout(() => {
                location.href = '<?php echo BASE_URL; ?>/contracts';
            }, 1500);
        } else {
            AlertsComponent?.error(data.message || 'Failed to create contract');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
