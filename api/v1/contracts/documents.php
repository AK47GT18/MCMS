<?php
/**
 * GET /api/v1/contracts/:id/documents
 * Get all documents for a contract
 * 
 * @requires Authentication, contracts.view permission
 * @param int id Contract ID
 * 
 * @response JSON
 *   - success: boolean
 *   - documents: array
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
    Authorization::require('contracts.view');
    
    $contractId = (int)($_GET['id'] ?? 0);
    if (!$contractId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Contract ID required']);
        exit;
    }
    
    $contractRepo = new ContractRepository();
    $contract = $contractRepo->find($contractId);
    
    if (!$contract) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Contract not found']);
        exit;
    }
    
    // Get documents
    $documentRepo = new DocumentRepository();
    $documents = $documentRepo->getByEntity('contract', $contractId);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'documents' => $documents,
        'count' => count($documents)
    ]);
    
} catch (Exception $e) {
    error_log("Contract documents API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}