<?php

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $authService = new AuthService();
    $result = $authService->checkSession();
    
    http_response_code(200);
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log("Verify API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'authenticated' => false,
        'user' => null
    ]);
}