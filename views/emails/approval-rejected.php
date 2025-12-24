<?php
/**
 * Approval Rejected Email Template
 * Sent when a commitment is rejected
 */
$email_subject = 'Approval Rejected: ' . ($commitment['title'] ?? 'Commitment');
$recipient_name = $requester['name'] ?? 'User';
$commitment_id = $commitment['id'] ?? '';
$rejection_reason = $rejection_details['reason'] ?? 'No reason provided';
$rejected_by = $approver['name'] ?? 'Administrator';
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
        .email-header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .email-header h1 { margin: 0; font-size: 28px; }
        .email-body { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .email-section { margin-bottom: 20px; }
        .email-section h2 { color: #ef4444; font-size: 18px; margin-top: 0; }
        .rejection-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin: 15px 0; }
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
            <h1>✗ Approval Rejected</h1>
            <p>Action Required</p>
        </div>
        
        <div class="email-body">
            <div class="email-section">
                <h2>Hello <?php echo htmlspecialchars($recipient_name); ?>,</h2>
            </div>

            <div class="rejection-box">
                <strong>✗ Your commitment has been rejected and cannot proceed in its current form.</strong>
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
                        <td>Rejected By</td>
                        <td><?php echo htmlspecialchars($rejected_by); ?></td>
                    </tr>
                    <tr>
                        <td>Rejection Date</td>
                        <td><?php echo date('d M Y H:i'); ?></td>
                    </tr>
                </table>
            </div>

            <div class="email-section">
                <h2>Rejection Reason</h2>
                <p><?php echo nl2br(htmlspecialchars($rejection_reason)); ?></p>
            </div>

            <div class="email-section">
                <h2>Next Steps</h2>
                <p>You can:</p>
                <ul>
                    <li>Review the rejection reason</li>
                    <li>Make necessary modifications</li>
                    <li>Resubmit the commitment for approval</li>
                    <li>Contact the approver for clarification</li>
                </ul>
            </div>

            <div class="email-section">
                <a href="<?php echo htmlspecialchars($edit_link ?? '#'); ?>" class="button">Edit & Resubmit</a>
            </div>

            <div class="email-section">
                <p>If you need assistance, please contact the approver or system administrator.</p>
            </div>
        </div>

        <div class="email-footer">
            <p>&copy; 2024 Ministry of Transport and Public Works. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
        </div>
    </div>
</body>
</html>
