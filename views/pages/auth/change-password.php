<?php
/**
 * Change Password Page
 * Authenticated user changing their password
 */

$pageTitle = 'Change Password';
$currentPage = 'settings';
$breadcrumbs = [
    ['name' => 'Settings', 'url' => BASE_URL . '/settings'],
    ['name' => 'Change Password']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>🔐 Change Password</h1>
    </div>
</div>

<div class="form-container">
    <form id="changePasswordForm" class="change-password-form">
        <div class="form-section">
            <h2>Update Your Password</h2>

            <div class="form-group">
                <label>Current Password</label>
                <input type="password" name="current_password" class="form-control" required>
            </div>

            <div class="form-group">
                <label>New Password</label>
                <input type="password" name="new_password" class="form-control" placeholder="Minimum 8 characters" required minlength="8">
                <small class="form-text text-muted">
                    Password must contain at least 8 characters, including uppercase, lowercase, and numbers
                </small>
            </div>

            <div class="form-group">
                <label>Confirm New Password</label>
                <input type="password" name="confirm_password" class="form-control" required>
            </div>

            <div class="password-strength">
                <div class="strength-indicator" id="strengthIndicator"></div>
                <p id="strengthText"></p>
            </div>
        </div>

        <div class="form-actions">
            <a href="<?php echo BASE_URL; ?>/settings" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary">Update Password</button>
        </div>
    </form>
</div>

<script>
// Password strength indicator
document.querySelector('input[name="new_password"]').addEventListener('input', (e) => {
    const password = e.target.value;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    const indicator = document.getElementById('strengthIndicator');
    const text = document.getElementById('strengthText');
    
    if (password.length === 0) {
        indicator.style.width = '0%';
        text.textContent = '';
    } else if (strength < 2) {
        indicator.style.width = '25%';
        indicator.className = 'strength-indicator weak';
        text.textContent = 'Weak';
    } else if (strength < 3) {
        indicator.style.width = '50%';
        indicator.className = 'strength-indicator fair';
        text.textContent = 'Fair';
    } else if (strength < 4) {
        indicator.style.width = '75%';
        indicator.className = 'strength-indicator good';
        text.textContent = 'Good';
    } else {
        indicator.style.width = '100%';
        indicator.className = 'strength-indicator strong';
        text.textContent = 'Strong';
    }
});

document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.querySelector('input[name="new_password"]').value;
    const confirmPassword = document.querySelector('input[name="confirm_password"]').value;
    
    if (newPassword !== confirmPassword) {
        AlertsComponent?.error('New passwords do not match');
        return;
    }
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/auth/change-password`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Password changed successfully');
            e.target.reset();
            setTimeout(() => {
                location.href = '<?php echo BASE_URL; ?>/settings';
            }, 1500);
        } else {
            AlertsComponent?.error(data.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
