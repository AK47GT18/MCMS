<?php
/**
 * Finance - Transactions List
 */
$pageTitle = 'Transactions';
$currentPage = 'finance';
$breadcrumbs = [
    ['name' => 'Finance', 'url' => BASE_URL . '/finance'],
    ['name' => 'Transactions']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📑 Transactions</h1>
        <p>Manage expenses and income records</p>
    </div>
    <div class="header-actions">
        <button class="btn btn-primary" onclick="showAddTransactionModal()">
            <i class="fas fa-plus"></i> Record Transaction
        </button>
    </div>
</div>

<div class="content">
    <div class="data-card">
        <div class="card-header">
            <div class="filters">
                <input type="date" class="form-input" placeholder="Start Date">
                <input type="date" class="form-input" placeholder="End Date">
                <select class="form-select">
                    <option value="">All Categories</option>
                    <option value="materials">Materials</option>
                    <option value="labor">Labor</option>
                </select>
                <button class="btn btn-secondary">Filter</button>
            </div>
        </div>
        
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Ref #</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($transactions)): ?>
                    <?php foreach($transactions as $t): ?>
                    <tr>
                        <td><?php echo date('Y-m-d', strtotime($t['date'])); ?></td>
                        <td><?php echo $t['reference'] ?? '-'; ?></td>
                        <td><?php echo htmlspecialchars($t['description']); ?></td>
                        <td><?php echo $t['category']; ?></td>
                        <td>
                            <span class="badge <?php echo $t['type'] == 'income' ? 'badge-green' : 'badge-red'; ?>">
                                <?php echo ucfirst($t['type']); ?>
                            </span>
                        </td>
                        <td class="text-right">MWK <?php echo number_format($t['amount'], 2); ?></td>
                        <td><?php echo $t['status']; ?></td>
                        <td>
                            <button class="btn-icon"><i class="fas fa-eye"></i></button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr><td colspan="8" class="text-center">No transactions found</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
        
        <!-- Pagination would go here -->
    </div>
</div>

<script>
function showAddTransactionModal() {
    AlertsComponent?.info('Modal implementation pending');
}
</script>
