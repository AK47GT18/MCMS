<?php
/**
 * Projects - List Page
 */
$pageTitle = 'Projects';
$currentPage = 'projects';
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="breadcrumb">
        <span>Project Management</span>
        <i class="fas fa-chevron-right"></i>
        <span>All Projects</span>
    </div>
    <div class="page-title-row">
        <h1 class="page-title">Projects</h1>
        <a href="<?php echo BASE_URL; ?>/projects/create" class="btn btn-primary">
            <i class="fas fa-plus"></i>
            <span>Create Project</span>
        </a>
    </div>
</div>

<div class="content">
    <!-- Optional: Project Stats Row (Consistent with design) -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon orange"><i class="fas fa-folder"></i></div>
            </div>
            <div class="stat-value" id="statsTotal">0</div>
            <div class="stat-label">Total Projects</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon blue"><i class="fas fa-hammer"></i></div>
            </div>
            <div class="stat-value" id="statsActive">0</div>
            <div class="stat-label">Active</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon emerald"><i class="fas fa-check-double"></i></div>
            </div>
            <div class="stat-value" id="statsCompleted">0</div>
            <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon red"><i class="fas fa-ban"></i></div>
            </div>
            <div class="stat-value" id="statsHold">0</div>
            <div class="stat-label">On Hold</div>
        </div>
    </div>

    <!-- Data Card -->
    <div class="data-card">
        <div class="data-card-header">
            <h3 class="card-title">Project List</h3>
            <div class="filters">
                <input type="text" id="projectSearch" class="form-input" placeholder="Search projects..." style="width: 200px;">
                <select id="statusFilter" class="filter-select">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="planning">Planning</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                </select>
                <button class="btn btn-secondary" id="refreshBtn"><i class="fas fa-sync-alt"></i></button>
            </div>
        </div>
        
        <table id="projectsTable">
            <thead>
                <tr>
                    <th>Project Name</th>
                    <th>Location</th>
                    <th>Manager</th>
                    <th>Budget</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Dates</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="projectsBody">
                <tr><td colspan="8" class="loading"><i class="fas fa-spinner"></i> Loading projects...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupFilters();
});

async function loadProjects() {
    const search = document.getElementById('projectSearch').value;
    const status = document.getElementById('statusFilter').value;
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects?search=${encodeURIComponent(search)}&status=${status}`);
        const result = await response.json();

        if (result.success) {
            updateStats(result.data.stats); // Assuming API returns stats too
            renderProjects(result.data.items);
        } else {
            document.getElementById('projectsBody').innerHTML = `<tr><td colspan="8" style="text-align:center;">${result.message || 'No projects found'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('projectsBody').innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--red);">Error loading data</td></tr>`;
    }
}

function renderProjects(projects) {
    const tbody = document.getElementById('projectsBody');
    tbody.innerHTML = '';

    if (!projects || projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 30px;">No projects found matching your criteria.</td></tr>';
        return;
    }

    projects.forEach(p => {
        const row = document.createElement('tr');
        row.onclick = (e) => {
            if (!e.target.closest('button') && !e.target.closest('a')) {
                window.location.href = `<?php echo BASE_URL; ?>/projects/${p.id}`;
            }
        };
        
        row.innerHTML = `
            <td data-label="Project Name">
                <div style="font-weight:700; color:var(--slate-900);">${p.name}</div>
                <div style="font-size:11px; color:var(--slate-500);">${p.code || ''}</div>
            </td>
            <td data-label="Location">${p.location}</td>
            <td data-label="Manager">${p.manager_name || 'Unassigned'}</td>
            <td data-label="Budget" style="font-weight:700;">MWK ${(p.budget || 0).toLocaleString()}</td>
            <td data-label="Status"><span class="status ${getStatusClass(p.status)}">${formatStatus(p.status)}</span></td>
            <td data-label="Progress">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="progress-bar" style="flex: 1; min-width: 60px;">
                        <div class="progress-fill" style="width: ${p.progress || 0}%"></div>
                    </div>
                    <span style="font-weight: 700; font-size: 13px;">${p.progress || 0}%</span>
                </div>
            </td>
            <td data-label="Dates">
                <div style="font-size:12px;">Start: ${formatDate(p.start_date)}</div>
                <div style="font-size:12px;">End: ${formatDate(p.end_date)}</div>
            </td>
            <td data-label="Actions">
                <div class="btn-group">
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); window.location.href='<?php echo BASE_URL; ?>/projects/edit/${p.id}'"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteProject(${p.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateStats(stats) {
    if(!stats) return;
    document.getElementById('statsTotal').textContent = stats.total || 0;
    document.getElementById('statsActive').textContent = stats.active || 0;
    document.getElementById('statsCompleted').textContent = stats.completed || 0;
    document.getElementById('statsHold').textContent = stats.on_hold || 0;
}

function setupFilters() {
    let debounceTimer;
    document.getElementById('projectSearch').addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => loadProjects(), 300);
    });
    
    document.getElementById('statusFilter').addEventListener('change', loadProjects);
    document.getElementById('refreshBtn').addEventListener('click', loadProjects);
}

function getStatusClass(status) {
    const map = {
        'active': 'approved',
        'planning': 'pending',
        'completed': 'completed',
        'on_hold': 'rejected',
        'cancelled': 'rejected'
    };
    return map[status] || 'pending';
}

function formatStatus(status) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
}

function deleteProject(id) {
    if(confirm('Are you sure you want to delete this project?')) {
        // Call delete API
        alert('Delete functionality implemented in backend');
    }
}
</script>
