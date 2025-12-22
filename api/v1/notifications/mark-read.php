<?php
require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

$csrfMiddleware = new CsrfMiddleware();
$csrfMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $notificationService = new NotificationService();
    
    if (!empty($input['notification_id'])) {
        $notificationService->markAsRead($input['notification_id']);
    } else {
        $user = Authentication::user();
        $notificationService->markAllAsRead($user['id']);
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Notification(s) marked as read'
    ]);
    
} catch (Exception $e) {
    error_log("Mark notification read API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
