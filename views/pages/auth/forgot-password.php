<?php
/**
 * Forgot Password Page
 * Request password reset link
 */

$pageTitle = 'Forgot Password';
?>

<?php include __DIR__ . '/../../layouts/auth.php'; ?>

<div class="auth-container">
    <div class="auth-card">
        <div class="auth-header">
            <h1>🔑 Reset Password</h1>
            <p>Enter your email to receive a reset link</p>
        </div>

        <form id="forgotPasswordForm" class="auth-form">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" class="form-control" placeholder="your@email.com" required autofocus>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Send Reset Link</button>
        </form>

        <div class="auth-footer">
            <a href="<?php echo BASE_URL; ?>/auth/login">Back to Login</a>
        </div>
    </div>
</div>

<script>
document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/auth/forgot-password`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Reset link sent to your email');
            setTimeout(() => {
                location.href = '<?php echo BASE_URL; ?>/auth/login';
            }, 2000);
        } else {
            AlertsComponent?.error(data.message || 'Failed to send reset link');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
