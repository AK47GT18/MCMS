<?php
/**
 * Equipment Maintenance Schedule Page
 * Schedule and track equipment maintenance
 */

$pageTitle = 'Maintenance Schedule';
$currentPage = 'equipment';
$breadcrumbs = [
    ['name' => 'Equipment', 'url' => BASE_URL . '/equipment'],
    ['name' => 'Maintenance']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>🔧 Maintenance Schedule</h1>
        <p>Track and schedule equipment maintenance</p>
    </div>
    <div class="header-actions">
        <button class="btn btn-primary" id="scheduleMaintenanceBtn">
            <span class="icon">➕</span> Schedule Maintenance
        </button>
    </div>
</div>

<div class="maintenance-calendar">
    <div id="maintenanceCalendar"></div>
</div>

<div class="maintenance-list">
    <h2>Upcoming Maintenance</h2>
    <table class="data-table">
        <thead>
            <tr>
                <th>Equipment</th>
                <th>Maintenance Type</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="maintenanceBody">
            <tr><td colspan="6" class="text-center">Loading...</td></tr>
        </tbody>
    </table>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadMaintenanceSchedule();
});

async function loadMaintenanceSchedule() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/equipment/maintenance`);
        const data = await response.json();

        if (data.success) {
            renderMaintenance(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderMaintenance(items) {
    const tbody = document.getElementById('maintenanceBody');
    tbody.innerHTML = '';

    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.equipment}</td>
            <td>${item.type}</td>
            <td>${new Date(item.scheduledDate).toLocaleDateString()}</td>
            <td><span class="badge badge-${item.status}">${item.status}</span></td>
            <td>${item.assignedTo}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewMaintenance(${item.id})">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('scheduleMaintenanceBtn')?.addEventListener('click', () => {
    ModalManager?.show('scheduleMaintenanceModal');
});
</script>
