<?php
/**
 * Audit Logs Page
 * View system audit trail
 */

$pageTitle = 'Audit Logs';
$currentPage = 'audit';
$breadcrumbs = [
    ['name' => 'Audit Logs']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📜 Audit Logs</h1>
        <p>System activity and changes tracking</p>
    </div>
</div>

<div class="filters-bar">
    <input type="text" class="form-control search-input" id="searchLogs" placeholder="Search logs...">
    <select class="form-control" id="actionFilter">
        <option value="">All Actions</option>
        <option value="create">Create</option>
        <option value="update">Update</option>
        <option value="delete">Delete</option>
        <option value="login">Login</option>
        <option value="logout">Logout</option>
    </select>
    <input type="date" class="form-control" id="dateFilter">
</div>

<div class="logs-container">
    <table class="data-table">
        <thead>
            <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Changes</th>
                <th>IP Address</th>
            </tr>
        </thead>
        <tbody id="logsBody">
            <tr><td colspan="6" class="text-center">Loading...</td></tr>
        </tbody>
    </table>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadLogs();
    
    // Filter listeners
    document.getElementById('actionFilter').addEventListener('change', loadLogs);
    document.getElementById('dateFilter').addEventListener('change', loadLogs);
});

async function loadLogs() {
    const action = document.getElementById('actionFilter').value;
    const date = document.getElementById('dateFilter').value;
    
    try {
        let url = `<?php echo BASE_URL; ?>/api/v1/audit-logs`;
        const params = new URLSearchParams();
        if (action) params.append('action', action);
        if (date) params.append('date', date);
        if (params.toString()) url += '?' + params.toString();
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            renderLogs(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderLogs(logs) {
    const tbody = document.getElementById('logsBody');
    tbody.innerHTML = '';

    if (!logs.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No logs found</td></tr>';
        return;
    }

    logs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${log.userName}</td>
            <td><span class="badge badge-info">${log.action}</span></td>
            <td>${log.entity} #${log.entityId}</td>
            <td>
                ${log.changes ? `
                    <button class="btn btn-sm btn-info" onclick="showChanges('${log.changes}')">View</button>
                ` : '-'}
            </td>
            <td>${log.ipAddress}</td>
        `;
        tbody.appendChild(row);
    });
}

function showChanges(changes) {
    const parsed = JSON.parse(changes);
    let message = 'Changes:\n';
    for (const [key, value] of Object.entries(parsed)) {
        message += `${key}: ${value.from} → ${value.to}\n`;
    }
    alert(message);
}
</script>
