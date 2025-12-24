<?php
/**
 * Settings Notifications Page
 * Notification preferences
 */

$pageTitle = 'Notifications Settings';
$currentPage = 'settings';
$breadcrumbs = [
    ['name' => 'Settings', 'url' => BASE_URL . '/settings'],
    ['name' => 'Notifications']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>🔔 Notification Settings</h1>
    </div>
</div>

<div class="settings-container">
    <form class="settings-form">
        <div class="settings-section">
            <h2>Email Notifications</h2>
            
            <div class="checkbox">
                <input type="checkbox" id="emailProjectUpdates" checked>
                <label for="emailProjectUpdates">Project updates</label>
            </div>

            <div class="checkbox">
                <input type="checkbox" id="emailApprovals" checked>
                <label for="emailApprovals">Approval requests</label>
            </div>

            <div class="checkbox">
                <input type="checkbox" id="emailBudgetAlerts" checked>
                <label for="emailBudgetAlerts">Budget threshold alerts</label>
            </div>

            <div class="checkbox">
                <input type="checkbox" id="emailDeadlineReminders" checked>
                <label for="emailDeadlineReminders">Deadline reminders</label>
            </div>
        </div>

        <div class="settings-section">
            <h2>Push Notifications</h2>
            
            <div class="checkbox">
                <input type="checkbox" id="pushEnabled" checked>
                <label for="pushEnabled">Enable push notifications</label>
            </div>

            <div class="checkbox">
                <input type="checkbox" id="pushUrgent" checked>
                <label for="pushUrgent">Urgent items only</label>
            </div>
        </div>

        <div class="settings-section">
            <h2>Notification Frequency</h2>
            
            <div class="radio-group">
                <input type="radio" name="frequency" value="immediate" id="immediate" checked>
                <label for="immediate">Immediate notifications</label>
            </div>

            <div class="radio-group">
                <input type="radio" name="frequency" value="daily" id="daily">
                <label for="daily">Daily digest (9:00 AM)</label>
            </div>

            <div class="radio-group">
                <input type="radio" name="frequency" value="weekly" id="weekly">
                <label for="weekly">Weekly digest (Monday 9:00 AM)</label>
            </div>
        </div>

        <button type="submit" class="btn btn-primary">Save Preferences</button>
    </form>
</div>

<script>
document.querySelector('.settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/settings/notifications`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Notification settings saved');
        } else {
            AlertsComponent?.error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
