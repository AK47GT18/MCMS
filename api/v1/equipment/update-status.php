<?php
require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

$csrfMiddleware = new CsrfMiddleware();
$csrfMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['equipment_id']) || empty($input['status'])) {
        throw new ValidationException(['error' => 'Equipment ID and status are required']);
    }
    
    Authorization::require('equipment.edit');
    
    $db = Database::getInstance();
    $sql = "UPDATE equipment SET status = ?, updated_at = NOW() WHERE id = ?";
    $db->execute($sql, [$input['status'], $input['equipment_id']]);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Equipment status updated successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Update equipment status API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
