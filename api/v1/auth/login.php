<?php
require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        $input = $_POST;
    }
    
    // Validate input
    if (empty($input['username']) || empty($input['password'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Username and password are required'
        ]);
        exit;
    }
    
    // Attempt login
    $authService = new AuthService();
    $result = $authService->login($input['username'], $input['password']);
    
    http_response_code(200);
    echo json_encode($result);
    
} catch (AuthenticationException $e) {
    http_response_code(401);
    echo json_encode($e->toJson());
    
} catch (ValidationException $e) {
    http_response_code(422);
    echo json_encode($e->toJson());
    
} catch (Exception $e) {
    error_log("Login API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred during login'
    ]);
}