<?php
/**
 * POST /api/v1/equipment/:id/maintenance
 * Record equipment maintenance
 * 
 * @requires Authentication, equipment.edit permission
 * @param int id Equipment ID
 * @request JSON
 *   - type: string (preventive, corrective, emergency)
 *   - date: date (required)
 *   - description: string (required)
 *   - cost: float (required)
 *   - technician: string (optional)
 * 
 * @response JSON
 *   - success: boolean
 *   - maintenance: object
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
    Authorization::require('equipment.edit');
    
    $equipmentId = (int)($_GET['id'] ?? 0);
    if (!$equipmentId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Equipment ID required']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    $validator = new Validator();
    if (!$validator->validate($input, [
        'type' => 'required',
        'date' => 'required',
        'description' => 'required|min:3',
        'cost' => 'required|numeric'
    ])) {
        http_response_code(422);
        echo json_encode(['success' => false, 'errors' => $validator->errors()]);
        exit;
    }
    
    $equipmentRepo = new EquipmentRepository();
    $equipment = $equipmentRepo->find($equipmentId);
    
    if (!$equipment) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Equipment not found']);
        exit;
    }
    
    $maintenanceService = new MaintenanceService();
    $maintenance = $maintenanceService->recordMaintenance($equipmentId, $input);
    
    $auditLog = new AuditLog();
    $auditLog->create([
        'user_id' => Authentication::user()['id'],
        'action' => 'maintenance_recorded',
        'entity_type' => 'maintenance',
        'entity_id' => $maintenance['id'],
        'details' => json_encode(['equipment_id' => $equipmentId, 'cost' => $input['cost']]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'maintenance' => $maintenance,
        'message' => 'Maintenance recorded successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Record maintenance API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
