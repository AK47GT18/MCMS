<?php
/**
 * Reports Financial Page
 * Detailed financial report
 */

$pageTitle = 'Financial Report';
$currentPage = 'reports';
$breadcrumbs = [
    ['name' => 'Reports', 'url' => BASE_URL . '/reports'],
    ['name' => 'Financial Report']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>💰 Financial Report</h1>
    </div>
    <div class="header-actions">
        <button class="btn btn-secondary" onclick="window.print()">
            <span class="icon">🖨️</span> Print
        </button>
        <button class="btn btn-secondary" id="downloadBtn">
            <span class="icon">💾</span> Download
        </button>
    </div>
</div>

<div class="report-container">
    <div class="report-summary">
        <div class="summary-item">
            <h3>Total Income</h3>
            <p class="value positive" id="totalIncome">MWK 0</p>
        </div>
        <div class="summary-item">
            <h3>Total Expenses</h3>
            <p class="value negative" id="totalExpenses">MWK 0</p>
        </div>
        <div class="summary-item">
            <h3>Net Balance</h3>
            <p class="value" id="netBalance">MWK 0</p>
        </div>
    </div>

    <div class="report-charts">
        <canvas id="incomeExpenseChart"></canvas>
        <canvas id="categoryChart"></canvas>
    </div>

    <div class="report-table">
        <h2>Detailed Transactions</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Income</th>
                    <th>Expense</th>
                </tr>
            </thead>
            <tbody id="reportBody">
                <tr><td colspan="5" class="text-center">Loading...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadFinancialReport();
});

async function loadFinancialReport() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/reports/financial`);
        const data = await response.json();

        if (data.success) {
            displayFinancialReport(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayFinancialReport(data) {
    document.getElementById('totalIncome').textContent = 'MWK ' + data.totalIncome.toLocaleString();
    document.getElementById('totalExpenses').textContent = 'MWK ' + data.totalExpenses.toLocaleString();
    document.getElementById('netBalance').textContent = 'MWK ' + data.netBalance.toLocaleString();

    // Render transactions
    const tbody = document.getElementById('reportBody');
    tbody.innerHTML = '';
    
    data.transactions.forEach(tx => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(tx.date).toLocaleDateString()}</td>
            <td>${tx.description}</td>
            <td>${tx.category}</td>
            <td class="text-success">${tx.type === 'income' ? 'MWK ' + tx.amount.toLocaleString() : '--'}</td>
            <td class="text-danger">${tx.type === 'expense' ? 'MWK ' + tx.amount.toLocaleString() : '--'}</td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('downloadBtn')?.addEventListener('click', () => {
    // Download report as PDF
    window.location.href = `<?php echo BASE_URL; ?>/api/v1/reports/financial/download`;
});
</script>
