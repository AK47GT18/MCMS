<?php
/**
 * Users Management Page
 * Manage application users
 */

$pageTitle = 'Users';
$currentPage = 'users';
$breadcrumbs = [
    ['name' => 'Admin', 'url' => BASE_URL . '/admin'],
    ['name' => 'Users']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>👥 Users Management</h1>
    </div>
    <div class="header-actions">
        <button class="btn btn-primary" id="addUserBtn">
            <span class="icon">➕</span> Add User
        </button>
    </div>
</div>

<div class="filters-bar">
    <input type="text" class="form-control search-input" id="searchUsers" placeholder="Search users...">
    <select class="form-control" id="roleFilter">
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
        <option value="supervisor">Field Supervisor</option>
        <option value="coordinator">Equipment Coordinator</option>
        <option value="finance">Finance Officer</option>
    </select>
</div>

<div class="users-container">
    <table class="data-table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="usersBody">
            <tr><td colspan="6" class="text-center">Loading...</td></tr>
        </tbody>
    </table>
</div>

<!-- Add User Modal -->
<div class="modal fade" id="addUserModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Add New User</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="addUserForm" class="modal-form">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" name="fullname" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select name="role" class="form-control" required>
                            <option value="">Select role</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="supervisor">Field Supervisor</option>
                            <option value="coordinator">Equipment Coordinator</option>
                            <option value="finance">Finance Officer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Department</label>
                        <input type="text" name="department" class="form-control">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary modal-submit">Add User</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});

async function loadUsers() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/users`);
        const data = await response.json();

        if (data.success) {
            renderUsers(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersBody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${user.fullname}</strong></td>
            <td>${user.email}</td>
            <td><span class="badge badge-info">${user.role}</span></td>
            <td>${user.department || '-'}</td>
            <td><span class="badge badge-${user.status === 'active' ? 'success' : 'warning'}">${user.status}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="editUser(${user.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deactivateUser(${user.id})">Deactivate</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('addUserBtn')?.addEventListener('click', () => {
    ModalManager?.show('addUserModal');
});

document.getElementById('addUserForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/users`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('User added successfully');
            ModalManager?.hide('addUserModal');
            loadUsers();
        } else {
            AlertsComponent?.error(data.message || 'Failed to add user');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});

function editUser(id) {
    location.href = `<?php echo BASE_URL; ?>/users/${id}/edit`;
}

function deactivateUser(id) {
    ModalManager?.showConfirm('Deactivate User', 'Are you sure?', async () => {
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/users/${id}`, {
                method: 'DELETE',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json();
            if (data.success) {
                AlertsComponent?.success('User deactivated');
                loadUsers();
            }
        } catch (error) {
            AlertsComponent?.error('Failed to deactivate user');
        }
    });
}
</script>
