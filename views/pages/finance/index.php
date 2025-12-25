<?php
/**
 * Finance Dashboard
 */
$pageTitle = 'Finance Overview';
$currentPage = 'finance';
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>💰 Finance Dashboard</h1>
        <p>Financial overview and budget tracking</p>
    </div>
    <div class="header-actions">
        <a href="<?php echo BASE_URL; ?>/finance/transactions" class="btn btn-outline">View Transactions</a>
        <button class="btn btn-primary" onclick="showAddTransactionModal()">Record Expense</button>
    </div>
</div>

<div class="content">
    <!-- Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon bg-blue-light text-blue">
                <i class="fas fa-wallet"></i>
            </div>
            <div class="stat-details">
                <h3>Total Budget</h3>
                <p class="stat-value">MWK <?php echo number_format($stats['total_budget'] ?? 0); ?></p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon bg-red-light text-red">
                <i class="fas fa-receipt"></i>
            </div>
            <div class="stat-details">
                <h3>Total Expenses</h3>
                <p class="stat-value">MWK <?php echo number_format($stats['total_expenses'] ?? 0); ?></p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon bg-green-light text-green">
                <i class="fas fa-chart-pie"></i>
            </div>
            <div class="stat-details">
                <h3>Remaining</h3>
                <p class="stat-value">MWK <?php echo number_format(($stats['total_budget'] ?? 0) - ($stats['total_expenses'] ?? 0)); ?></p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon bg-orange-light text-orange">
                <i class="fas fa-clock"></i>
            </div>
            <div class="stat-details">
                <h3>Pending Approvals</h3>
                <p class="stat-value"><?php echo $stats['pending_approvals'] ?? 0; ?></p>
            </div>
        </div>
    </div>

    <!-- Charts Section -->
    <div class="grid-2-1">
        <div class="data-card">
            <div class="card-header">
                <h3>Cash Flow</h3>
            </div>
            <div class="card-body">
                <canvas id="cashflowChart" height="300"></canvas>
            </div>
        </div>
        <div class="data-card">
            <div class="card-header">
                <h3>Expenses by Category</h3>
            </div>
            <div class="card-body">
                <canvas id="expensesChart" height="300"></canvas>
            </div>
        </div>
    </div>

    <!-- Recent Transactions -->
    <div class="data-card mt-4">
        <div class="card-header">
            <h3>Recent Transactions</h3>
        </div>
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($recent_transactions)): ?>
                        <?php foreach($recent_transactions as $t): ?>
                        <tr>
                            <td><?php echo date('M d, Y', strtotime($t['date'])); ?></td>
                            <td><?php echo htmlspecialchars($t['description']); ?></td>
                            <td><span class="badge badge-gray"><?php echo $t['category']; ?></span></td>
                            <td class="text-right">MWK <?php echo number_format($t['amount']); ?></td>
                            <td><span class="status-badge status-<?php echo strtolower($t['status']); ?>"><?php echo $t['status']; ?></span></td>
                        </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr><td colspan="5" class="text-center">No recent transactions</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    // Expense Chart
    new Chart(document.getElementById('expensesChart'), {
        type: 'doughnut',
        data: {
            labels: <?php echo json_encode(array_column($charts['expenses_by_category'], 'category')); ?>,
            datasets: [{
                data: <?php echo json_encode(array_column($charts['expenses_by_category'], 'total')); ?>,
                backgroundColor: ['#FF8A00', '#FF5C00', '#2563EB', '#10B981']
            }]
        }
    });

    // Cashflow Chart
    new Chart(document.getElementById('cashflowChart'), {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], // Mock labels
            datasets: [{
                label: 'Expenses',
                data: [120000, 190000, 30000, 50000, 20000, 30000], // Mock data or generic from PHP
                borderColor: '#FF5C00',
                fill: false
            }]
        }
    });
});

function showAddTransactionModal() {
    AlertsComponent?.info('Transaction Modal coming soon');
}
</script>
