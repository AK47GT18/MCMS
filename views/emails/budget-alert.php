<?php
/**
 * Budget Alert Email Template
 * Sent when project budget exceeds threshold
 */
$email_subject = 'Budget Alert: ' . ($project['name'] ?? 'Project');
$recipient_name = $manager['name'] ?? 'Manager';
$project_id = $project['id'] ?? '';
$budget_allocated = $project['budget'] ?? 0;
$budget_spent = $project['spent'] ?? 0;
$budget_percentage = ($budget_spent / $budget_allocated) * 100;
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
        .email-header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .email-header h1 { margin: 0; font-size: 28px; }
        .email-body { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .email-section { margin-bottom: 20px; }
        .email-section h2 { color: #f59e0b; font-size: 18px; margin-top: 0; }
        .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .budget-chart { background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .progress-bar { width: 100%; height: 30px; background: #e5e7eb; border-radius: 15px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #ef4444 0%, #f59e0b 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px; }
        .details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .details-table td { padding: 10px; border-bottom: 1px solid #ddd; }
        .details-table td:first-child { font-weight: 600; width: 40%; background: #f9f9f9; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .email-footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>⚠️ Budget Alert</h1>
            <p>Project budget utilization exceeds threshold</p>
        </div>
        
        <div class="email-body">
            <div class="email-section">
                <h2>Hello <?php echo htmlspecialchars($recipient_name); ?>,</h2>
            </div>

            <div class="alert-box">
                <strong>⚠️ Project budget has exceeded <?php echo $threshold ?? '80'; ?>% utilization. Immediate action may be needed.</strong>
            </div>

            <div class="email-section">
                <h2>Project Information</h2>
                <table class="details-table">
                    <tr>
                        <td>Project Name</td>
                        <td><?php echo htmlspecialchars($project['name'] ?? 'N/A'); ?></td>
                    </tr>
                    <tr>
                        <td>Project ID</td>
                        <td><?php echo htmlspecialchars($project_id); ?></td>
                    </tr>
                    <tr>
                        <td>Status</td>
                        <td><?php echo htmlspecialchars($project['status'] ?? 'N/A'); ?></td>
                    </tr>
                </table>
            </div>

            <div class="email-section">
                <h2>Budget Summary</h2>
                <div class="budget-chart">
                    <div style="margin-bottom: 10px;">
                        <strong>Budget Utilization: <?php echo round($budget_percentage, 1); ?>%</strong>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: <?php echo min($budget_percentage, 100); ?>%;">
                            <?php echo round($budget_percentage, 1); ?>%
                        </div>
                    </div>
                    <table class="details-table" style="margin-top: 15px;">
                        <tr>
                            <td>Budget Allocated</td>
                            <td>MWK <?php echo number_format($budget_allocated, 2); ?></td>
                        </tr>
                        <tr>
                            <td>Amount Spent</td>
                            <td>MWK <?php echo number_format($budget_spent, 2); ?></td>
                        </tr>
                        <tr>
                            <td>Remaining Budget</td>
                            <td>MWK <?php echo number_format($budget_allocated - $budget_spent, 2); ?></td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="email-section">
                <h2>Recommended Actions</h2>
                <ul>
                    <li>Review current spending and expenditures</li>
                    <li>Identify areas of overspending</li>
                    <li>Consider budget reallocation if necessary</li>
                    <li>Communicate with stakeholders</li>
                    <li>Request budget revision if required</li>
                </ul>
            </div>

            <div class="email-section">
                <a href="<?php echo htmlspecialchars($project_link ?? '#'); ?>" class="button">View Project in MCMS</a>
            </div>

            <div class="email-section">
                <p>If you need assistance with budget management, please contact the finance administrator.</p>
            </div>
        </div>

        <div class="email-footer">
            <p>&copy; 2024 Ministry of Transport and Public Works. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
        </div>
    </div>
</body>
</html>
