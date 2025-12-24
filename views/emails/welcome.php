<?php
/**
 * Welcome Email Template
 * Sent when a new user account is created
 */
$email_subject = 'Welcome to MCMS';
$recipient_name = $user['name'] ?? 'User';
$recipient_email = $user['email'] ?? '';
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
        .email-header { background: linear-gradient(135deg, #FF8A00 0%, #FF6B35 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .email-header h1 { margin: 0; font-size: 28px; }
        .email-body { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .email-section { margin-bottom: 20px; }
        .email-section h2 { color: #FF8A00; font-size: 18px; margin-top: 0; }
        .button { display: inline-block; background: #FF8A00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .credentials { background: #f0f0f0; padding: 15px; border-radius: 6px; border-left: 4px solid #FF8A00; margin: 15px 0; font-family: monospace; }
        .email-footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Welcome to MCMS</h1>
            <p>Construction Management System</p>
        </div>
        
        <div class="email-body">
            <div class="email-section">
                <h2>Hello <?php echo htmlspecialchars($recipient_name); ?>,</h2>
                <p>Welcome to the Construction Management System! Your account has been created and is ready to use.</p>
            </div>

            <div class="email-section">
                <h2>Your Login Credentials</h2>
                <div class="credentials">
                    <strong>Email:</strong> <?php echo htmlspecialchars($recipient_email); ?><br>
                    <strong>Username:</strong> <?php echo htmlspecialchars($user['username'] ?? 'N/A'); ?><br>
                    <strong>Temporary Password:</strong> <?php echo htmlspecialchars($user['temp_password'] ?? '[Check with administrator]'); ?>
                </div>
                <p><strong>⚠️ Important:</strong> Please change your password on first login for security.</p>
            </div>

            <div class="email-section">
                <h2>Getting Started</h2>
                <p>You can now access MCMS and:</p>
                <ul>
                    <li>View and manage projects</li>
                    <li>Track equipment and resources</li>
                    <li>Monitor financial transactions</li>
                    <li>Submit and approve commitments</li>
                    <li>Generate reports</li>
                </ul>
            </div>

            <div class="email-section">
                <a href="<?php echo htmlspecialchars($login_url ?? 'https://mcms.example.com/login'); ?>" class="button">Login to MCMS</a>
            </div>

            <div class="email-section">
                <h2>Need Help?</h2>
                <p>If you have any questions or need assistance, please contact the system administrator or visit our help documentation.</p>
            </div>
        </div>

        <div class="email-footer">
            <p>&copy; 2024 Ministry of Transport and Public Works. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
        </div>
    </div>
</body>
</html>
