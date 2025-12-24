<?php
/**
 * Finance Budgets Page
 * Manage project budgets
 */

$pageTitle = 'Budgets';
$currentPage = 'finance';
$breadcrumbs = [
    ['name' => 'Finance', 'url' => BASE_URL . '/finance'],
    ['name' => 'Budgets']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>💳 Project Budgets</h1>
        <p>Manage and monitor project budgets</p>
    </div>
</div>

<div class="budgets-container">
    <table class="data-table">
        <thead>
            <tr>
                <th>Project</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Utilization</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="budgetsBody">
            <tr><td colspan="6" class="text-center">Loading...</td></tr>
        </tbody>
    </table>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadBudgets();
});

async function loadBudgets() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/finance/budgets`);
        const data = await response.json();

        if (data.success) {
            renderBudgets(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderBudgets(budgets) {
    const tbody = document.getElementById('budgetsBody');
    tbody.innerHTML = '';

    budgets.forEach(budget => {
        const utilization = (budget.spent / budget.total) * 100;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${budget.projectName}</strong></td>
            <td>MWK ${budget.total.toLocaleString()}</td>
            <td>MWK ${budget.spent.toLocaleString()}</td>
            <td class="${utilization > 90 ? 'text-danger' : ''}">MWK ${(budget.total - budget.spent).toLocaleString()}</td>
            <td>
                <div class="progress">
                    <div class="progress-bar ${utilization > 90 ? 'progress-bar-danger' : 'progress-bar-success'}" style="width: ${utilization}%"></div>
                </div>
                ${utilization.toFixed(1)}%
            </td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewBudget(${budget.id})">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function viewBudget(id) {
    location.href = `<?php echo BASE_URL; ?>/finance/budgets/${id}`;
}
</script>
