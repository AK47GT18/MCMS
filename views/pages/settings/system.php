<?php
/**
 * Settings System Page
 * System-wide settings (admin only)
 */

$pageTitle = 'System Settings';
$currentPage = 'settings';
$breadcrumbs = [
    ['name' => 'Settings', 'url' => BASE_URL . '/settings'],
    ['name' => 'System']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>⚙️ System Settings</h1>
        <p>Administrative system configuration</p>
    </div>
</div>

<div class="settings-container">
    <form class="settings-form">
        <div class="settings-section">
            <h2>General</h2>
            
            <div class="form-group">
                <label>Application Name</label>
                <input type="text" class="form-control" value="MCMS" readonly>
            </div>

            <div class="form-group">
                <label>System Email</label>
                <input type="email" class="form-control" placeholder="noreply@mcms.local">
            </div>

            <div class="form-group">
                <label>Timezone</label>
                <select class="form-control">
                    <option>Africa/Blantyre (UTC+02:00)</option>
                </select>
            </div>
        </div>

        <div class="settings-section">
            <h2>Security</h2>
            
            <div class="form-group">
                <label>Session Timeout (minutes)</label>
                <input type="number" class="form-control" value="30">
            </div>

            <div class="form-group">
                <label>Password Expiry (days)</label>
                <input type="number" class="form-control" value="90">
            </div>

            <div class="checkbox">
                <input type="checkbox" id="force2FA" checked>
                <label for="force2FA">Force 2FA for all users</label>
            </div>
        </div>

        <div class="settings-section">
            <h2>Maintenance</h2>
            
            <div class="checkbox">
                <input type="checkbox" id="maintenanceMode" id="maintenanceMode">
                <label for="maintenanceMode">Enable maintenance mode</label>
            </div>

            <div class="form-group">
                <label>Backup Schedule</label>
                <select class="form-control">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>
        </div>

        <button type="submit" class="btn btn-primary">Save Settings</button>
    </form>
</div>

<script>
document.querySelector('.settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/settings/system`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('System settings saved');
        } else {
            AlertsComponent?.error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
