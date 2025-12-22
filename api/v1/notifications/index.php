<?php
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
    $user = Authentication::user();
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    
    $notificationService = new NotificationService();
    $notifications = $notificationService->getUnread($user['id'], $limit);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $notifications,
        'count' => count($notifications)
    ]);
    
} catch (Exception $e) {
    error_log("Notifications API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}