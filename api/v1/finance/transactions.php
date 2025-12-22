<?php
/**
 * GET /api/v1/finance/transactions
 * List all financial transactions with filtering
 * 
 * @requires Authentication, finance.view permission
 * @query params
 *   - page: int (default: 1)
 *   - per_page: int (default: 20)
 *   - type: string (income, expense)
 *   - status: string (pending, approved, rejected)
 *   - project_id: int (optional)
 *   - date_from: date (YYYY-MM-DD)
 *   - date_to: date (YYYY-MM-DD)
 * 
 * @response JSON
 *   - success: boolean
 *   - data: array (transactions)
 *   - pagination: object
 *   - summary: object (totals)
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
    // Check authorization
    Authorization::require('finance.view');
    
    // Get pagination
    $page = (int)($_GET['page'] ?? 1);
    $perPage = min((int)($_GET['per_page'] ?? 20), 100);
    
    // Build filters
    $filters = [];
    if (!empty($_GET['type']) && in_array($_GET['type'], ['income', 'expense'])) {
        $filters['type'] = $_GET['type'];
    }
    if (!empty($_GET['status'])) {
        $filters['status'] = $_GET['status'];
    }
    if (!empty($_GET['project_id'])) {
        $filters['project_id'] = (int)$_GET['project_id'];
    }
    if (!empty($_GET['date_from'])) {
        $filters['date_from'] = $_GET['date_from'];
    }
    if (!empty($_GET['date_to'])) {
        $filters['date_to'] = $_GET['date_to'];
    }
    
    // Get transactions
    $transactionRepo = new TransactionRepository();
    $result = $transactionRepo->getAll($filters, $page, $perPage);
    
    // Log API access
    $auditLog = new AuditLog();
    $currentUser = Authentication::user();
    $auditLog->create([
        'user_id' => $currentUser['id'],
        'action' => 'api_transactions_list',
        'entity_type' => 'transaction',
        'entity_id' => null,
        'details' => json_encode($filters),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    // Calculate summary
    $totalIncome = 0;
    $totalExpense = 0;
    foreach ($result['data'] as $txn) {
        if ($txn['type'] === 'income') {
            $totalIncome += $txn['amount'];
        } else {
            $totalExpense += $txn['amount'];
        }
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $result['data'],
        'pagination' => [
            'current_page' => $page,
            'per_page' => $perPage,
            'total_records' => $result['total'],
            'total_pages' => ceil($result['total'] / $perPage)
        ],
        'summary' => [
            'total_income' => $totalIncome,
            'total_expenses' => $totalExpense,
            'net' => $totalIncome - $totalExpense
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Transactions list API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred'
    ]);
}
