<?php
/**
 * Equipment Utilization Report Page
 * Analyze equipment usage patterns
 */

$pageTitle = 'Utilization Report';
$currentPage = 'equipment';
$breadcrumbs = [
    ['name' => 'Equipment', 'url' => BASE_URL . '/equipment'],
    ['name' => 'Utilization Report']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📊 Equipment Utilization Report</h1>
        <p>Analyze equipment usage and efficiency</p>
    </div>
</div>

<div class="report-filters">
    <div class="filter-group">
        <label>Date Range</label>
        <input type="date" id="startDate" class="form-control">
        <input type="date" id="endDate" class="form-control">
    </div>
    <button class="btn btn-primary" onclick="loadUtilizationReport()">Generate Report</button>
</div>

<div class="report-charts">
    <div class="chart-container">
        <h3>Equipment Utilization</h3>
        <canvas id="utilizationChart"></canvas>
    </div>

    <div class="chart-container">
        <h3>Idle vs Active</h3>
        <canvas id="idleChart"></canvas>
    </div>
</div>

<div class="utilization-table">
    <table class="data-table">
        <thead>
            <tr>
                <th>Equipment</th>
                <th>Total Hours</th>
                <th>Active Hours</th>
                <th>Idle Hours</th>
                <th>Utilization %</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody id="utilizationBody">
            <tr><td colspan="6" class="text-center">Select date range to generate report</td></tr>
        </tbody>
    </table>
</div>

<script>
function loadUtilizationReport() {
    // Load and render utilization report
}
</script>
