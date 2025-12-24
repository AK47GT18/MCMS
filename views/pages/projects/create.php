<?php
/**
 * Projects - Create Page
 * Form to create new project
 */

$pageTitle = 'Create Project';
$currentPage = 'projects';
$breadcrumbs = [
    ['name' => 'Projects', 'url' => BASE_URL . '/projects'],
    ['name' => 'Create']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>➕ Create New Project</h1>
        <p>Add a new construction project to the system</p>
    </div>
</div>

<div class="form-container">
    <form id="createProjectForm" class="project-form" action="<?php echo BASE_URL; ?>/api/v1/projects" method="POST">
        <div class="form-section">
            <h2>Basic Information</h2>
            
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Project Name <span class="required">*</span></label>
                    <input type="text" name="name" class="form-control" placeholder="Enter project name" required>
                </div>
                <div class="form-group col-md-6">
                    <label>Project Code <span class="required">*</span></label>
                    <input type="text" name="code" class="form-control" placeholder="e.g., PROJ-001" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-12">
                    <label>Description</label>
                    <textarea name="description" class="form-control" rows="4" placeholder="Project description..."></textarea>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Location <span class="required">*</span></label>
                    <input type="text" name="location" class="form-control" placeholder="Project location" required>
                </div>
                <div class="form-group col-md-6">
                    <label>Project Type <span class="required">*</span></label>
                    <select name="type" class="form-control" required>
                        <option value="">Select type</option>
                        <option value="construction">Construction</option>
                        <option value="renovation">Renovation</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2>Timeline & Budget</h2>
            
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
                <div class="form-group col-md-6">
                    <label>Budget Amount (MWK) <span class="required">*</span></label>
                    <input type="number" name="budget" class="form-control" placeholder="0.00" required>
                </div>
                <div class="form-group col-md-6">
                    <label>Status <span class="required">*</span></label>
                    <select name="status" class="form-control" required>
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2>Responsible Parties</h2>
            
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Project Manager <span class="required">*</span></label>
                    <select name="manager_id" class="form-control" required>
                        <option value="">Select manager</option>
                    </select>
                </div>
                <div class="form-group col-md-6">
                    <label>Field Supervisor</label>
                    <select name="supervisor_id" class="form-control">
                        <option value="">Select supervisor</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Client/Stakeholder</label>
                    <input type="text" name="client" class="form-control" placeholder="Client name">
                </div>
                <div class="form-group col-md-6">
                    <label>Contractor</label>
                    <input type="text" name="contractor" class="form-control" placeholder="Contractor name">
                </div>
            </div>
        </div>

        <div class="form-actions">
            <a href="<?php echo BASE_URL; ?>/projects" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary">Create Project</button>
        </div>
    </form>
</div>

<script>
document.getElementById('createProjectForm').addEventListener('submit', async (e) => {
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
            AlertsComponent?.success('Project created successfully');
            setTimeout(() => {
                location.href = '<?php echo BASE_URL; ?>/projects/' + data.id;
            }, 1500);
        } else {
            AlertsComponent?.error(data.message || 'Failed to create project');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
