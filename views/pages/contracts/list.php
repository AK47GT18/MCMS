<?php
/**
 * Contracts - List Page
 * Manage project contracts
 */

$pageTitle = 'Contracts';
$currentPage = 'contracts';
$breadcrumbs = [
    ['name' => 'Contracts', 'icon' => '📜']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📜 Contracts</h1>
        <p>Manage project contracts and agreements</p>
    </div>
    <div class="header-actions">
        <a href="<?php echo BASE_URL; ?>/contracts/create" class="btn btn-primary">
            <span class="icon">➕</span> New Contract
        </a>
    </div>
</div>

<!-- Filters -->
<div class="filters-section">
    <div class="filters-row">
        <div class="filter-group">
            <label>Search</label>
            <input type="text" id="contractSearch" class="form-control" placeholder="Contract name, vendor...">
        </div>
        <div class="filter-group">
            <label>Status</label>
            <select id="statusFilter" class="form-control">
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="terminated">Terminated</option>
            </select>
        </div>
    </div>
</div>

<!-- Contracts Table -->
<div class="table-container">
    <table class="data-table" id="contractsTable">
        <thead>
            <tr>
                <th>Contract No.</th>
                <th>Vendor</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="contractsBody">
            <tr class="skeleton-row">
                <td colspan="8"><div class="loading-skeleton"></div></td>
            </tr>
        </tbody>
    </table>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadContracts();
});

async function loadContracts() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/contracts`);
        const data = await response.json();

        if (data.success) {
            renderContracts(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderContracts(contracts) {
    const tbody = document.getElementById('contractsBody');
    tbody.innerHTML = '';

    contracts.forEach(contract => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${contract.contractNo}</strong></td>
            <td>${contract.vendor}</td>
            <td>${contract.project}</td>
            <td>MWK ${contract.amount.toLocaleString()}</td>
            <td>${new Date(contract.startDate).toLocaleDateString()}</td>
            <td>${new Date(contract.endDate).toLocaleDateString()}</td>
            <td><span class="badge badge-${contract.status}">${contract.status}</span></td>
            <td>
                <a href="<?php echo BASE_URL; ?>/contracts/${contract.id}" class="btn btn-sm btn-info">View</a>
                <button class="btn btn-sm btn-warning" onclick="editContract(${contract.id})">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editContract(id) {
    location.href = `<?php echo BASE_URL; ?>/contracts/${id}/edit`;
}
</script>
