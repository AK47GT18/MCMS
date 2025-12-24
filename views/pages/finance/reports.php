<?php
/**
 * Finance Reports Page
 * Financial analysis and reports
 */

$pageTitle = 'Finance Reports';
$currentPage = 'finance';
$breadcrumbs = [
    ['name' => 'Finance', 'url' => BASE_URL . '/finance'],
    ['name' => 'Reports']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📊 Finance Reports</h1>
    </div>
</div>

<div class="reports-grid">
    <div class="report-card">
        <h3>Income vs Expenses</h3>
        <p>Compare income and expenses over time</p>
        <a href="<?php echo BASE_URL; ?>/reports/financial" class="btn btn-secondary">View</a>
    </div>

    <div class="report-card">
        <h3>Budget Analysis</h3>
        <p>Project budget performance</p>
        <a href="<?php echo BASE_URL; ?>/finance/budgets" class="btn btn-secondary">View</a>
    </div>

    <div class="report-card">
        <h3>Cash Flow</h3>
        <p>Monthly cash flow summary</p>
        <a href="<?php echo BASE_URL; ?>/finance/reports#cashflow" class="btn btn-secondary">View</a>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    // Load financial reports
});
</script>
