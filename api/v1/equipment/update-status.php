<?php
/**
 * PUT /api/v1/equipment/:id/update-status
 * Update equipment status
 * 
 * @requires Authentication, equipment.edit permission
 * @param int id Equipment ID
 * @request JSON
 *   - status: string (available, checked_out, in_maintenance, archived)
 *   - reason: string (optional - required if status is archived)
 * 
 * @response JSON
 *   - success: boolean
 *   - equipment: object
 *   - message: string
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
    
    $csrfMiddleware = new CsrfMiddleware();
    $csrfMiddleware->handle();
    
    $equipmentId = (int)($_GET['id'] ?? 0);
    if (!$equipmentId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Equipment ID required']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $validator = new Validator();
    if (!$validator->validate($input, [
        'status' => 'required|in:available,checked_out,in_maintenance,archived'
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
    
    $oldStatus = $equipment['status'];
    
    // Validate status transitions
    $validTransitions = [
        'available' => ['checked_out', 'in_maintenance', 'archived'],
        'checked_out' => ['available', 'in_maintenance', 'archived'],
        'in_maintenance' => ['available', 'archived'],
        'archived' => []
    ];
    
    if (!in_array($input['status'], $validTransitions[$oldStatus])) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'Invalid status transition']);
        exit;
    }
    
    $updateData = ['status' => $input['status']];
    if ($input['status'] === 'archived' && !empty($input['reason'])) {
        $updateData['retired_reason'] = $input['reason'];
    }
    
    $equipmentRepo->update($equipmentId, $updateData);
    $updatedEquipment = $equipmentRepo->find($equipmentId);
    
    $auditLog = new AuditLog();
    $auditLog->create([
        'user_id' => Authentication::user()['id'],
        'action' => 'equipment_status_changed',
        'entity_type' => 'equipment',
        'entity_id' => $equipmentId,
        'details' => json_encode(['old_status' => $oldStatus, 'new_status' => $input['status']]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'equipment' => $updatedEquipment,
        'message' => 'Equipment status updated successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Update equipment status API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
