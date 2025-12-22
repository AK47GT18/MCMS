<?php
/**
 * POST /api/v1/finance/create
 * Create new financial transaction
 * 
 * @requires Authentication, finance.create permission
 * @request JSON
 *   - type: string (income, expense) - required
 *   - amount: float (required)
 *   - currency: string (optional, default: USD)
 *   - description: string (required)
 *   - project_id: int (required)
 *   - category: string (required: materials, labor, equipment, services, other)
 *   - date: date (required, YYYY-MM-DD)
 *   - invoice_number: string (optional)
 *   - attachment: file_id/URL (optional)
 * 
 * @response JSON
 *   - success: boolean
 *   - transaction: object
 *   - message: string
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Check authorization
    Authorization::require('finance.create');
    
    // Get input
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    // Validate
    $validator = new Validator();
    if (!$validator->validate($input, [
        'type' => 'required',
        'amount' => 'required|numeric',
        'description' => 'required|min:3',
        'project_id' => 'required|numeric',
        'category' => 'required',
        'date' => 'required'
    ])) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ]);
        exit;
    }
    
    // Validate type
    if (!in_array($input['type'], ['income', 'expense'])) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'errors' => ['type' => 'Type must be income or expense']
        ]);
        exit;
    }
    
    // Validate category
    $validCategories = ['materials', 'labor', 'equipment', 'services', 'other'];
    if (!in_array($input['category'], $validCategories)) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'errors' => ['category' => 'Invalid category']
        ]);
        exit;
    }
    
    // Create transaction (status: pending by default)
    $input['status'] = 'pending';
    $input['created_by'] = Authentication::user()['id'];
    
    $financeService = new FinanceService();
    $transaction = $financeService->createTransaction($input);
    
    // Create notification for approvers
    $notificationService = new NotificationService();
    $notificationService->notifyFinanceApprovers([
        'type' => 'transaction_pending_approval',
        'transaction_id' => $transaction['id'],
        'title' => 'Transaction Pending Approval',
        'message' => "New transaction: {$input['description']} - {$input['amount']} {$input['currency']}"
    ]);
    
    // Log action
    $auditLog = new AuditLog();
    $currentUser = Authentication::user();
    $auditLog->create([
        'user_id' => $currentUser['id'],
        'action' => 'transaction_created',
        'entity_type' => 'transaction',
        'entity_id' => $transaction['id'],
        'details' => json_encode([
            'type' => $input['type'],
            'amount' => $input['amount'],
            'category' => $input['category']
        ]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'transaction' => $transaction,
        'message' => 'Transaction created successfully and awaiting approval'
    ]);
    
} catch (Exception $e) {
    error_log("Create transaction API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred'
    ]);
}
