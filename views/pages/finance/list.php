<?php
/**
 * Finance - List Page
 * View financial transactions and expenses
 */

$pageTitle = 'Finance';
$currentPage = 'finance';
$breadcrumbs = [
    ['name' => 'Finance', 'icon' => '💰']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>💰 Finance</h1>
        <p>Manage financial transactions and budgets</p>
    </div>
    <div class="header-actions">
        <a href="<?php echo BASE_URL; ?>/finance/create-transaction" class="btn btn-primary">
            <span class="icon">➕</span> Add Transaction
        </a>
    </div>
</div>

<!-- Financial Summary -->
<div class="summary-cards">
    <div class="summary-card">
        <h3>Total Budget</h3>
        <p class="value" id="totalBudget">MWK 0</p>
    </div>
    <div class="summary-card">
        <h3>Total Spent</h3>
        <p class="value" id="totalSpent">MWK 0</p>
    </div>
    <div class="summary-card">
        <h3>Remaining</h3>
        <p class="value" id="remainingBudget">MWK 0</p>
    </div>
    <div class="summary-card">
        <h3>Utilization</h3>
        <p class="value" id="utilization">0%</p>
    </div>
</div>

<!-- Filters -->
<div class="filters-section">
    <div class="filters-row">
        <div class="filter-group">
            <label>Search</label>
            <input type="text" id="transactionSearch" class="form-control" placeholder="Description...">
        </div>
        <div class="filter-group">
            <label>Type</label>
            <select id="typeFilter" class="form-control">
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
            </select>
        </div>
        <div class="filter-group">
            <label>Project</label>
            <select id="projectFilter" class="form-control">
                <option value="">All Projects</option>
            </select>
        </div>
    </div>
</div>

<!-- Transactions Table -->
<div class="table-container">
    <table class="data-table" id="financeTable">
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Project</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Approved By</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="financeBody">
            <tr class="skeleton-row">
                <td colspan="9"><div class="loading-skeleton"></div></td>
            </tr>
        </tbody>
    </table>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadFinanceData();
    loadTransactions();
});

async function loadFinanceData() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/finance/summary`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalBudget').textContent = 'MWK ' + data.data.totalBudget.toLocaleString();
            document.getElementById('totalSpent').textContent = 'MWK ' + data.data.totalSpent.toLocaleString();
            document.getElementById('remainingBudget').textContent = 'MWK ' + data.data.remainingBudget.toLocaleString();
            document.getElementById('utilization').textContent = data.data.utilization + '%';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadTransactions() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/finance/transactions`);
        const data = await response.json();

        if (data.success) {
            renderTransactions(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('financeBody');
    tbody.innerHTML = '';

    transactions.forEach(tx => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(tx.date).toLocaleDateString()}</td>
            <td>${tx.description}</td>
            <td>${tx.project}</td>
            <td><span class="badge ${tx.type === 'income' ? 'badge-success' : 'badge-danger'}">${tx.type}</span></td>
            <td class="${tx.type === 'income' ? 'text-success' : 'text-danger'}">MWK ${tx.amount.toLocaleString()}</td>
            <td>${tx.category}</td>
            <td>${tx.approvedBy || '--'}</td>
            <td><span class="badge badge-${tx.status}">${tx.status}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewTransaction(${tx.id})">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function viewTransaction(id) {
    ModalManager?.show(`transactionModal${id}`);
}
</script>
