<?php
/**
 * Dashboard Widgets Page
 * Display customizable dashboard widgets
 */

$pageTitle = 'Dashboard Widgets';
$currentPage = 'dashboard';
$breadcrumbs = [
    ['name' => 'Dashboard', 'url' => BASE_URL . '/dashboard'],
    ['name' => 'Widgets']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>🎨 Dashboard Widgets</h1>
        <p>Customize your dashboard with widgets</p>
    </div>
    <div class="header-actions">
        <button class="btn btn-primary" id="editWidgetsBtn">
            <span class="icon">✏️</span> Edit Layout
        </button>
    </div>
</div>

<div class="widgets-container" id="widgetsContainer">
    <!-- Widgets will be loaded dynamically -->
    <div class="loading-skeleton">
        <div class="skeleton-widget"></div>
        <div class="skeleton-widget"></div>
        <div class="skeleton-widget"></div>
    </div>
</div>

<!-- Widget Modal -->
<div class="modal fade" id="widgetModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Add Widget</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="widget-selector">
                    <div class="widget-option" data-widget="projects">
                        <h3>📋 Projects</h3>
                        <p>Display active projects</p>
                    </div>
                    <div class="widget-option" data-widget="equipment">
                        <h3>⚙️ Equipment</h3>
                        <p>Equipment status</p>
                    </div>
                    <div class="widget-option" data-widget="finance">
                        <h3>💰 Finance</h3>
                        <p>Financial summary</p>
                    </div>
                    <div class="widget-option" data-widget="tasks">
                        <h3>✓ Tasks</h3>
                        <p>Pending tasks</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadWidgets();
});

function loadWidgets() {
    const container = document.getElementById('widgetsContainer');
    // Load widgets from API or localStorage
    container.innerHTML = '<p class="text-center">Widgets feature coming soon</p>';
}

document.getElementById('editWidgetsBtn')?.addEventListener('click', () => {
    ModalManager?.show('widgetModal');
});
</script>
