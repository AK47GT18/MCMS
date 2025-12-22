<?php
/**
 * WebSocket/SSE Server-Sent Events endpoint for real-time notifications
 * GET /api/v1/notifications/subscribe
 * 
 * @requires Authentication
 * @query string channel (optional: specific channel to subscribe to)
 * 
 * @response Server-Sent Events stream
 *   - event: notification_created | notification_read | notification_deleted
 *   - data: JSON
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

// Disable buffering for SSE
if (ob_get_level()) ob_end_clean();
@ob_implicit_flush(1);

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('Access-Control-Allow-Origin: *');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo "retry: 3000\n\n";
    exit;
}

try {
    $user = Authentication::user();
    $channel = $_GET['channel'] ?? 'user_' . $user['id'];
    $lastEventId = (int)($_SERVER['HTTP_LAST_EVENT_ID'] ?? 0);
    
    // Store subscription in Redis
    $redisKey = 'notification_subscription:' . $user['id'];
    $redis = Redis::getInstance();
    $redis->setex($redisKey, 300, $channel); // 5 minute timeout
    
    // Send initial connection message
    echo "event: connected\n";
    echo "id: " . time() . "\n";
    echo "data: " . json_encode([
        'message' => 'Connected to notification stream',
        'user_id' => $user['id'],
        'channel' => $channel
    ]) . "\n\n";
    flush();
    
    // Keep connection alive and listen for new notifications
    $notificationRepo = new NotificationRepository();
    $pollInterval = 2; // seconds
    $maxDuration = 300; // 5 minutes
    $startTime = time();
    
    while ((time() - $startTime) < $maxDuration) {
        // Check for new notifications since last event
        $newNotifications = $notificationRepo->getNewSince($user['id'], $lastEventId);
        
        if ($newNotifications) {
            foreach ($newNotifications as $notification) {
                echo "event: notification_created\n";
                echo "id: " . $notification['id'] . "\n";
                echo "data: " . json_encode($notification) . "\n\n";
                flush();
                
                $lastEventId = $notification['id'];
            }
        }
        
        // Send heartbeat to keep connection alive
        echo ": heartbeat\n";
        echo "data: " . json_encode(['timestamp' => time()]) . "\n\n";
        flush();
        
        // Check if client closed connection
        if (connection_aborted()) {
            // Clean up subscription
            $redis->del($redisKey);
            exit;
        }
        
        // Sleep before next poll
        sleep($pollInterval);
    }
    
    // Connection timeout, send close message
    echo "event: connection_closed\n";
    echo "data: " . json_encode(['message' => 'Connection timeout']) . "\n\n";
    flush();
    
    // Clean up
    $redis->del($redisKey);
    
} catch (Exception $e) {
    error_log("Notification subscribe API error: " . $e->getMessage());
    echo "event: error\n";
    echo "data: " . json_encode(['error' => 'An error occurred']) . "\n\n";
    flush();
}
