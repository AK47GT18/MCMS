<?php
/**
 * Budget Alert Modal
 * Display budget threshold warning
 */
?>

<div class="modal fade" id="budgetAlertModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content modal-warning">
            <div class="modal-header">
                <h5 class="modal-title">⚠️ Budget Alert</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="alert alert-warning">
                    <p><strong id="budgetProjectName">Project Name</strong></p>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Budget:</strong> MWK <span id="budgetTotal"></span></p>
                        <p><strong>Spent:</strong> MWK <span id="budgetSpent"></span></p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Remaining:</strong> MWK <span id="budgetRemaining"></span></p>
                        <p><strong>Usage:</strong> <span id="budgetUsage"></span>%</p>
                    </div>
                </div>
                
                <div class="progress mt-3">
                    <div class="progress-bar progress-bar-danger" id="budgetBar" role="progressbar" style="width: 0%"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <a id="viewBudgetBtn" href="#" class="btn btn-primary">View Budget</a>
            </div>
        </div>
    </div>
</div>

<script>
const BudgetAlertModal = {
    show: function(projectId, budget, spent) {
        const remaining = budget - spent;
        const usage = (spent / budget) * 100;
        
        document.getElementById('budgetTotal').textContent = budget.toLocaleString();
        document.getElementById('budgetSpent').textContent = spent.toLocaleString();
        document.getElementById('budgetRemaining').textContent = remaining.toLocaleString();
        document.getElementById('budgetUsage').textContent = usage.toFixed(1);
        document.getElementById('budgetBar').style.width = usage + '%';
        document.getElementById('viewBudgetBtn').href = `<?php echo BASE_URL; ?>/finance/budgets/${projectId}`;
        
        ModalManager?.show('budgetAlertModal');
    }
};
</script>
