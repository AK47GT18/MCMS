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
    // Check if session is valid
    if (!Authentication::check()) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Not authenticated',
            'redirect' => '/login'
        ]);
        exit;
    }
    
    // Refresh session
    $session = new Session();
    $session->regenerate();
    
    // Get user data
    $user = Authentication::user();
    unset($user['password']);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'user' => $user,
        'message' => 'Session refreshed'
    ]);
    
} catch (Exception $e) {
    error_log("Refresh API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred'
    ]);
}
