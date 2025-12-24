<?php
/**
 * Approval Approved Email Template
 * Sent when a commitment is approved
 */
$email_subject = 'Approval Granted: ' . ($commitment['title'] ?? 'Commitment');
$recipient_name = $requester['name'] ?? 'User';
$commitment_id = $commitment['id'] ?? '';
$approved_by = $approver['name'] ?? 'Administrator';
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
        .email-header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .email-header h1 { margin: 0; font-size: 28px; }
        .email-body { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .email-section { margin-bottom: 20px; }
        .email-section h2 { color: #10b981; font-size: 18px; margin-top: 0; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .details-table td { padding: 10px; border-bottom: 1px solid #ddd; }
        .details-table td:first-child { font-weight: 600; width: 30%; background: #f9f9f9; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .email-footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>✓ Approval Granted</h1>
            <p>Your commitment has been approved</p>
        </div>
        
        <div class="email-body">
            <div class="email-section">
                <h2>Hello <?php echo htmlspecialchars($recipient_name); ?>,</h2>
            </div>

            <div class="success-box">
                <strong>✓ Your commitment has been successfully approved and can now proceed.</strong>
            </div>

            <div class="email-section">
                <h2>Commitment Details</h2>
                <table class="details-table">
                    <tr>
                        <td>Commitment ID</td>
                        <td><?php echo htmlspecialchars($commitment_id); ?></td>
                    </tr>
                    <tr>
                        <td>Title</td>
                        <td><?php echo htmlspecialchars($commitment['title'] ?? 'N/A'); ?></td>
                    </tr>
                    <tr>
                        <td>Vendor</td>
                        <td><?php echo htmlspecialchars($commitment['vendor'] ?? 'N/A'); ?></td>
                    </tr>
                    <tr>
                        <td>Amount</td>
                        <td>MWK <?php echo number_format($commitment['amount'] ?? 0, 2); ?></td>
                    </tr>
                    <tr>
                        <td>Approved By</td>
                        <td><?php echo htmlspecialchars($approved_by); ?></td>
                    </tr>
                    <tr>
                        <td>Approval Date</td>
                        <td><?php echo isset($commitment['approval_date']) ? date('d M Y H:i', strtotime($commitment['approval_date'])) : date('d M Y'); ?></td>
                    </tr>
                </table>
            </div>

            <div class="email-section">
                <h2>Next Steps</h2>
                <p>The commitment is now approved and ready for execution. You can:</p>
                <ul>
                    <li>Begin procurement processes</li>
                    <li>Notify the vendor</li>
                    <li>Initiate contract execution</li>
                    <li>Track progress in MCMS</li>
                </ul>
            </div>

            <div class="email-section">
                <a href="<?php echo htmlspecialchars($view_link ?? '#'); ?>" class="button">View Commitment in MCMS</a>
            </div>

            <div class="email-section">
                <p>If you have any questions, please contact the approver or system administrator.</p>
            </div>
        </div>

        <div class="email-footer">
            <p>&copy; 2024 Ministry of Transport and Public Works. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
        </div>
    </div>
</body>
</html>
