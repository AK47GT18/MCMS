<?php
class AuditRepository {
    
    private $db;
    private $table = 'audit_logs';
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Create immutable audit log entry (FR-25)
     */
    public function create($data) {
        $sql = "INSERT INTO {$this->table}
                (user_id, action, entity_type, entity_id, details, ip_address, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())";
        
        return $this->db->execute($sql, [
            $data['user_id'] ?? null,
            $data['action'],
            $data['entity_type'] ?? null,
            $data['entity_id'] ?? null,
            $data['details'] ?? null,
            $data['ip_address'] ?? $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    }
    
    /**
     * Get audit logs with filters (FR-16)
     */
    public function getAll($filters = [], $page = 1, $perPage = 50) {
        $offset = ($page - 1) * $perPage;
        
        $sql = "SELECT a.id, a.action, a.entity_type, a.entity_id,
                       a.details, a.ip_address, a.created_at,
                       CONCAT(u.first_name, ' ', u.last_name) as user_name,
                       u.username
                FROM {$this->table} a
                LEFT JOIN users u ON a.user_id = u.id
                WHERE 1=1";
        
        $params = [];
        
        if (!empty($filters['user_id'])) {
            $sql .= " AND a.user_id = ?";
            $params[] = $filters['user_id'];
        }
        
        if (!empty($filters['action'])) {
            $sql .= " AND a.action = ?";
            $params[] = $filters['action'];
        }
        
        if (!empty($filters['entity_type'])) {
            $sql .= " AND a.entity_type = ?";
            $params[] = $filters['entity_type'];
        }
        
        if (!empty($filters['entity_id'])) {
            $sql .= " AND a.entity_id = ?";
            $params[] = $filters['entity_id'];
        }
        
        if (!empty($filters['date_from'])) {
            $sql .= " AND a.created_at >= ?";
            $params[] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $sql .= " AND a.created_at <= ?";
            $params[] = $filters['date_to'];
        }
        
        if (!empty($filters['ip_address'])) {
            $sql .= " AND a.ip_address = ?";
            $params[] = $filters['ip_address'];
        }
        
        $countSql = "SELECT COUNT(*) as total FROM ({$sql}) as counted";
        $totalResult = $this->db->query($countSql, $params);
        $total = $totalResult[0]['total'] ?? 0;
        
        $sql .= " ORDER BY a.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $perPage;
        $params[] = $offset;
        
        $logs = $this->db->query($sql, $params);
        
        return [
            'data' => $logs,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage)
        ];
    }
    
    /**
     * Get audit trail for specific entity (FR-25)
     */
    public function getEntityAuditTrail($entityType, $entityId) {
        $sql = "SELECT a.id, a.action, a.details, a.ip_address, a.created_at,
                       CONCAT(u.first_name, ' ', u.last_name) as user_name,
                       u.username
                FROM {$this->table} a
                LEFT JOIN users u ON a.user_id = u.id
                WHERE a.entity_type = ? AND a.entity_id = ?
                ORDER BY a.created_at DESC";
        
        return $this->db->query($sql, [$entityType, $entityId]);
    }
    
    /**
     * Get login attempts (FR-16)
     */
    public function getLoginAttempts($username = null, $days = 7) {
        $sql = "SELECT a.id, a.details, a.ip_address, a.created_at
                FROM {$this->table} a
                WHERE a.action = 'login_attempt'
                  AND a.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
        
        $params = [$days];
        
        if ($username) {
            $sql .= " AND JSON_EXTRACT(a.details, '$.username') = ?";
            $params[] = $username;
        }
        
        $sql .= " ORDER BY a.created_at DESC";
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Get failed login attempts
     */
    public function getFailedLoginAttempts($days = 7) {
        $sql = "SELECT a.details, a.ip_address, a.created_at,
                       COUNT(*) as attempt_count
                FROM {$this->table} a
                WHERE a.action = 'login_attempt'
                  AND JSON_EXTRACT(a.details, '$.success') = false
                  AND a.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY a.ip_address, DATE(a.created_at)
                HAVING attempt_count >= 3
                ORDER BY attempt_count DESC, a.created_at DESC";
        
        return $this->db->query($sql, [$days]);
    }
    
    /**
     * Get security events
     */
    public function getSecurityEvents($days = 7) {
        $sql = "SELECT a.id, a.action, a.details, a.ip_address, a.created_at,
                       CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM {$this->table} a
                LEFT JOIN users u ON a.user_id = u.id
                WHERE a.action IN ('login_attempt', 'logout', 'session_timeout', 
                                   'password_changed', 'password_reset',
                                   'authorization_failed', 'csrf_validation_failed',
                                   'rate_limit_exceeded')
                  AND a.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                ORDER BY a.created_at DESC";
        
        return $this->db->query($sql, [$days]);
    }
    
    /**
     * Get user activity summary
     */
    public function getUserActivitySummary($userId, $days = 30) {
        $sql = "SELECT 
                    DATE(a.created_at) as activity_date,
                    COUNT(*) as action_count,
                    COUNT(DISTINCT a.action) as unique_actions
                FROM {$this->table} a
                WHERE a.user_id = ?
                  AND a.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(a.created_at)
                ORDER BY activity_date DESC";
        
        return $this->db->query($sql, [$userId, $days]);
    }
    
    /**
     * Get system statistics
     */
    public function getStatistics($days = 7) {
        $sql = "SELECT 
                    COUNT(*) as total_events,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT ip_address) as unique_ips,
                    COUNT(CASE WHEN action = 'login_attempt' THEN 1 END) as login_attempts,
                    COUNT(CASE WHEN action LIKE '%failed%' THEN 1 END) as failed_actions
                FROM {$this->table}
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
        
        $result = $this->db->query($sql, [$days]);
        return $result[0] ?? [];
    }
    
    /**
     * Prevent deletion of audit logs (FR-25)
     * This method intentionally throws an exception
     */
    public function delete($id) {
        throw new Exception("Audit logs cannot be deleted ");
    }
    
    /**
     * Archive old audit logs (NFR-04 - 2 year retention)
     * Move logs older than 2 years to archive table
     */
    public function archiveOldLogs() {
        // Copy to archive
        $sql = "INSERT INTO audit_logs_archive
                SELECT * FROM {$this->table}
                WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 YEAR)";
        
        $this->db->execute($sql);
        
        // Delete from main table after successful archive
        $sql = "DELETE FROM {$this->table}
                WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 YEAR)";
        
        return $this->db->execute($sql);
    }
}