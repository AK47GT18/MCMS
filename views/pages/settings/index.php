<?php
/**
 * Settings Page
 * Application settings and preferences
 */

$pageTitle = 'Settings';
$currentPage = 'settings';
$breadcrumbs = [
    ['name' => 'Settings', 'icon' => '⚙️']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>⚙️ Settings</h1>
        <p>Configure application preferences</p>
    </div>
</div>

<div class="settings-container">
    <!-- Settings Tabs -->
    <div class="settings-tabs">
        <button class="settings-tab-button active" data-tab="general">General</button>
        <button class="settings-tab-button" data-tab="security">Security</button>
        <button class="settings-tab-button" data-tab="notifications">Notifications</button>
        <button class="settings-tab-button" data-tab="appearance">Appearance</button>
    </div>

    <!-- General Settings -->
    <div class="settings-tab-content active" id="general">
        <form class="settings-form">
            <h2>General Settings</h2>
            
            <div class="form-group">
                <label>Application Name</label>
                <input type="text" class="form-control" value="MCMS" readonly>
            </div>

            <div class="form-group">
                <label>System Email</label>
                <input type="email" class="form-control" placeholder="admin@example.com">
            </div>

            <div class="form-group">
                <label>Timezone</label>
                <select class="form-control">
                    <option>Africa/Blantyre (UTC+02:00)</option>
                </select>
            </div>

            <div class="form-group">
                <label>Date Format</label>
                <select class="form-control">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                </select>
            </div>

            <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
    </div>

    <!-- Security Settings -->
    <div class="settings-tab-content" id="security" style="display: none;">
        <form class="settings-form">
            <h2>Security Settings</h2>
            
            <div class="form-group">
                <label>Session Timeout (minutes)</label>
                <input type="number" class="form-control" value="30">
            </div>

            <div class="form-group">
                <label>Password Policy</label>
                <div class="checkbox">
                    <input type="checkbox" id="requireUppercase" checked>
                    <label for="requireUppercase">Require uppercase letters</label>
                </div>
                <div class="checkbox">
                    <input type="checkbox" id="requireNumbers" checked>
                    <label for="requireNumbers">Require numbers</label>
                </div>
                <div class="checkbox">
                    <input type="checkbox" id="requireSpecial" checked>
                    <label for="requireSpecial">Require special characters</label>
                </div>
            </div>

            <div class="form-group">
                <label>Two-Factor Authentication</label>
                <div class="checkbox">
                    <input type="checkbox" id="enable2FA">
                    <label for="enable2FA">Enable 2FA for all users</label>
                </div>
            </div>

            <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
    </div>

    <!-- Notification Settings -->
    <div class="settings-tab-content" id="notifications" style="display: none;">
        <form class="settings-form">
            <h2>Notification Preferences</h2>
            
            <div class="checkbox">
                <input type="checkbox" id="emailNotifications" checked>
                <label for="emailNotifications">Email notifications for important events</label>
            </div>

            <div class="checkbox">
                <input type="checkbox" id="pushNotifications" checked>
                <label for="pushNotifications">Push notifications</label>
            </div>

            <div class="checkbox">
                <input type="checkbox" id="budgetAlerts" checked>
                <label for="budgetAlerts">Budget threshold alerts</label>
            </div>

            <div class="checkbox">
                <input type="checkbox" id="deadlineReminders" checked>
                <label for="deadlineReminders">Deadline reminders</label>
            </div>

            <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
    </div>

    <!-- Appearance Settings -->
    <div class="settings-tab-content" id="appearance" style="display: none;">
        <form class="settings-form">
            <h2>Appearance Settings</h2>
            
            <div class="form-group">
                <label>Theme</label>
                <select class="form-control">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                </select>
            </div>

            <div class="form-group">
                <label>Sidebar Position</label>
                <select class="form-control">
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                </select>
            </div>

            <div class="form-group">
                <label>Items Per Page</label>
                <input type="number" class="form-control" value="20" min="10" max="100">
            </div>

            <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
    </div>
</div>

<script>
document.querySelectorAll('.settings-tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');

        // Hide all tabs
        document.querySelectorAll('.settings-tab-content').forEach(tab => {
            tab.style.display = 'none';
            tab.classList.remove('active');
        });

        // Show selected tab
        const tab = document.getElementById(tabName);
        if (tab) {
            tab.style.display = 'block';
            tab.classList.add('active');
        }

        // Update buttons
        document.querySelectorAll('.settings-tab-button').forEach(b => {
            b.classList.remove('active');
        });
        button.classList.add('active');
    });
});

document.querySelectorAll('.settings-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/settings`, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            
            const data = await response.json();
            
            if (data.success) {
                AlertsComponent?.success('Settings saved successfully');
            } else {
                AlertsComponent?.error(data.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error:', error);
            AlertsComponent?.error('An error occurred');
        }
    });
});
</script>
