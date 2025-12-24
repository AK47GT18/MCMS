<?php
/**
 * Equipment - List Page
 * View and manage equipment
 */

$pageTitle = 'Equipment';
$currentPage = 'equipment';
$breadcrumbs = [
    ['name' => 'Equipment', 'icon' => '⚙️']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>⚙️ Equipment</h1>
        <p>Manage construction equipment and machinery</p>
    </div>
    <div class="header-actions">
        <a href="<?php echo BASE_URL; ?>/equipment/register" class="btn btn-primary">
            <span class="icon">➕</span> Register Equipment
        </a>
    </div>
</div>

<!-- Filters -->
<div class="filters-section">
    <div class="filters-row">
        <div class="filter-group">
            <label>Search</label>
            <input type="text" id="equipmentSearch" class="form-control" placeholder="Equipment name, ID...">
        </div>
        <div class="filter-group">
            <label>Status</label>
            <select id="statusFilter" class="form-control">
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="in-use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
            </select>
        </div>
        <div class="filter-group">
            <label>Category</label>
            <select id="categoryFilter" class="form-control">
                <option value="">All Categories</option>
                <option value="vehicles">Vehicles</option>
                <option value="machinery">Machinery</option>
                <option value="tools">Tools</option>
            </select>
        </div>
    </div>
</div>

<!-- Equipment Table -->
<div class="table-container">
    <table class="data-table" id="equipmentTable">
        <thead>
            <tr>
                <th>Equipment ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Location</th>
                <th>Current Project</th>
                <th>Operator</th>
                <th>Utilization</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="equipmentBody">
            <tr class="skeleton-row">
                <td colspan="9"><div class="loading-skeleton"></div></td>
            </tr>
        </tbody>
    </table>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadEquipment();
});

async function loadEquipment() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/equipment`);
        const data = await response.json();

        if (data.success) {
            renderEquipment(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderEquipment(items) {
    const tbody = document.getElementById('equipmentBody');
    tbody.innerHTML = '';

    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No equipment found</td></tr>';
        return;
    }

    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td><span class="badge badge-${item.status}">${item.status}</span></td>
            <td>${item.location}</td>
            <td>${item.project || 'None'}</td>
            <td>${item.operator || '--'}</td>
            <td>${item.utilization}%</td>
            <td>
                <a href="<?php echo BASE_URL; ?>/equipment/${item.id}" class="btn btn-sm btn-info">View</a>
                <button class="btn btn-sm btn-warning" onclick="editEquipment(${item.id})">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editEquipment(id) {
    location.href = `<?php echo BASE_URL; ?>/equipment/${id}/edit`;
}
</script>
