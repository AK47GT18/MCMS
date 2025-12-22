<?php
/**
 * GET /api/v1/modal-data/equipment-status
 * Get detailed equipment status information for modal display
 * 
 * @requires Authentication, equipment.view permission
 * @query int id Equipment ID (required)
 * 
 * @response JSON
 *   - success: boolean
 *   - equipment: object (full equipment details)
 *   - checkout_history: array
 *   - maintenance_history: array
 *   - current_location: object
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
    Authorization::require('equipment.view');
    
    if (empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Equipment ID is required']);
        exit;
    }
    
    $equipmentId = (int)$_GET['id'];
    $equipmentRepo = new EquipmentRepository();
    $equipment = $equipmentRepo->find($equipmentId);
    
    if (!$equipment) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Equipment not found']);
        exit;
    }
    
    // Get checkout history (last 10)
    $checkoutHistory = $equipmentRepo->getCheckoutHistory($equipmentId, 10);
    
    // Get maintenance history (last 5)
    $maintenanceHistory = $equipmentRepo->getMaintenanceHistory($equipmentId, 5);
    
    // Get current location
    $currentLocation = null;
    if ($equipment['status'] === 'checked_out') {
        $currentCheckout = $equipmentRepo->getCurrentCheckout($equipmentId);
        if ($currentCheckout) {
            $userRepo = new UserRepository();
            $currentLocation = [
                'status' => 'checked_out',
                'checked_out_to' => $currentCheckout['user_id'],
                'user_name' => $userRepo->find($currentCheckout['user_id'])['name'],
                'project_id' => $currentCheckout['project_id'],
                'checkout_date' => $currentCheckout['checkout_date'],
                'expected_return' => $currentCheckout['expected_return_date']
            ];
        }
    }
    
    // Calculate equipment health
    $health = $equipmentRepo->calculateEquipmentHealth($equipmentId);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'equipment' => $equipment,
        'checkout_history' => $checkoutHistory,
        'maintenance_history' => $maintenanceHistory,
        'current_location' => $currentLocation,
        'health' => $health
    ]);
    
} catch (Exception $e) {
    error_log("Modal equipment status API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}