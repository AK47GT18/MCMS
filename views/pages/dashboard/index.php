<?php
/**
 * Dashboard - Main Page
 * Display system overview, charts, and key metrics
 */

$pageTitle = 'Dashboard';
$currentPage = 'dashboard';
$breadcrumbs = [];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📊 Dashboard</h1>
        <p>Welcome back! Here's your system overview.</p>
    </div>
    <div class="header-actions">
        <button class="btn btn-primary" onclick="location.reload();">
            <span class="icon">🔄</span> Refresh
        </button>
    </div>
</div>

<!-- Statistics Cards -->
<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-icon stat-projects">📋</div>
        <div class="stat-content">
            <p class="stat-label">Active Projects</p>
            <h3 class="stat-value" id="activeProjects">0</h3>
            <p class="stat-change positive">↑ 12% this month</p>
        </div>
    </div>

    <div class="stat-card">
        <div class="stat-icon stat-equipment">⚙️</div>
        <div class="stat-content">
            <p class="stat-label">Equipment in Use</p>
            <h3 class="stat-value" id="equipmentInUse">0</h3>
            <p class="stat-change positive">↑ 8% this month</p>
        </div>
    </div>

    <div class="stat-card">
        <div class="stat-icon stat-budget">💰</div>
        <div class="stat-content">
            <p class="stat-label">Total Budget</p>
            <h3 class="stat-value" id="totalBudget">MWK 0</h3>
            <p class="stat-change negative">↓ 5% spent</p>
        </div>
    </div>

    <div class="stat-card">
        <div class="stat-icon stat-tasks">✓</div>
        <div class="stat-content">
            <p class="stat-label">Pending Approvals</p>
            <h3 class="stat-value" id="pendingApprovals">0</h3>
            <p class="stat-change warning">⚠️ Action needed</p>
        </div>
    </div>
</div>

<!-- Charts Row -->
<div class="charts-row">
    <!-- Project Status Chart -->
    <div class="chart-container">
        <h3 class="chart-title">Project Status</h3>
        <canvas id="projectStatusChart"></canvas>
    </div>

    <!-- Budget Utilization -->
    <div class="chart-container">
        <h3 class="chart-title">Budget Utilization</h3>
        <canvas id="budgetChart"></canvas>
    </div>
</div>

<!-- Recent Activity -->
<div class="activity-section">
    <div class="section-header">
        <h2>Recent Activity</h2>
        <a href="<?php echo BASE_URL; ?>/activity" class="view-all">View All →</a>
    </div>

    <div class="activity-list" id="activityList">
        <div class="loading-skeleton">
            <div class="skeleton-item"></div>
            <div class="skeleton-item"></div>
            <div class="skeleton-item"></div>
        </div>
    </div>
</div>

<!-- Quick Actions -->
<div class="quick-actions">
    <h2>Quick Actions</h2>
    <div class="action-buttons">
        <a href="<?php echo BASE_URL; ?>/projects/create" class="btn btn-primary">
            <span class="icon">➕</span> New Project
        </a>
        <a href="<?php echo BASE_URL; ?>/equipment/register" class="btn btn-secondary">
            <span class="icon">⚙️</span> Register Equipment
        </a>
        <a href="<?php echo BASE_URL; ?>/finance/create-transaction" class="btn btn-secondary">
            <span class="icon">💳</span> Add Transaction
        </a>
        <a href="<?php echo BASE_URL; ?>/reports" class="btn btn-secondary">
            <span class="icon">📊</span> Generate Report
        </a>
    </div>
</div>

<script>
// Load dashboard data
document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
    initCharts();
});

async function loadDashboardData() {
    try {
        const response = await fetch('<?php echo BASE_URL; ?>/api/v1/dashboard/stats');
        const data = await response.json();

        if (data.success) {
            document.getElementById('activeProjects').textContent = data.data.activeProjects;
            document.getElementById('equipmentInUse').textContent = data.data.equipmentInUse;
            document.getElementById('totalBudget').textContent = 'MWK ' + data.data.totalBudget.toLocaleString();
            document.getElementById('pendingApprovals').textContent = data.data.pendingApprovals;
            
            loadRecentActivity(data.data.recentActivity);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        AlertsComponent?.error('Failed to load dashboard data');
    }
}

function loadRecentActivity(activities) {
    const listEl = document.getElementById('activityList');
    listEl.innerHTML = '';

    if (!activities || activities.length === 0) {
        listEl.innerHTML = '<p class="empty-state">No recent activity</p>';
        return;
    }

    activities.slice(0, 5).forEach(activity => {
        const div = document.createElement('div');
        div.className = 'activity-item';
        div.innerHTML = `
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
                <p class="activity-title">${activity.title}</p>
                <p class="activity-description">${activity.description}</p>
            </div>
            <div class="activity-time">${activity.time}</div>
        `;
        listEl.appendChild(div);
    });
}

function initCharts() {
    // Project Status Chart
    const projectCtx = document.getElementById('projectStatusChart');
    if (projectCtx && typeof Chart !== 'undefined') {
        new Chart(projectCtx, {
            type: 'doughnut',
            data: {
                labels: ['Active', 'Completed', 'On Hold', 'Cancelled'],
                datasets: [{
                    data: [12, 8, 3, 1],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // Budget Chart
    const budgetCtx = document.getElementById('budgetChart');
    if (budgetCtx && typeof Chart !== 'undefined') {
        new Chart(budgetCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Budget Used',
                    data: [65, 59, 80, 81, 56, 55],
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }
}
</script>
