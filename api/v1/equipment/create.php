<?php
/**
 * POST /api/v1/equipment
 * Create/register new equipment
 * 
 * @requires Authentication, equipment.create permission
 * @request JSON
 *   - name: string (required)
 *   - type: string (required: Heavy Equipment, Tools, Vehicles, etc)
 *   - serial_number: string (required)
 *   - description: string (optional)
 *   - purchase_date: date (required)
 *   - purchase_cost: float (required)
 * 
 * @response JSON
 *   - success: boolean
 *   - equipment: object
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
    Authorization::require('equipment.create');
    
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    $validator = new Validator();
    if (!$validator->validate($input, [
        'name' => 'required|min:3',
        'type' => 'required',
        'serial_number' => 'required',
        'purchase_date' => 'required',
        'purchase_cost' => 'required|numeric'
    ])) {
        http_response_code(422);
        echo json_encode(['success' => false, 'errors' => $validator->errors()]);
        exit;
    }
    
    $equipmentService = new EquipmentService();
    $equipment = $equipmentService->createEquipment($input);
    
    $auditLog = new AuditLog();
    $auditLog->create([
        'user_id' => Authentication::user()['id'],
        'action' => 'equipment_created',
        'entity_type' => 'equipment',
        'entity_id' => $equipment['id'],
        'details' => json_encode(['name' => $equipment['name']]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'equipment' => $equipment,
        'message' => 'Equipment registered successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Create equipment API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
