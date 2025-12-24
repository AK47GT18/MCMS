<?php
/**
 * Projects - Gantt Chart Page
 * Visual timeline of projects and tasks
 */

$projectId = $_GET['id'] ?? null;
$pageTitle = 'Gantt Chart';
$currentPage = 'projects';
$breadcrumbs = [
    ['name' => 'Projects', 'url' => BASE_URL . '/projects'],
    ['name' => 'Gantt Chart']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📊 Gantt Chart</h1>
        <p>Visual project timeline</p>
    </div>
    <div class="header-actions">
        <select id="timelineView" class="form-control" style="width: auto;">
            <option value="month">Month View</option>
            <option value="week">Week View</option>
            <option value="day">Day View</option>
        </select>
    </div>
</div>

<div class="gantt-container" id="ganttChart">
    <div class="loading-skeleton" style="height: 400px;"></div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    initGanttChart();
});

function initGanttChart() {
    // Initialize Gantt chart library (e.g., Frappe Gantt)
    const container = document.getElementById('ganttChart');
    container.innerHTML = '<p class="text-center">Gantt chart will load here</p>';
}

document.getElementById('timelineView')?.addEventListener('change', (e) => {
    initGanttChart();
});
</script>
