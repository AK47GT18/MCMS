<?php
/**
 * GET /api/v1/users/profile
 * Get current user's profile
 * 
 * @requires Authentication
 * @response JSON
 *   - success: boolean
 *   - profile: object (current user details without password)
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
    $currentUser = Authentication::user();
    
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    // Get full user data
    $userRepo = new UserRepository();
    $profile = $userRepo->find($currentUser['id']);
    
    if (!$profile) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }
    
    // Remove password
    unset($profile['password']);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'profile' => $profile
    ]);
    
} catch (Exception $e) {
    error_log("Get profile API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred'
    ]);
}
