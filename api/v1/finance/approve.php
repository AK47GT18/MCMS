<?php
/**
 * PUT /api/v1/finance/approve
 * Approve pending transaction
 * 
 * @requires Authentication, finance.approve permission
 * @request JSON
 *   - transaction_id: int (required)
 *   - notes: string (optional)
 * 
 * @response JSON
 *   - success: boolean
 *   - transaction: object (updated)
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
            'error' => 'Only pending transactions can be approved'
        ]);
        exit;
    }
    
    // Approve transaction
    $currentUser = Authentication::user();
    $transactionRepo->update($txnId, [
        'status' => 'approved',
        'approved_by' => $currentUser['id'],
        'approval_notes' => $input['notes'] ?? null,
        'approved_at' => date(DATETIME_FORMAT)
    ]);
    
    // Update budget if this is an expense
    if ($transaction['type'] === 'expense' && !empty($transaction['project_id'])) {
        $budgetService = new BudgetService();
        $budgetService->deductFromBudget($transaction['project_id'], $transaction['amount']);
    }
    
    // Notify submitter
    $notificationService = new NotificationService();
    $notificationService->notify($transaction['created_by'], [
        'type' => 'transaction_approved',
        'transaction_id' => $txnId,
        'title' => 'Transaction Approved',
        'message' => "Your transaction has been approved: {$transaction['description']}"
    ]);
    
    // Log action
    $auditLog = new AuditLog();
    $auditLog->create([
        'user_id' => $currentUser['id'],
        'action' => 'transaction_approved',
        'entity_type' => 'transaction',
        'entity_id' => $txnId,
        'details' => json_encode(['amount' => $transaction['amount']]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    // Get updated transaction
    $updated = $transactionRepo->find($txnId);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'transaction' => $updated,
        'message' => 'Transaction approved successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Approve transaction API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred'
    ]);
}
