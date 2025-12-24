<?php
/**
 * Approvals Management Page
 * Handle approval workflows
 */

$pageTitle = 'Approvals';
$currentPage = 'approvals';
$breadcrumbs = [
    ['name' => 'Approvals']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>✅ Approvals & Workflows</h1>
    </div>
</div>

<div class="tabs">
    <button class="tab-button active" data-tab="pending">Pending</button>
    <button class="tab-button" data-tab="approved">Approved</button>
    <button class="tab-button" data-tab="rejected">Rejected</button>
</div>

<div class="approvals-container">
    <div id="pending" class="tab-content active">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Requested By</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="pendingBody">
                <tr><td colspan="6" class="text-center">Loading...</td></tr>
            </tbody>
        </table>
    </div>

    <div id="approved" class="tab-content">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Approved By</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody id="approvedBody">
                <tr><td colspan="5" class="text-center">Loading...</td></tr>
            </tbody>
        </table>
    </div>

    <div id="rejected" class="tab-content">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Rejected By</th>
                    <th>Reason</th>
                </tr>
            </thead>
            <tbody id="rejectedBody">
                <tr><td colspan="5" class="text-center">Loading...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<!-- Approval Details Modal -->
<div class="modal fade" id="approvalModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Approval Details</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body" id="approvalDetails">
                <!-- Content loaded dynamically -->
            </div>
            <div class="modal-footer" id="approvalActions">
                <!-- Actions loaded dynamically -->
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadApprovals('pending');
    loadApprovals('approved');
    loadApprovals('rejected');
    
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
});

async function loadApprovals(status) {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/approvals?status=${status}`);
        const data = await response.json();

        if (data.success) {
            renderApprovals(data.data, status);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderApprovals(approvals, status) {
    const tbody = document.getElementById(`${status}Body`);
    tbody.innerHTML = '';

    if (!approvals.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">No ${status} approvals</td></tr>`;
        return;
    }

    approvals.forEach(approval => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${approval.itemName}</strong></td>
            <td><span class="badge">${approval.type}</span></td>
            ${status === 'pending' ? `<td>${approval.requestedBy}</td>` : ''}
            ${status === 'approved' ? `<td>${approval.approvedBy}</td>` : ''}
            ${status === 'rejected' ? `<td>${approval.rejectedBy}</td>` : ''}
            <td>${approval.amount ? 'MWK ' + approval.amount.toLocaleString() : '-'}</td>
            ${status === 'rejected' ? `<td>${approval.reason || '-'}</td>` : ''}
            <td>${new Date(approval.date).toLocaleDateString()}</td>
            ${status === 'pending' ? `
            <td>
                <button class="btn btn-sm btn-success" onclick="approveItem(${approval.id})">Approve</button>
                <button class="btn btn-sm btn-danger" onclick="rejectItem(${approval.id})">Reject</button>
            </td>
            ` : ''}
        `;
        tbody.appendChild(row);
    });
}

function approveItem(id) {
    ModalManager?.showConfirm('Approve Item', 'Are you sure you want to approve this item?', async () => {
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/approvals/${id}/approve`, {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json();
            if (data.success) {
                AlertsComponent?.success('Item approved');
                location.reload();
            }
        } catch (error) {
            AlertsComponent?.error('Failed to approve item');
        }
    });
}

function rejectItem(id) {
    ModalManager?.showConfirm('Reject Item', 'Provide a reason for rejection:', async () => {
        const reason = prompt('Reason for rejection:');
        if (reason) {
            try {
                const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/approvals/${id}/reject`, {
                    method: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason })
                });
                const data = await response.json();
                if (data.success) {
                    AlertsComponent?.success('Item rejected');
                    location.reload();
                }
            } catch (error) {
                AlertsComponent?.error('Failed to reject item');
            }
        }
    });
}
</script>
