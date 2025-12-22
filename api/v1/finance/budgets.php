<?php
/**
 * GET /api/v1/finance/budgets
 * List project budgets
 * 
 * @requires Authentication, finance.view permission
 * @query params
 *   - project_id: int (optional)
 *   - page: int (default: 1)
 *   - per_page: int (default: 20)
 * 
 * @response JSON
 *   - success: boolean
 *   - data: array (budgets with utilization)
 *   - pagination: object
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
    if (!empty($_GET['project_id'])) {
        $filters['project_id'] = (int)$_GET['project_id'];
    }
    
    // Get budgets
    $budgetRepo = new BudgetRepository();
    $result = $budgetRepo->getAll($filters, $page, $perPage);
    
    // Enhance with utilization data
    foreach ($result['data'] as &$budget) {
        $spent = $budgetRepo->getSpentAmount($budget['id']);
        $budget['spent'] = $spent;
        $budget['remaining'] = $budget['allocated'] - $spent;
        $budget['variance'] = $budget['remaining'];
        $budget['variance_percent'] = ($budget['remaining'] / $budget['allocated']) * 100;
        $budget['status'] = $budget['variance_percent'] < 10 ? 'warning' : 'healthy';
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
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Budgets list API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred'
    ]);
}
