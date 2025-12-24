<?php
/**
 * Projects - List Page
 * Display all projects with filters and pagination
 */

$pageTitle = 'Projects';
$currentPage = 'projects';
$breadcrumbs = [
    ['name' => 'Projects', 'icon' => '📋']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📋 Projects</h1>
        <p>Manage your construction projects</p>
    </div>
    <div class="header-actions">
        <a href="<?php echo BASE_URL; ?>/projects/create" class="btn btn-primary">
            <span class="icon">➕</span> New Project
        </a>
    </div>
</div>

<!-- Filters -->
<div class="filters-section">
    <div class="filters-row">
        <div class="filter-group">
            <label>Search</label>
            <input type="text" id="projectSearch" class="form-control" placeholder="Project name, location...">
        </div>
        <div class="filter-group">
            <label>Status</label>
            <select id="statusFilter" class="form-control">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
            </select>
        </div>
        <div class="filter-group">
            <label>Manager</label>
            <select id="managerFilter" class="form-control">
                <option value="">All Managers</option>
            </select>
        </div>
        <div class="filter-actions">
            <button class="btn btn-secondary" id="clearFilters">Clear Filters</button>
        </div>
    </div>
</div>

<!-- Projects Table -->
<div class="table-container">
    <table class="data-table" id="projectsTable">
        <thead>
            <tr>
                <th>Project Name</th>
                <th>Location</th>
                <th>Manager</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="projectsBody">
            <tr class="skeleton-row">
                <td colspan="9"><div class="loading-skeleton"></div></td>
            </tr>
        </tbody>
    </table>
</div>

<!-- Pagination -->
<div id="paginationContainer"></div>

<!-- Edit Modal -->
<div class="modal fade" id="editProjectModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Edit Project</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="editProjectForm" class="modal-form">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Project Name</label>
                        <input type="text" name="name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" name="location" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status" class="form-control" required>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="on-hold">On Hold</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary modal-submit">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupFilters();
});

async function loadProjects(page = 1) {
    const search = document.getElementById('projectSearch')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects?page=${page}&search=${search}&status=${status}`);
        const data = await response.json();

        if (data.success) {
            renderProjects(data.data.items);
            // Render pagination
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        AlertsComponent?.error('Failed to load projects');
    }
}

function renderProjects(projects) {
    const tbody = document.getElementById('projectsBody');
    tbody.innerHTML = '';

    if (projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No projects found</td></tr>';
        return;
    }

    projects.forEach(project => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${project.name}</strong></td>
            <td>${project.location}</td>
            <td>${project.manager}</td>
            <td>MWK ${project.budget.toLocaleString()}</td>
            <td><span class="badge badge-${project.status}">${project.status}</span></td>
            <td>
                <div class="progress" style="width: 100px;">
                    <div class="progress-bar" style="width: ${project.progress}%"></div>
                </div>
                ${project.progress}%
            </td>
            <td>${new Date(project.start_date).toLocaleDateString()}</td>
            <td>${new Date(project.end_date).toLocaleDateString()}</td>
            <td>
                <a href="<?php echo BASE_URL; ?>/projects/${project.id}" class="btn btn-sm btn-info">View</a>
                <button class="btn btn-sm btn-warning" onclick="editProject(${project.id})">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupFilters() {
    document.getElementById('projectSearch')?.addEventListener('input', () => loadProjects());
    document.getElementById('statusFilter')?.addEventListener('change', () => loadProjects());
    document.getElementById('clearFilters')?.addEventListener('click', () => {
        document.getElementById('projectSearch').value = '';
        document.getElementById('statusFilter').value = '';
        loadProjects();
    });
}

function editProject(projectId) {
    ModalManager?.show('editProjectModal');
    // Load project data
}
</script>
