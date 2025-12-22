<?php
/**
 * POST /api/v1/equipment/:id/checkout
 * Check out equipment to a user
 * 
 * @requires Authentication, equipment.checkout permission
 * @param int id Equipment ID
 * @request JSON
 *   - user_id: int (required)
 *   - project_id: int (optional)
 *   - checkout_date: date (required)
 *   - expected_return_date: date (required)
 *   - notes: string (optional)
 * 
 * @response JSON
 *   - success: boolean
 *   - checkout: object
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
    Authorization::require('equipment.checkout');
    
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
        'user_id' => 'required|numeric',
        'checkout_date' => 'required|date',
        'expected_return_date' => 'required|date',
        'project_id' => 'numeric'
    ])) {
        http_response_code(422);
        echo json_encode(['success' => false, 'errors' => $validator->errors()]);
        exit;
    }
    
    // Validate dates
    $checkoutDate = strtotime($input['checkout_date']);
    $returnDate = strtotime($input['expected_return_date']);
    if ($returnDate <= $checkoutDate) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'Expected return date must be after checkout date']);
        exit;
    }
    
    $equipmentRepo = new EquipmentRepository();
    $equipment = $equipmentRepo->find($equipmentId);
    
    if (!$equipment) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Equipment not found']);
        exit;
    }
    
    // Check if equipment is available
    if ($equipment['status'] !== 'available') {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Equipment is not available for checkout']);
        exit;
    }
    
    $equipmentService = new EquipmentService();
    $checkout = $equipmentService->checkOutEquipment($equipmentId, $input);
    
    $auditLog = new AuditLog();
    $auditLog->create([
        'user_id' => Authentication::user()['id'],
        'action' => 'equipment_checkout',
        'entity_type' => 'equipment',
        'entity_id' => $equipmentId,
        'details' => json_encode([
            'checked_out_to' => $input['user_id'],
            'expected_return' => $input['expected_return_date']
        ]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'checkout' => $checkout,
        'message' => 'Equipment checked out successfully'
    ]);
    
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
