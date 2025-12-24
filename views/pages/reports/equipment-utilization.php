<?php
/**
 * Reports Equipment Utilization Page
 * Equipment usage analysis
 */

$pageTitle = 'Equipment Utilization Report';
$currentPage = 'reports';
$breadcrumbs = [
    ['name' => 'Reports', 'url' => BASE_URL . '/reports'],
    ['name' => 'Equipment Utilization']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>⚙️ Equipment Utilization Report</h1>
    </div>
</div>

<div class="report-container">
    <div class="report-charts">
        <canvas id="utilizationChart"></canvas>
    </div>

    <div class="report-table">
        <h2>Equipment Usage Summary</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Equipment</th>
                    <th>Category</th>
                    <th>Total Hours</th>
                    <th>Active Hours</th>
                    <th>Idle Hours</th>
                    <th>Utilization %</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody id="equipmentBody">
                <tr><td colspan="7" class="text-center">Loading...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadEquipmentUtilizationReport();
});

async function loadEquipmentUtilizationReport() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/reports/equipment-utilization`);
        const data = await response.json();

        if (data.success) {
            displayEquipmentUtilizationReport(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayEquipmentUtilizationReport(data) {
    const tbody = document.getElementById('equipmentBody');
    tbody.innerHTML = '';

    data.equipment.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td>${item.totalHours}</td>
            <td>${item.activeHours}</td>
            <td>${item.idleHours}</td>
            <td>${item.utilization}%</td>
            <td><span class="badge badge-${item.status}">${item.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}
</script>
