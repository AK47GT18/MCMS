<?php
/**
 * Password Reset Email Template
 * Sent when user requests password reset
 */
$email_subject = 'Password Reset Request';
$recipient_name = $user['name'] ?? 'User';
$reset_token = $reset_token ?? 'TOKEN';
$reset_link = $reset_link ?? '#';
$expiry_hours = 24;
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
        .email-header { background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .email-header h1 { margin: 0; font-size: 28px; }
        .email-body { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .email-section { margin-bottom: 20px; }
        .email-section h2 { color: #a855f7; font-size: 18px; margin-top: 0; }
        .info-box { background: #f3e8ff; border-left: 4px solid #a855f7; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .button { display: inline-block; background: #a855f7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .code-box { background: #f0f0f0; padding: 15px; border-radius: 6px; font-family: monospace; text-align: center; margin: 15px 0; border: 1px solid #ddd; word-break: break-all; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .email-footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Password Reset</h1>
            <p>MCMS Account Security</p>
        </div>
        
        <div class="email-body">
            <div class="email-section">
                <h2>Hello <?php echo htmlspecialchars($recipient_name); ?>,</h2>
                <p>We received a request to reset your MCMS password. If you didn't make this request, you can ignore this email.</p>
            </div>

            <div class="info-box">
                <strong>🔒 To reset your password, click the button below or use the reset code.</strong>
            </div>

            <div class="email-section">
                <h2>Reset Your Password</h2>
                <p>Click the button below to create a new password:</p>
                <div style="text-align: center;">
                    <a href="<?php echo htmlspecialchars($reset_link); ?>" class="button">Reset Password</a>
                </div>
                <p style="text-align: center; color: #64748b; font-size: 12px;">Or use this code: </p>
                <div class="code-box"><?php echo htmlspecialchars($reset_token); ?></div>
            </div>

            <div class="email-section">
                <h2>Security Information</h2>
                <ul>
                    <li>This link will expire in <?php echo $expiry_hours; ?> hours</li>
                    <li>Never share your reset token with anyone</li>
                    <li>If you didn't request this, your password remains unchanged</li>
                    <li>Report suspicious activity to the administrator immediately</li>
                </ul>
            </div>

            <div class="warning">
                <strong>⚠️ If you did not request a password reset, please ignore this email and contact the administrator if you believe your account has been compromised.</strong>
            </div>

            <div class="email-section">
                <h2>Need Help?</h2>
                <p>If you're unable to reset your password:</p>
                <ul>
                    <li>Contact the system administrator</li>
                    <li>Provide your username and email address</li>
                    <li>Request a manual password reset</li>
                </ul>
            </div>

            <div class="email-section">
                <p><strong>This email was sent to:</strong> <?php echo htmlspecialchars($user['email'] ?? ''); ?></p>
            </div>
        </div>

        <div class="email-footer">
            <p>&copy; 2024 Ministry of Transport and Public Works. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
        </div>
    </div>
</body>
</html>
