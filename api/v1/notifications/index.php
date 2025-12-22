<?php
/**
 * GET /api/v1/notifications
 * Get user notifications with filter and pagination
 * 
 * @requires Authentication
 * @query int page (optional, default: 1)
 * @query int per_page (optional, default: 20)
 * @query string filter (optional: all, unread, read)
 * @query string type (optional: filter by notification type)
 * 
 * @response JSON
 *   - success: boolean
 *   - data: array
 *   - pagination: object
 *   - unread_count: int
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
    $user = Authentication::user();
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 20;
    $filter = $_GET['filter'] ?? 'all'; // all, unread, read
    $type = $_GET['type'] ?? null;
    
    // Validate filter
    if (!in_array($filter, ['all', 'unread', 'read'])) {
        $filter = 'all';
    }
    
    $notificationRepo = new NotificationRepository();
    $filters = ['user_id' => $user['id']];
    
    if ($filter === 'unread') {
        $filters['is_read'] = false;
    } elseif ($filter === 'read') {
        $filters['is_read'] = true;
    }
    
    if ($type) {
        $filters['type'] = $type;
    }
    
    $result = $notificationRepo->getAll($filters, $page, $perPage);
    
    // Get unread count
    $unreadCount = $notificationRepo->countUnread($user['id']);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $result['data'],
        'pagination' => [
            'page' => $result['page'],
            'per_page' => $result['per_page'],
            'total' => $result['total'],
            'total_pages' => $result['total_pages']
        ],
        'unread_count' => $unreadCount
    ]);
    
} catch (Exception $e) {
    error_log("Notifications API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}