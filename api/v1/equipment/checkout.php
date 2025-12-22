<?php
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
    $csrfMiddleware = new CsrfMiddleware();
    $csrfMiddleware->handle();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['equipment_id'])) {
        throw new ValidationException(['equipment_id' => 'Equipment ID is required']);
    }
    
    $equipmentService = new EquipmentService();
    $result = $equipmentService->checkOutEquipment($input['equipment_id'], $input);
    
    http_response_code(200);
    echo json_encode($result);
    
} catch (ValidationException $e) {
    http_response_code(422);
    echo json_encode($e->toJson());
    
} catch (NotFoundException $e) {
    http_response_code(404);
    echo json_encode($e->toJson());
    
} catch (Exception $e) {
    error_log("Equipment checkout API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
