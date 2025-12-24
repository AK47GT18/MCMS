<?php
/**
 * Login Page
 * User authentication
 */

$pageTitle = 'Login';
?>

<?php include __DIR__ . '/../../layouts/auth.php'; ?>

<div class="auth-container">
    <div class="auth-card">
        <div class="auth-header">
            <h1>🔐 MCMS</h1>
            <p>Construction Management System</p>
        </div>

        <form id="loginForm" class="auth-form">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" class="form-control" placeholder="your@email.com" required autofocus>
            </div>

            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" class="form-control" placeholder="Enter your password" required>
            </div>

            <div class="form-check">
                <input type="checkbox" name="remember" id="remember" class="form-check-input">
                <label class="form-check-label" for="remember">Remember me</label>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Sign In</button>
        </form>

        <div class="auth-footer">
            <a href="<?php echo BASE_URL; ?>/auth/forgot-password">Forgot password?</a>
        </div>
    </div>
</div>

<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/auth/login`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store auth token
            localStorage.setItem('auth_token', data.token);
            
            AlertsComponent?.success('Login successful');
            setTimeout(() => {
                location.href = '<?php echo BASE_URL; ?>/dashboard';
            }, 1000);
        } else {
            AlertsComponent?.error(data.message || 'Invalid credentials');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred during login');
    }
});
</script>
