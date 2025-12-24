<?php
/**
 * Edit User Page
 * Modify user details
 */

$userId = $_GET['id'] ?? null;
$pageTitle = 'Edit User';
$currentPage = 'users';
$breadcrumbs = [
    ['name' => 'Users', 'url' => BASE_URL . '/users'],
    ['name' => 'Edit User']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>✏️ Edit User</h1>
    </div>
</div>

<div class="form-container">
    <form id="editUserForm" action="<?php echo BASE_URL; ?>/api/v1/users/<?php echo $userId; ?>" method="POST">
        <div class="loading-skeleton"></div>
    </form>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadUserData(<?php echo $userId; ?>);
});

async function loadUserData(userId) {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/users/${userId}`);
        const data = await response.json();

        if (data.success) {
            renderEditForm(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('Failed to load user');
    }
}

function renderEditForm(user) {
    const form = document.getElementById('editUserForm');
    form.innerHTML = `
        <div class="form-section">
            <h2>User Information</h2>
            
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Full Name</label>
                    <input type="text" name="fullname" class="form-control" value="${user.fullname}" required>
                </div>
                <div class="form-group col-md-6">
                    <label>Email</label>
                    <input type="email" name="email" class="form-control" value="${user.email}" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Role</label>
                    <select name="role" class="form-control" required>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                        <option value="supervisor" ${user.role === 'supervisor' ? 'selected' : ''}>Field Supervisor</option>
                        <option value="coordinator" ${user.role === 'coordinator' ? 'selected' : ''}>Equipment Coordinator</option>
                        <option value="finance" ${user.role === 'finance' ? 'selected' : ''}>Finance Officer</option>
                    </select>
                </div>
                <div class="form-group col-md-6">
                    <label>Department</label>
                    <input type="text" name="department" class="form-control" value="${user.department || ''}">
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2>Access Control</h2>
            
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Status</label>
                    <select name="status" class="form-control" required>
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
            </div>

            <div class="checkbox">
                <input type="checkbox" name="force_password_reset" id="forceReset">
                <label for="forceReset">Force password reset on next login</label>
            </div>
        </div>

        <div class="form-actions">
            <a href="<?php echo BASE_URL; ?>/users" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary">Update User</button>
        </div>
    `;
}

document.addEventListener('change', (e) => {
    if (e.target.name === 'role' || e.target.name === 'status') {
        // Update form dynamically if needed
    }
}, true);

document.getElementById('editUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(e.target.action, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-HTTP-Method-Override': 'PUT' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('User updated successfully');
        } else {
            AlertsComponent?.error(data.message || 'Failed to update user');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
