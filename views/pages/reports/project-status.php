<?php
/**
 * Reports Project Status Page
 * Project status overview report
 */

$pageTitle = 'Project Status Report';
$currentPage = 'reports';
$breadcrumbs = [
    ['name' => 'Reports', 'url' => BASE_URL . '/reports'],
    ['name' => 'Project Status']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📋 Project Status Report</h1>
    </div>
    <div class="header-actions">
        <button class="btn btn-secondary" onclick="window.print()">Print</button>
        <button class="btn btn-secondary" id="downloadBtn">Download</button>
    </div>
</div>

<div class="report-container">
    <div class="report-charts">
        <canvas id="projectStatusChart"></canvas>
        <canvas id="progressChart"></canvas>
    </div>

    <div class="report-table">
        <h2>Projects Overview</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Project Name</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Budget</th>
                    <th>Spent</th>
                </tr>
            </thead>
            <tbody id="projectsBody">
                <tr><td colspan="7" class="text-center">Loading...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadProjectStatusReport();
});

async function loadProjectStatusReport() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/reports/project-status`);
        const data = await response.json();

        if (data.success) {
            displayProjectStatusReport(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayProjectStatusReport(data) {
    const tbody = document.getElementById('projectsBody');
    tbody.innerHTML = '';

    data.projects.forEach(project => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${project.name}</strong></td>
            <td>
                <div class="progress">
                    <div class="progress-bar" style="width: ${project.progress}%"></div>
                </div>
                ${project.progress}%
            </td>
            <td><span class="badge badge-${project.status}">${project.status}</span></td>
            <td>${new Date(project.startDate).toLocaleDateString()}</td>
            <td>${new Date(project.endDate).toLocaleDateString()}</td>
            <td>MWK ${project.budget.toLocaleString()}</td>
            <td>MWK ${project.spent.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('downloadBtn')?.addEventListener('click', () => {
    window.location.href = `<?php echo BASE_URL; ?>/api/v1/reports/project-status/download`;
});
</script>
