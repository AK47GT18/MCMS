<?php
/**
 * Reset Password Page
 * Set new password using reset token
 */

$token = $_GET['token'] ?? null;
$pageTitle = 'Reset Password';

if (!$token) {
    header('Location: ' . BASE_URL . '/auth/login');
    exit;
}
?>

<?php include __DIR__ . '/../../layouts/auth.php'; ?>

<div class="auth-container">
    <div class="auth-card">
        <div class="auth-header">
            <h1>🔐 Create New Password</h1>
            <p>Enter your new password below</p>
        </div>

        <form id="resetPasswordForm" class="auth-form">
            <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">

            <div class="form-group">
                <label>New Password</label>
                <input type="password" name="password" class="form-control" placeholder="Enter new password" required minlength="8">
                <small>Minimum 8 characters</small>
            </div>

            <div class="form-group">
                <label>Confirm Password</label>
                <input type="password" name="password_confirm" class="form-control" placeholder="Confirm new password" required>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Reset Password</button>
        </form>

        <div class="auth-footer">
            <a href="<?php echo BASE_URL; ?>/auth/login">Back to Login</a>
        </div>
    </div>
</div>

<script>
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.querySelector('input[name="password"]').value;
    const passwordConfirm = document.querySelector('input[name="password_confirm"]').value;
    
    if (password !== passwordConfirm) {
        AlertsComponent?.error('Passwords do not match');
        return;
    }
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/auth/reset-password`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Password reset successfully');
            setTimeout(() => {
                location.href = '<?php echo BASE_URL; ?>/auth/login';
            }, 1500);
        } else {
            AlertsComponent?.error(data.message || 'Failed to reset password');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
