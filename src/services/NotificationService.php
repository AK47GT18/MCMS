<?php
namespace Mkaka\Services;

use Mkaka\Core\Database;

class NotificationService {
    
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Send notification to user (FR-23)
     */
    public function notify($data) {
        $sql = "INSERT INTO notifications
                (user_id, title, message, type, entity_id, priority, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())";
        
        $this->db->execute($sql, [
            $data['user_id'] ?? null,
            $data['title'],
            $data['message'],
            $data['type'] ?? 'general',
            $data['entity_id'] ?? null,
            $data['priority'] ?? 'normal'
        ]);
        
        // Send email notification if email provided
        if (!empty($data['email'])) {
            $emailService = new EmailService();
            $emailService->sendNotification($data);
        }
        
        return true;
    }
    
    /**
     * Send notification to multiple users
     */
    public function notifyMultiple($userIds, $data) {
        foreach ($userIds as $userId) {
            $data['user_id'] = $userId;
            $this->notify($data);
        }
        
        return true;
    }
    
    /**
     * Get unread notifications for user
     */
    public function getUnread($userId, $limit = 10) {
        $sql = "SELECT * FROM notifications
                WHERE user_id = ? AND read_at IS NULL
                ORDER BY created_at DESC
                LIMIT ?";
        
        return $this->db->query($sql, [$userId, $limit]);
    }
    
    /**
     * Mark notification as read
     */
    public function markAsRead($notificationId) {
        $sql = "UPDATE notifications 
                SET read_at = NOW()
                WHERE id = ?";
        
        return $this->db->execute($sql, [$notificationId]);
    }
    
    /**
     * Mark all notifications as read for user
     */
    public function markAllAsRead($userId) {
        $sql = "UPDATE notifications
                SET read_at = NOW()
                WHERE user_id = ? AND read_at IS NULL";
        
        return $this->db->execute($sql, [$userId]);
    }
}
