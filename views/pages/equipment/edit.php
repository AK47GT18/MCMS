<?php
/**
 * Equipment Edit Page
 * Edit equipment details
 */

$equipmentId = $_GET['id'] ?? null;
$pageTitle = 'Edit Equipment';
$currentPage = 'equipment';
$breadcrumbs = [
    ['name' => 'Equipment', 'url' => BASE_URL . '/equipment'],
    ['name' => 'Edit']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>✏️ Edit Equipment</h1>
    </div>
</div>

<div class="form-container">
    <form id="editEquipmentForm" class="equipment-form" action="<?php echo BASE_URL; ?>/api/v1/equipment/<?php echo $equipmentId; ?>" method="POST">
        <div class="loading-skeleton"></div>
    </form>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadEquipmentData(<?php echo $equipmentId; ?>);
});

async function loadEquipmentData(equipmentId) {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/equipment/${equipmentId}`);
        const data = await response.json();

        if (data.success) {
            const equipment = data.data;
            FormModalComponent?.populateForm(
                document.getElementById('editEquipmentForm'),
                equipment
            );
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('Failed to load equipment data');
    }
}

document.getElementById('editEquipmentForm').addEventListener('submit', async (e) => {
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
            AlertsComponent?.success('Equipment updated successfully');
        } else {
            AlertsComponent?.error(data.message || 'Failed to update equipment');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
