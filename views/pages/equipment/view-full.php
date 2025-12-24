<?php
/**
 * Equipment View Full Page
 * Complete equipment details
 */

$equipmentId = $_GET['id'] ?? null;
$pageTitle = 'Equipment Details';
$currentPage = 'equipment';
$breadcrumbs = [
    ['name' => 'Equipment', 'url' => BASE_URL . '/equipment'],
    ['name' => 'Details']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1 id="equipmentName">Equipment</h1>
        <p id="equipmentStatus">Loading...</p>
    </div>
    <div class="header-actions">
        <a href="<?php echo BASE_URL; ?>/equipment/<?php echo $equipmentId; ?>/edit" class="btn btn-secondary">Edit</a>
        <button class="btn btn-danger" id="deleteBtn">Delete</button>
    </div>
</div>

<div class="detail-container">
    <div class="detail-section">
        <h2>Equipment Information</h2>
        <div class="detail-grid">
            <div class="detail-item">
                <label>Equipment ID</label>
                <p id="equipmentId">--</p>
            </div>
            <div class="detail-item">
                <label>Category</label>
                <p id="equipmentCategory">--</p>
            </div>
            <div class="detail-item">
                <label>Manufacturer</label>
                <p id="equipmentManufacturer">--</p>
            </div>
            <div class="detail-item">
                <label>Model</label>
                <p id="equipmentModel">--</p>
            </div>
            <div class="detail-item">
                <label>Cost</label>
                <p id="equipmentCost">MWK 0</p>
            </div>
            <div class="detail-item">
                <label>Current Location</label>
                <p id="equipmentLocation">--</p>
            </div>
        </div>
    </div>

    <div class="detail-section">
        <h2>Assignment & Utilization</h2>
        <div class="detail-grid">
            <div class="detail-item">
                <label>Current Project</label>
                <p id="currentProject">None</p>
            </div>
            <div class="detail-item">
                <label>Operator</label>
                <p id="equipmentOperator">--</p>
            </div>
            <div class="detail-item">
                <label>Utilization</label>
                <p id="equipmentUtilization">0%</p>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadEquipmentDetails(<?php echo $equipmentId; ?>);
});

async function loadEquipmentDetails(equipmentId) {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/equipment/${equipmentId}`);
        const data = await response.json();

        if (data.success) {
            const equipment = data.data;
            displayEquipmentDetails(equipment);
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('Failed to load equipment details');
    }
}

function displayEquipmentDetails(equipment) {
    document.getElementById('equipmentName').textContent = equipment.name;
    document.getElementById('equipmentId').textContent = equipment.equipment_id;
    document.getElementById('equipmentCategory').textContent = equipment.category;
    document.getElementById('equipmentManufacturer').textContent = equipment.manufacturer || '--';
    document.getElementById('equipmentModel').textContent = equipment.model || '--';
    document.getElementById('equipmentCost').textContent = 'MWK ' + (equipment.cost || 0).toLocaleString();
    document.getElementById('equipmentLocation').textContent = equipment.location || '--';
    document.getElementById('currentProject').textContent = equipment.project || 'None';
    document.getElementById('equipmentOperator').textContent = equipment.operator || '--';
    document.getElementById('equipmentUtilization').textContent = (equipment.utilization || 0) + '%';
}

document.getElementById('deleteBtn')?.addEventListener('click', () => {
    ModalManager?.showConfirm(
        'Delete Equipment',
        'Are you sure you want to delete this equipment?',
        async () => {
            try {
                const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/equipment/<?php echo $equipmentId; ?>`, {
                    method: 'DELETE',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();
                if (data.success) {
                    AlertsComponent?.success('Equipment deleted');
                    setTimeout(() => location.href = '<?php echo BASE_URL; ?>/equipment', 1500);
                }
            } catch (error) {
                AlertsComponent?.error('Failed to delete equipment');
            }
        }
    );
});
</script>
