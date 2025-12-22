<?php
/**
 * POST /api/v1/equipment/:id/checkin
 * Check in equipment from a user
 * 
 * @requires Authentication, equipment.checkin permission
 * @param int id Equipment ID
 * @request JSON
 *   - checkin_date: date (required)
 *   - condition: string (good, fair, damaged, non-functional)
 *   - damage_notes: string (optional)
 *   - notes: string (optional)
 * 
 * @response JSON
 *   - success: boolean
 *   - checkin: object
 *   - message: string
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
    Authorization::require('equipment.checkin');
    
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
        'checkin_date' => 'required|date',
        'condition' => 'required|in:good,fair,damaged,non-functional'
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
    
    // Check if equipment is currently checked out
    if ($equipment['status'] !== 'checked_out') {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Equipment is not currently checked out']);
        exit;
    }
    
    $equipmentService = new EquipmentService();
    $checkin = $equipmentService->checkInEquipment($equipmentId, $input);
    
    $auditLog = new AuditLog();
    $auditLog->create([
        'user_id' => Authentication::user()['id'],
        'action' => 'equipment_checkin',
        'entity_type' => 'equipment',
        'entity_id' => $equipmentId,
        'details' => json_encode([
            'checkin_date' => $input['checkin_date'],
            'condition' => $input['condition']
        ]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    // If condition is damaged/non-functional, create maintenance notification
    if (in_array($input['condition'], ['damaged', 'non-functional'])) {
        $notificationService = new NotificationService();
        $notificationService->create([
            'user_id' => Authentication::user()['id'],
            'type' => 'equipment_damage_reported',
            'title' => 'Equipment Damage Reported',
            'message' => 'Equipment #' . $equipmentId . ' checked in with ' . $input['condition'] . ' condition',
            'related_entity' => 'equipment',
            'related_entity_id' => $equipmentId
        ]);
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'checkin' => $checkin,
        'message' => 'Equipment checked in successfully'
    ]);
    
} catch (ValidationException $e) {
    http_response_code(422);
    echo json_encode($e->toJson());
    
} catch (NotFoundException $e) {
    http_response_code(404);
    echo json_encode($e->toJson());
    
} catch (Exception $e) {
    error_log("Equipment checkin API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}