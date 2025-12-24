<?php
/**
 * Finance Quick Filter Modal
 * Advanced transaction filtering
 */
?>

<div class="modal fade" id="quickFilterModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Filter Transactions</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="filterForm" class="modal-form">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Type</label>
                        <select name="type" class="form-control">
                            <option value="">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Category</label>
                        <select name="category" class="form-control">
                            <option value="">All Categories</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status" class="form-control">
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>From Date</label>
                            <input type="date" name="from_date" class="form-control">
                        </div>
                        <div class="form-group col-md-6">
                            <label>To Date</label>
                            <input type="date" name="to_date" class="form-control">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Min Amount</label>
                            <input type="number" name="min_amount" class="form-control">
                        </div>
                        <div class="form-group col-md-6">
                            <label>Max Amount</label>
                            <input type="number" name="max_amount" class="form-control">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="reset" class="btn btn-outline-secondary">Reset</button>
                    <button type="submit" class="btn btn-primary modal-submit">Apply Filters</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
document.getElementById('filterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const params = new URLSearchParams(formData);
    
    location.href = `<?php echo BASE_URL; ?>/finance?` + params.toString();
    ModalManager?.hide('quickFilterModal');
});
</script>
