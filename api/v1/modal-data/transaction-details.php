<?php
/**
 * GET /api/v1/modal-data/transaction-details
 * Get detailed transaction information for modal display
 * 
 * @requires Authentication, finance.view permission
 * @query int id Transaction ID (required)
 * 
 * @response JSON
 *   - success: boolean
 *   - transaction: object (full transaction details)
 *   - attachments: array
 *   - approval_history: array
 *   - audit_log: array
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    Authorization::require('finance.view');
    
    if (empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Transaction ID is required']);
        exit;
    }
    
    $transactionId = (int)$_GET['id'];
    $transactionRepo = new TransactionRepository();
    $transaction = $transactionRepo->find($transactionId);
    
    if (!$transaction) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Transaction not found']);
        exit;
    }
    
    // Enrich with related data
    $projectRepo = new ProjectRepository();
    $transaction['project'] = $projectRepo->find($transaction['project_id']);
    
    // Get user who submitted
    $userRepo = new UserRepository();
    $transaction['submitted_by_user'] = $userRepo->find($transaction['created_by']);
    
    // Get approver if approved
    if ($transaction['approved_by']) {
        $transaction['approved_by_user'] = $userRepo->find($transaction['approved_by']);
    }
    
    // Get attachments if any
    $attachmentRepo = new AttachmentRepository();
    $transaction['attachments'] = $attachmentRepo->getByEntity('transaction', $transactionId);
    
    // Get approval history
    $transaction['approval_history'] = $transactionRepo->getApprovalHistory($transactionId);
    
    // Get audit logs
    $auditRepo = new AuditLogRepository();
    $transaction['audit_log'] = $auditRepo->getByEntity('transaction', $transactionId);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'transaction' => $transaction
    ]);
    
} catch (Exception $e) {
    error_log("Modal transaction details API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
