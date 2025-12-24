<?php
/**
 * Projects - View Full Page
 * Complete project details and information
 */

$projectId = $_GET['id'] ?? null;
$pageTitle = 'Project Details';
$currentPage = 'projects';
$breadcrumbs = [
    ['name' => 'Projects', 'url' => BASE_URL . '/projects'],
    ['name' => 'Details']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1 id="projectTitle">Project Name</h1>
        <p id="projectStatus">Loading...</p>
    </div>
    <div class="header-actions">
        <a href="<?php echo BASE_URL; ?>/projects/<?php echo $projectId; ?>/edit" class="btn btn-secondary">
            <span class="icon">✏️</span> Edit
        </a>
        <button class="btn btn-danger" id="deleteBtn">
            <span class="icon">🗑️</span> Delete
        </button>
    </div>
</div>

<div class="project-detail-container">
    <!-- Project Overview -->
    <div class="detail-section">
        <h2>Overview</h2>
        <div class="detail-grid">
            <div class="detail-item">
                <label>Project Code</label>
                <p id="projectCode">--</p>
            </div>
            <div class="detail-item">
                <label>Location</label>
                <p id="projectLocation">--</p>
            </div>
            <div class="detail-item">
                <label>Budget</label>
                <p id="projectBudget">MWK 0</p>
            </div>
            <div class="detail-item">
                <label>Spent</label>
                <p id="projectSpent">MWK 0</p>
            </div>
        </div>
    </div>

    <!-- Project Stats -->
    <div class="detail-section">
        <h2>Progress</h2>
        <div class="progress-container">
            <div class="progress-item">
                <label>Overall Progress</label>
                <div class="progress-bar-large">
                    <div class="progress-bar" id="progressBar"></div>
                </div>
                <p id="progressPercent">0%</p>
            </div>
        </div>
    </div>

    <!-- Tabs -->
    <div class="detail-section">
        <div class="tabs">
            <button class="tab-button active" data-tab="information">Information</button>
            <button class="tab-button" data-tab="tasks">Tasks</button>
            <button class="tab-button" data-tab="equipment">Equipment</button>
            <button class="tab-button" data-tab="budget">Budget</button>
            <button class="tab-button" data-tab="documents">Documents</button>
        </div>

        <div class="tab-content" id="information">
            <div class="info-block">
                <h3>Description</h3>
                <p id="projectDescription">No description provided</p>
            </div>
            <div class="info-block">
                <h3>Timeline</h3>
                <p>Start Date: <strong id="startDate">--</strong></p>
                <p>End Date: <strong id="endDate">--</strong></p>
            </div>
        </div>

        <div class="tab-content" id="tasks" style="display: none;">
            <a href="<?php echo BASE_URL; ?>/projects/<?php echo $projectId; ?>/tasks" class="btn btn-primary">View All Tasks</a>
        </div>

        <div class="tab-content" id="equipment" style="display: none;">
            <p>Equipment assigned to this project will be shown here</p>
        </div>

        <div class="tab-content" id="budget" style="display: none;">
            <p>Budget details will be shown here</p>
        </div>

        <div class="tab-content" id="documents" style="display: none;">
            <p>Project documents will be shown here</p>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadProjectDetails(<?php echo $projectId; ?>);
    setupTabNavigation();
});

async function loadProjectDetails(projectId) {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}`);
        const data = await response.json();

        if (data.success) {
            const project = data.data;
            displayProjectDetails(project);
        }
    } catch (error) {
        console.error('Error loading project:', error);
        AlertsComponent?.error('Failed to load project details');
    }
}

function displayProjectDetails(project) {
    document.getElementById('projectTitle').textContent = project.name;
    document.getElementById('projectCode').textContent = project.code;
    document.getElementById('projectLocation').textContent = project.location;
    document.getElementById('projectBudget').textContent = 'MWK ' + project.budget.toLocaleString();
    document.getElementById('projectSpent').textContent = 'MWK ' + (project.spent || 0).toLocaleString();
    document.getElementById('projectDescription').textContent = project.description || 'No description provided';
    document.getElementById('startDate').textContent = new Date(project.start_date).toLocaleDateString();
    document.getElementById('endDate').textContent = new Date(project.end_date).toLocaleDateString();
    
    const progress = project.progress || 0;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressPercent').textContent = progress + '%';
}

function setupTabNavigation() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            
            // Show selected tab
            document.getElementById(tabName).style.display = 'block';
            
            // Update button states
            document.querySelectorAll('.tab-button').forEach(b => {
                b.classList.remove('active');
            });
            button.classList.add('active');
        });
    });
}

document.getElementById('deleteBtn')?.addEventListener('click', () => {
    ModalManager?.showConfirm(
        'Delete Project',
        'Are you sure you want to delete this project?',
        async () => {
            try {
                const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/<?php echo $projectId; ?>`, {
                    method: 'DELETE',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();
                if (data.success) {
                    AlertsComponent?.success('Project deleted');
                    setTimeout(() => location.href = '<?php echo BASE_URL; ?>/projects', 1500);
                }
            } catch (error) {
                AlertsComponent?.error('Failed to delete project');
            }
        }
    );
});
</script>
