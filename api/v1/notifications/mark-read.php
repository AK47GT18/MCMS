<?php
/**
 * PUT /api/v1/notifications/:id/mark-read
 * Mark notification(s) as read
 * 
 * @requires Authentication
 * @param int id Notification ID (optional if marking all)
 * @request JSON
 *   - all: boolean (optional - if true, marks all notifications as read)
 * 
 * @response JSON
 *   - success: boolean
 *   - message: string
 *   - marked_count: int
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $csrfMiddleware = new CsrfMiddleware();
    $csrfMiddleware->handle();
    
    $user = Authentication::user();
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    $notificationRepo = new NotificationRepository();
    $markedCount = 0;
    
    // If marking all as read
    if (!empty($input['all'])) {
        $markedCount = $notificationRepo->markAllAsRead($user['id']);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'All notifications marked as read',
            'marked_count' => $markedCount
        ]);
        exit;
    }
    
    // If marking specific notification
    $notificationId = (int)($_GET['id'] ?? 0);
    if (!$notificationId && !empty($input['notification_id'])) {
        $notificationId = (int)$input['notification_id'];
    }
    
    if (!$notificationId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Notification ID required']);
        exit;
    }
    
    $notification = $notificationRepo->find($notificationId);
    
    if (!$notification) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Notification not found']);
        exit;
    }
    
    // Check if notification belongs to user
    if ($notification['user_id'] !== $user['id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'You do not have permission to modify this notification']);
        exit;
    }
    
    // Mark as read if not already
    if (!$notification['is_read']) {
        $notificationRepo->update($notificationId, [
            'is_read' => true,
            'read_at' => date('Y-m-d H:i:s')
        ]);
        $markedCount = 1;
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Notification marked as read',
        'marked_count' => $markedCount
    ]);
    
} catch (Exception $e) {
    error_log("Mark notification read API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
