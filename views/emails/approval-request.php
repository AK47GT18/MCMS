<?php
/**
 * Approval Request Email Template
 * Sent when approval is requested for a commitment
 */
$email_subject = 'Approval Request: ' . ($commitment['title'] ?? 'Commitment');
$recipient_name = $approver['name'] ?? 'Approver';
$commitment_id = $commitment['id'] ?? '';
$commitment_amount = $commitment['amount'] ?? 0;
$commitment_vendor = $commitment['vendor'] ?? '';
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
        .details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .details-table td { padding: 10px; border-bottom: 1px solid #ddd; }
        .details-table td:first-child { font-weight: 600; width: 30%; background: #f9f9f9; }
        .button-group { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: 600; }
        .button-approve { background: #10b981; color: white; }
        .button-reject { background: #ef4444; color: white; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .email-footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Approval Request</h1>
            <p>Action Required</p>
        </div>
        
        <div class="email-body">
            <div class="email-section">
                <h2>Hello <?php echo htmlspecialchars($recipient_name); ?>,</h2>
                <p>A new commitment requires your approval. Please review the details below.</p>
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
                        <td><?php echo htmlspecialchars($commitment_vendor); ?></td>
                    </tr>
                    <tr>
                        <td>Amount</td>
                        <td>MWK <?php echo number_format($commitment_amount, 2); ?></td>
                    </tr>
                    <tr>
                        <td>Requested By</td>
                        <td><?php echo htmlspecialchars($requester['name'] ?? 'Unknown'); ?></td>
                    </tr>
                    <tr>
                        <td>Submission Date</td>
                        <td><?php echo isset($commitment['created_at']) ? date('d M Y H:i', strtotime($commitment['created_at'])) : 'N/A'; ?></td>
                    </tr>
                </table>
            </div>

            <div class="alert">
                <strong>⏰ Please approve or reject within 48 hours.</strong>
            </div>

            <div class="email-section">
                <h2>Description</h2>
                <p><?php echo nl2br(htmlspecialchars($commitment['description'] ?? 'No description provided')); ?></p>
            </div>

            <div class="button-group">
                <a href="<?php echo htmlspecialchars($approval_link ?? '#'); ?>" class="button button-approve">Review & Approve</a>
                <a href="<?php echo htmlspecialchars($rejection_link ?? '#'); ?>" class="button button-reject">Reject</a>
            </div>

            <div class="email-section">
                <p>If you cannot approve this commitment, please contact the administrator.</p>
            </div>
        </div>

        <div class="email-footer">
            <p>&copy; 2024 Ministry of Transport and Public Works. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
        </div>
    </div>
</body>
</html>
