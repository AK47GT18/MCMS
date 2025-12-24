<?php
/**
 * Deadline Reminder Email Template
 * Sent to remind users of upcoming deadlines
 */
$email_subject = 'Deadline Reminder: ' . ($item['title'] ?? 'Task');
$recipient_name = $user['name'] ?? 'User';
$item_type = $item['type'] ?? 'task'; // task, project, commitment
$days_until = $deadline_days ?? 0;
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
        .email-header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .email-header h1 { margin: 0; font-size: 28px; }
        .email-body { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .email-section { margin-bottom: 20px; }
        .email-section h2 { color: #3b82f6; font-size: 18px; margin-top: 0; }
        .reminder-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .deadline-card { background: #f0f9ff; padding: 20px; border-radius: 8px; border: 1px solid #bfdbfe; margin: 15px 0; }
        .countdown { font-size: 28px; font-weight: 700; color: #3b82f6; text-align: center; margin: 10px 0; }
        .details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .details-table td { padding: 10px; border-bottom: 1px solid #ddd; }
        .details-table td:first-child { font-weight: 600; width: 30%; background: #f9f9f9; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .email-footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>⏰ Deadline Reminder</h1>
            <p>Time-sensitive action required</p>
        </div>
        
        <div class="email-body">
            <div class="email-section">
                <h2>Hello <?php echo htmlspecialchars($recipient_name); ?>,</h2>
            </div>

            <div class="reminder-box">
                <strong>⏰ You have an upcoming deadline that requires your attention.</strong>
            </div>

            <div class="deadline-card">
                <div style="text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #64748b;">Time Remaining</p>
                    <div class="countdown"><?php echo $days_until; ?> days</div>
                    <p style="margin: 0; font-size: 14px; color: #64748b;">Due <?php echo isset($item['due_date']) ? date('l, d M Y', strtotime($item['due_date'])) : 'soon'; ?></p>
                </div>
            </div>

            <div class="email-section">
                <h2><?php echo ucfirst($item_type); ?> Details</h2>
                <table class="details-table">
                    <tr>
                        <td>Title</td>
                        <td><?php echo htmlspecialchars($item['title'] ?? 'N/A'); ?></td>
                    </tr>
                    <tr>
                        <td>Type</td>
                        <td><?php echo ucfirst(htmlspecialchars($item_type)); ?></td>
                    </tr>
                    <?php if (isset($item['description'])): ?>
                    <tr>
                        <td>Description</td>
                        <td><?php echo htmlspecialchars($item['description']); ?></td>
                    </tr>
                    <?php endif; ?>
                    <tr>
                        <td>Due Date</td>
                        <td><?php echo isset($item['due_date']) ? date('d M Y', strtotime($item['due_date'])) : 'N/A'; ?></td>
                    </tr>
                    <?php if (isset($item['priority'])): ?>
                    <tr>
                        <td>Priority</td>
                        <td><?php echo ucfirst(htmlspecialchars($item['priority'])); ?></td>
                    </tr>
                    <?php endif; ?>
                </table>
            </div>

            <div class="email-section">
                <h2>Actions Needed</h2>
                <ul>
                    <li>Review the task details</li>
                    <li>Complete or update progress</li>
                    <li>Communicate any delays or issues</li>
                    <li>Update status in MCMS</li>
                </ul>
            </div>

            <div class="email-section">
                <a href="<?php echo htmlspecialchars($item_link ?? '#'); ?>" class="button">View <?php echo ucfirst($item_type); ?> in MCMS</a>
            </div>

            <div class="email-section">
                <p>Don't miss this deadline! Contact your project manager if you need assistance.</p>
            </div>
        </div>

        <div class="email-footer">
            <p>&copy; 2024 Ministry of Transport and Public Works. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
        </div>
    </div>
</body>
</html>
