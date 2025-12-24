<?php
/**
 * Report View Full Page
 * View complete report details
 */

$reportId = $_GET['id'] ?? null;
$pageTitle = 'Report Details';
$currentPage = 'reports';
$breadcrumbs = [
    ['name' => 'Reports', 'url' => BASE_URL . '/reports'],
    ['name' => 'Details']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1 id="reportTitle">Report</h1>
    </div>
    <div class="header-actions">
        <button class="btn btn-secondary" onclick="window.print()">Print</button>
        <a href="<?php echo BASE_URL; ?>/reports/<?php echo $reportId; ?>/download" class="btn btn-secondary">Download</a>
    </div>
</div>

<div class="report-detail-container" id="reportContainer">
    <div class="loading-skeleton"></div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadReportDetails(<?php echo $reportId; ?>);
});

async function loadReportDetails(reportId) {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/reports/${reportId}`);
        const data = await response.json();

        if (data.success) {
            displayReportDetails(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('Failed to load report');
    }
}

function displayReportDetails(report) {
    document.getElementById('reportTitle').textContent = report.title || 'Report';
    
    const container = document.getElementById('reportContainer');
    container.innerHTML = `
        <div class="report-detail-section">
            <h2>Report Information</h2>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Title</label>
                    <p>${report.title}</p>
                </div>
                <div class="detail-item">
                    <label>Date</label>
                    <p>${new Date(report.date).toLocaleDateString()}</p>
                </div>
                <div class="detail-item">
                    <label>Created By</label>
                    <p>${report.createdBy}</p>
                </div>
                <div class="detail-item">
                    <label>Status</label>
                    <p><span class="badge badge-${report.status}">${report.status}</span></p>
                </div>
            </div>
        </div>

        <div class="report-detail-section">
            <h2>Content</h2>
            <div class="report-content">
                ${report.content}
            </div>
        </div>
    `;
}
</script>
