<?php
/**
 * PUT /api/v1/equipment/:id
 * Update equipment details
 * 
 * @requires Authentication, equipment.edit permission
 * @param int id Equipment ID
 * @request JSON - any equipment fields
 * @response JSON
 *   - success: boolean
 *   - equipment: object
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
    Authorization::require('equipment.edit');
    
    $equipmentId = (int)($_GET['id'] ?? 0);
    if (!$equipmentId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Equipment ID required']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    $equipmentRepo = new EquipmentRepository();
    $equipment = $equipmentRepo->find($equipmentId);
    
    if (!$equipment) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Equipment not found']);
        exit;
    }
    
    $updated = $equipmentRepo->update($equipmentId, $input);
    
    if (!$updated) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update']);
        exit;
    }
    
    $auditLog = new AuditLog();
    $auditLog->create([
        'user_id' => Authentication::user()['id'],
        'action' => 'equipment_updated',
        'entity_type' => 'equipment',
        'entity_id' => $equipmentId,
        'details' => json_encode(array_keys($input)),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    $updatedEquipment = $equipmentRepo->find($equipmentId);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'equipment' => $updatedEquipment
    ]);
    
} catch (Exception $e) {
    error_log("Update equipment API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
