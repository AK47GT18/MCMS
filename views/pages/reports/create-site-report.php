<?php
/**
 * Create Site Report Page
 * Field supervisors create site reports
 */

$pageTitle = 'Create Site Report';
$currentPage = 'reports';
$breadcrumbs = [
    ['name' => 'Reports', 'url' => BASE_URL . '/reports'],
    ['name' => 'Create Site Report']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📍 Create Site Report</h1>
        <p>Document site observations and progress</p>
    </div>
</div>

<div class="form-container">
    <form id="createSiteReportForm" action="<?php echo BASE_URL; ?>/api/v1/reports/site-reports" method="POST">
        <div class="form-section">
            <h2>Report Information</h2>
            
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Project <span class="required">*</span></label>
                    <select name="project_id" class="form-control" required>
                        <option value="">Select project</option>
                    </select>
                </div>
                <div class="form-group col-md-6">
                    <label>Report Date <span class="required">*</span></label>
                    <input type="date" name="report_date" class="form-control" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Weather</label>
                    <select name="weather" class="form-control">
                        <option value="">Select</option>
                        <option value="sunny">Sunny</option>
                        <option value="rainy">Rainy</option>
                        <option value="cloudy">Cloudy</option>
                    </select>
                </div>
                <div class="form-group col-md-6">
                    <label>Temperature (°C)</label>
                    <input type="number" name="temperature" class="form-control">
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2>Daily Progress</h2>
            
            <div class="form-row">
                <div class="form-group col-md-12">
                    <label>Work Completed Today</label>
                    <textarea name="work_completed" class="form-control" rows="4"></textarea>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-12">
                    <label>Issues & Challenges</label>
                    <textarea name="issues" class="form-control" rows="4"></textarea>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-md-12">
                    <label>Next Day Plan</label>
                    <textarea name="next_day_plan" class="form-control" rows="4"></textarea>
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2>Workforce & Equipment</h2>
            
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Workers Present</label>
                    <input type="number" name="workers_present" class="form-control">
                </div>
                <div class="form-group col-md-6">
                    <label>Equipment in Use</label>
                    <input type="text" name="equipment_in_use" class="form-control" placeholder="Equipment IDs...">
                </div>
            </div>
        </div>

        <div class="form-actions">
            <a href="<?php echo BASE_URL; ?>/reports" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary">Create Report</button>
        </div>
    </form>
</div>

<script>
document.getElementById('createSiteReportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(e.target.action, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Site report created successfully');
            setTimeout(() => {
                location.href = '<?php echo BASE_URL; ?>/reports';
            }, 1500);
        } else {
            AlertsComponent?.error(data.message || 'Failed to create report');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});
</script>
