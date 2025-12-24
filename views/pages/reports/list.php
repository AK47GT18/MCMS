<?php
/**
 * Reports - List Page
 * Access and generate reports
 */

$pageTitle = 'Reports';
$currentPage = 'reports';
$breadcrumbs = [
    ['name' => 'Reports', 'icon' => '📈']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📈 Reports</h1>
        <p>View and generate system reports</p>
    </div>
    <div class="header-actions">
        <button class="btn btn-primary" id="generateReportBtn">
            <span class="icon">➕</span> Generate Report
        </button>
    </div>
</div>

<div class="reports-grid">
    <!-- Report Templates -->
    <div class="report-card">
        <h3>📋 Project Status Report</h3>
        <p>Overview of all projects and their current status</p>
        <a href="<?php echo BASE_URL; ?>/reports/project-status" class="btn btn-secondary">View</a>
    </div>

    <div class="report-card">
        <h3>💰 Financial Report</h3>
        <p>Detailed financial summary and transactions</p>
        <a href="<?php echo BASE_URL; ?>/reports/financial" class="btn btn-secondary">View</a>
    </div>

    <div class="report-card">
        <h3>⚙️ Equipment Utilization</h3>
        <p>Equipment usage and maintenance schedule</p>
        <a href="<?php echo BASE_URL; ?>/reports/equipment-utilization" class="btn btn-secondary">View</a>
    </div>

    <div class="report-card">
        <h3>📍 Site Reports</h3>
        <p>Field supervisor site reports and observations</p>
        <a href="<?php echo BASE_URL; ?>/reports/create-site-report" class="btn btn-secondary">Create</a>
    </div>
</div>

<!-- Recent Reports -->
<div class="recent-reports">
    <h2>Recent Reports</h2>
    <div class="reports-list" id="recentReports">
        <div class="loading-skeleton"></div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadRecentReports();
});

async function loadRecentReports() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/reports`);
        const data = await response.json();

        if (data.success) {
            renderReports(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderReports(reports) {
    const container = document.getElementById('recentReports');
    container.innerHTML = '';

    if (!reports.length) {
        container.innerHTML = '<p class="text-center">No reports yet</p>';
        return;
    }

    reports.forEach(report => {
        const div = document.createElement('div');
        div.className = 'report-item';
        div.innerHTML = `
            <div class="report-info">
                <h4>${report.name}</h4>
                <p>${report.description}</p>
                <small>${new Date(report.created_at).toLocaleDateString()}</small>
            </div>
            <div class="report-actions">
                <a href="<?php echo BASE_URL; ?>/reports/${report.id}" class="btn btn-sm btn-info">View</a>
                <a href="<?php echo BASE_URL; ?>/reports/${report.id}/download" class="btn btn-sm btn-secondary">Download</a>
            </div>
        `;
        container.appendChild(div);
    });
}

document.getElementById('generateReportBtn')?.addEventListener('click', () => {
    ModalManager?.show('generateReportModal');
});
</script>
