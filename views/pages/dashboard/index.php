<?php
/**
 * Dashboard - Project Manager
 */
$pageTitle = 'Dashboard';
$currentPage = 'dashboard';
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="header-title">
    <!-- Breadcrumb and Actions handled by main layout/header, specific page actions can go here if needed -->
</div>

<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-header">
            <div class="stat-icon orange">
                <i class="fas fa-project-diagram"></i>
            </div>
        </div>
        <div class="stat-value" id="activeProjects">0</div>
        <div class="stat-label">Active Projects</div>
    </div>

    <div class="stat-card">
        <div class="stat-header">
            <div class="stat-icon blue">
                <i class="fas fa-tasks"></i>
            </div>
        </div>
        <div class="stat-value" id="myTasks">0</div>
        <div class="stat-label">My Pending Tasks</div>
    </div>

    <div class="stat-card">
        <div class="stat-header">
            <div class="stat-icon emerald">
                <i class="fas fa-check-circle"></i>
            </div>
        </div>
        <div class="stat-value" id="completedProjects">0</div>
        <div class="stat-label">Completed Projects</div>
    </div>

    <div class="stat-card">
        <div class="stat-header">
            <div class="stat-icon red">
                <i class="fas fa-wallet"></i>
            </div>
        </div>
        <div class="stat-value" id="totalBudget">MWK 0</div>
        <div class="stat-label">Total Allocated Budget</div>
    </div>
</div>

<!-- Tabs for Dashboard View -->
<div class="tabs">
    <div class="tab active" onclick="switchTab(this, 'overview')">Overview</div>
    <div class="tab" onclick="switchTab(this, 'projects')">My Projects</div>
    <div class="tab" onclick="switchTab(this, 'financials')">Financial Status</div>
</div>

<!-- Data Card: Active Projects -->
<div class="data-card">
    <div class="data-card-header">
        <h3 class="card-title">Recent Active Projects</h3>
        <div class="filters">
            <select class="filter-select">
                <option>All Status</option>
                <option>Planning</option>
                <option>In Progress</option>
                <option>On Hold</option>
            </select>
        </div>
    </div>
    <div class="table-responsive">
        <table id="projects-table">
            <thead>
                <tr>
                    <th>Project Name</th>
                    <th>Code</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Contract Value</th>
                    <th>Completion</th>
                </tr>
            </thead>
            <tbody id="projects-table-body">
                <!-- Populated by JS -->
                <tr>
                    <td colspan="6" class="loading"><i class="fas fa-spinner"></i> Loading...</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const response = await fetch('<?php echo BASE_URL; ?>/api/v1/dashboard/stats');
        const result = await response.json();
        
        if (result.success && result.data) {
            const data = result.data;
            
            // Update Stats
            document.getElementById('activeProjects').textContent = data.project_count || 0;
            document.getElementById('myTasks').textContent = data.tasks_summary?.total || 0;
            document.getElementById('totalBudget').textContent = 'MWK ' + (data.total_budget || 0).toLocaleString();
            
            // Populate Projects Table
            const tbody = document.getElementById('projects-table-body');
            tbody.innerHTML = '';
            
            if (data.my_projects && data.my_projects.length > 0) {
                data.my_projects.slice(0, 5).forEach(project => {
                    const progress = project.completion_percentage || 0;
                    const row = `
                        <tr onclick="window.location.href='<?php echo BASE_URL; ?>/projects/${project.id}'">
                            <td data-label="Project Name" style="font-weight:700;">${project.project_name}</td>
                            <td data-label="Code">${project.project_code}</td>
                            <td data-label="Location">${project.location}</td>
                            <td data-label="Status"><span class="status ${getStatusClass(project.status)}">${project.status}</span></td>
                            <td data-label="Value">MWK ${(project.contract_value || 0).toLocaleString()}</td>
                            <td data-label="Completion">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div class="progress-bar" style="flex: 1;">
                                        <div class="progress-fill" style="width: ${progress}%"></div>
                                    </div>
                                    <span style="font-weight: 700; font-size: 13px;">${progress}%</span>
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No active projects found.</td></tr>';
            }
        }
    } catch (e) {
        console.error("Error loading stats:", e);
    }
}

function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'active': return 'approved'; // reusing approved style for active
        case 'planning': return 'pending';
        case 'completed': return 'completed';
        case 'on_hold': return 'rejected'; // reusing rejected style for warn
        default: return 'in-progress';
    }
}

function switchTab(el, tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    // Implement tab switching logic here
}
</script>

