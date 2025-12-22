<?php
/**
 * PUT /api/v1/finance/reject
 * Reject pending transaction
 * 
 * @requires Authentication, finance.approve permission
 * @request JSON
 *   - transaction_id: int (required)
 *   - reason: string (required)
 * 
 * @response JSON
 *   - success: boolean
 *   - message: string
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Check authorization
    Authorization::require('finance.approve');
    
    // Get input
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    if (empty($input['transaction_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Transaction ID required']);
        exit;
    }
    
    if (empty($input['reason'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Reason is required']);
        exit;
    }
    
    $txnId = (int)$input['transaction_id'];
    
    // Get transaction
    $transactionRepo = new TransactionRepository();
    $transaction = $transactionRepo->find($txnId);
    
    if (!$transaction) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Transaction not found']);
        exit;
    }
    
    if ($transaction['status'] !== 'pending') {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'error' => 'Only pending transactions can be rejected'
        ]);
        exit;
    }
    
    // Reject transaction
    $currentUser = Authentication::user();
    $transactionRepo->update($txnId, [
        'status' => 'rejected',
        'rejected_by' => $currentUser['id'],
        'rejection_reason' => $input['reason'],
        'rejected_at' => date(DATETIME_FORMAT)
    ]);
    
    // Notify submitter
    $notificationService = new NotificationService();
    $notificationService->notify($transaction['created_by'], [
        'type' => 'transaction_rejected',
        'transaction_id' => $txnId,
        'title' => 'Transaction Rejected',
        'message' => "Your transaction was rejected: {$input['reason']}"
    ]);
    
    // Log action
    $auditLog = new AuditLog();
    $auditLog->create([
        'user_id' => $currentUser['id'],
        'action' => 'transaction_rejected',
        'entity_type' => 'transaction',
        'entity_id' => $txnId,
        'details' => json_encode(['reason' => $input['reason']]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Transaction rejected successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Reject transaction API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred'
    ]);
}
