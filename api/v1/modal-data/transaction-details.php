<?php
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
    if (empty($_GET['id'])) {
        throw new ValidationException(['id' => 'Transaction ID is required']);
    }
    
    Authorization::require('finance.view');
    
    $transactionRepo = new TransactionRepository();
    $transaction = $transactionRepo->findById($_GET['id']);
    
    if (!$transaction) {
        throw NotFoundException::transaction($_GET['id']);
    }
    
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
