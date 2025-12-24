<?php
/**
 * Contracts View Full Page
 * Complete contract details
 */

$contractId = $_GET['id'] ?? null;
$pageTitle = 'Contract Details';
$currentPage = 'contracts';
$breadcrumbs = [
    ['name' => 'Contracts', 'url' => BASE_URL . '/contracts'],
    ['name' => 'Details']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1 id="contractTitle">Contract</h1>
    </div>
    <div class="header-actions">
        <a href="<?php echo BASE_URL; ?>/contracts/<?php echo $contractId; ?>/edit" class="btn btn-secondary">Edit</a>
        <button class="btn btn-danger" id="deleteBtn">Delete</button>
    </div>
</div>

<div class="detail-container" id="contractContainer">
    <div class="loading-skeleton"></div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadContractDetails(<?php echo $contractId; ?>);
});

async function loadContractDetails(contractId) {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/contracts/${contractId}`);
        const data = await response.json();

        if (data.success) {
            displayContractDetails(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('Failed to load contract');
    }
}

function displayContractDetails(contract) {
    document.getElementById('contractTitle').textContent = contract.contractNo;
    
    const container = document.getElementById('contractContainer');
    container.innerHTML = `
        <div class="detail-section">
            <h2>Contract Information</h2>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Contract Number</label>
                    <p>${contract.contractNo}</p>
                </div>
                <div class="detail-item">
                    <label>Vendor</label>
                    <p>${contract.vendor}</p>
                </div>
                <div class="detail-item">
                    <label>Project</label>
                    <p>${contract.projectName}</p>
                </div>
                <div class="detail-item">
                    <label>Amount</label>
                    <p>MWK ${contract.amount.toLocaleString()}</p>
                </div>
                <div class="detail-item">
                    <label>Start Date</label>
                    <p>${new Date(contract.startDate).toLocaleDateString()}</p>
                </div>
                <div class="detail-item">
                    <label>End Date</label>
                    <p>${new Date(contract.endDate).toLocaleDateString()}</p>
                </div>
                <div class="detail-item">
                    <label>Status</label>
                    <p><span class="badge badge-${contract.status}">${contract.status}</span></p>
                </div>
            </div>
        </div>

        ${contract.description ? `
        <div class="detail-section">
            <h2>Description</h2>
            <p>${contract.description}</p>
        </div>
        ` : ''}
    `;
}

document.getElementById('deleteBtn')?.addEventListener('click', () => {
    ModalManager?.showConfirm(
        'Delete Contract',
        'Are you sure you want to delete this contract?',
        async () => {
            try {
                const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/contracts/<?php echo $contractId; ?>`, {
                    method: 'DELETE',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();
                if (data.success) {
                    AlertsComponent?.success('Contract deleted');
                    setTimeout(() => location.href = '<?php echo BASE_URL; ?>/contracts', 1500);
                }
            } catch (error) {
                AlertsComponent?.error('Failed to delete contract');
            }
        }
    );
});
</script>
