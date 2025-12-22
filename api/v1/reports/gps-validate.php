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
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['latitude']) || empty($input['longitude'])) {
        throw new ValidationException(['gps' => 'GPS coordinates are required']);
    }
    
    $gpsService = new GpsService();
    $isValid = $gpsService->validateMalawiCoordinates(
        $input['latitude'],
        $input['longitude']
    );
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'valid' => $isValid,
        'message' => $isValid ? 'GPS coordinates are valid' : 'GPS coordinates are outside Malawi boundaries'
    ]);
    
} catch (Exception $e) {
    error_log("GPS validate API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
