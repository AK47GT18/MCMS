<?php
/**
 * Equipment Register Page
 * Register new equipment to the system
 */

$pageTitle = 'Register Equipment';
$currentPage = 'equipment';
$breadcrumbs = [
    ['name' => 'Equipment', 'url' => BASE_URL . '/equipment'],
    ['name' => 'Register']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>➕ Register New Equipment</h1>
        <p>Add equipment to the system</p>
    </div>
</div>

<div class="form-container">
    <form id="registerEquipmentForm" class="equipment-form" action="<?php echo BASE_URL; ?>/api/v1/equipment" method="POST">
        <div class="form-section">
            <h2>Equipment Information</h2>
            
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Equipment Name <span class="required">*</span></label>
                    <input type="text" name="name" class="form-control" required>
                </div>
                <div class="form-group col-md-6">
                    <label>Equipment ID <span class="required">*</span></label>
                    <input type="text" name="equipment_id" class="form-control" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Category <span class="required">*</span></label>
                    <select name="category" class="form-control" required>
                        <option value="">Select category</option>
                        <option value="vehicles">Vehicles</option>
                        <option value="machinery">Machinery</option>
                        <option value="tools">Tools</option>
                    </select>
                </div>
                <div class="form-group col-md-6">
                    <label>Status <span class="required">*</span></label>
                    <select name="status" class="form-control" required>
                        <option value="available">Available</option>
                        <option value="in-use">In Use</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Manufacturer</label>
                    <input type="text" name="manufacturer" class="form-control">
                </div>
                <div class="form-group col-md-6">
                    <label>Model</label>
                    <input type="text" name="model" class="form-control">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Acquisition Date</label>
                    <input type="date" name="acquisition_date" class="form-control">
                </div>
                <div class="form-group col-md-6">
                    <label>Cost (MWK)</label>
                    <input type="number" name="cost" class="form-control">
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2>Location & Assignment</h2>
            
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Current Location</label>
                    <input type="text" name="location" class="form-control">
                </div>
                <div class="form-group col-md-6">
                    <label>Assigned Project</label>
                    <select name="project_id" class="form-control">
                        <option value="">None</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Operator/Coordinator</label>
                    <select name="operator_id" class="form-control">
                        <option value="">Select operator</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="form-actions">
            <a href="<?php echo BASE_URL; ?>/equipment" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary">Register Equipment</button>
        </div>
    </form>
</div>

<script>
document.getElementById('registerEquipmentForm').addEventListener('submit', async (e) => {
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
            AlertsComponent?.success('Equipment registered successfully');
            setTimeout(() => {
                location.href = '<?php echo BASE_URL; ?>/equipment';
            }, 1500);
        } else {
            AlertsComponent?.error(data.message || 'Failed to register equipment');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
