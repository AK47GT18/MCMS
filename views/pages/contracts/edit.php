<?php
/**
 * Contracts Edit Page
 * Edit existing contract
 */

$contractId = $_GET['id'] ?? null;
$pageTitle = 'Edit Contract';
$currentPage = 'contracts';
$breadcrumbs = [
    ['name' => 'Contracts', 'url' => BASE_URL . '/contracts'],
    ['name' => 'Edit']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>✏️ Edit Contract</h1>
    </div>
</div>

<div class="form-container">
    <form id="editContractForm" action="<?php echo BASE_URL; ?>/api/v1/contracts/<?php echo $contractId; ?>" method="POST">
        <div class="loading-skeleton"></div>
    </form>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadContractData(<?php echo $contractId; ?>);
});

async function loadContractData(contractId) {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/contracts/${contractId}`);
        const data = await response.json();

        if (data.success) {
            FormModalComponent?.populateForm(
                document.getElementById('editContractForm'),
                data.data
            );
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('Failed to load contract');
    }
}

document.getElementById('editContractForm').addEventListener('submit', async (e) => {
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
            AlertsComponent?.success('Contract updated successfully');
        } else {
            AlertsComponent?.error(data.message || 'Failed to update contract');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
