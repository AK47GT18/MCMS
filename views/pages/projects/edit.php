<?php
/**
 * Projects - Edit Page
 * Edit existing project details
 */

$projectId = $_GET['id'] ?? null;
if (!$projectId) {
    header('Location: ' . BASE_URL . '/projects');
    exit;
}

$pageTitle = 'Edit Project';
$currentPage = 'projects';
$breadcrumbs = [
    ['name' => 'Projects', 'url' => BASE_URL . '/projects'],
    ['name' => 'Edit']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>✏️ Edit Project</h1>
        <p>Update project information</p>
    </div>
</div>

<div class="form-container" id="formContainer">
    <form id="editProjectForm" class="project-form" action="<?php echo BASE_URL; ?>/api/v1/projects/<?php echo $projectId; ?>" method="POST">
        <!-- Form sections same as create.php -->
        <div class="loading-skeleton"></div>
    </form>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadProjectForEdit(<?php echo $projectId; ?>);
});

async function loadProjectForEdit(projectId) {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}`);
        const data = await response.json();

        if (data.success) {
            const project = data.data;
            // Populate form with project data
            FormModalComponent?.populateForm(
                document.getElementById('editProjectForm'),
                project
            );
        }
    } catch (error) {
        console.error('Error loading project:', error);
        AlertsComponent?.error('Failed to load project');
    }
}

document.getElementById('editProjectForm').addEventListener('submit', async (e) => {
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
            AlertsComponent?.success('Project updated successfully');
        } else {
            AlertsComponent?.error(data.message || 'Failed to update project');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
