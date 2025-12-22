<?php
namespace Mkaka\Models;

use Mkaka\Core\Model;

/**
 * AuditLog Model - Complete Implementation
 * 
 * @file AuditLog.php
 * @description Immutable audit trail (FR-05, FR-16, FR-25, NFR-04)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class AuditLog extends Model {
    protected $table = 'audit_logs';
    protected $primaryKey = 'id';
    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'details',
        'ip_address',
        'user_agent'
    ];
    protected $timestamps = true;
    
    /**
     * Create audit log entry (FR-05, FR-16)
     * Audit logs are immutable by design
     */
    public function create($data) {
        // Add user agent if not provided
        if (!isset($data['user_agent'])) {
            $data['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? null;
        }
        
        // Add timestamp explicitly
        $data['created_at'] = date(DATETIME_FORMAT);
        
        // Audit logs are immutable - only create allowed
        return parent::create($data);
    }
    
    /**
     * Override update to prevent modification (FR-25)
     * Audit logs MUST be immutable for compliance
     */
    public function update($id, $data) {
        throw new Exception("Audit log records cannot be modified (FR-25 compliance)");
    }
    
    /**
     * Override delete to prevent deletion (FR-25)
     * Audit logs MUST be immutable for compliance
     */
    public function delete($id) {
        throw new Exception("Audit log records cannot be deleted (FR-25 compliance)");
    }
    
    /**
     * Get audit trail for specific entity
     */
    public function getEntityAuditTrail($entityType, $entityId, $limit = 100) {
        $sql = "SELECT al.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as user_name,
                       u.email as user_email,
                       r.role_name
                FROM {$this->table} al
                LEFT JOIN users u ON al.user_id = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE al.entity_type = ? AND al.entity_id = ?
                ORDER BY al.created_at DESC
                LIMIT ?";
        
        return $this->db->query($sql, [$entityType, $entityId, $limit]);
    }
    
    /**
     * Get user activity log
     */
    public function getUserActivity($userId, $startDate = null, $endDate = null, $limit = 100) {
        $sql = "SELECT al.*, 
                       CASE 
                           WHEN al.entity_type = 'project' THEN p.project_name
                           WHEN al.entity_type = 'transaction' THEN t.transaction_code
                           WHEN al.entity_type = 'contract' THEN c.contract_code
                           ELSE NULL
                       END as entity_name
                FROM {$this->table} al
                LEFT JOIN projects p ON al.entity_type = 'project' AND al.entity_id = p.id
                LEFT JOIN transactions t ON al.entity_type = 'transaction' AND al.entity_id = t.id
                LEFT JOIN contracts c ON al.entity_type = 'contract' AND al.entity_id = c.id
                WHERE al.user_id = ?";
        
        $params = [$userId];
        
        if ($startDate) {
            $sql .= " AND DATE(al.created_at) >= ?";
            $params[] = $startDate;
        }
        
        if ($endDate) {
            $sql .= " AND DATE(al.created_at) <= ?";
            $params[] = $endDate;
        }
        
        $sql .= " ORDER BY al.created_at DESC LIMIT ?";
        $params[] = $limit;
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Get recent system activity
     */
    public function getRecentActivity($limit = 50) {
        $sql = "SELECT al.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as user_name,
                       r.role_name
                FROM {$this->table} al
                LEFT JOIN users u ON al.user_id = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                ORDER BY al.created_at DESC
                LIMIT ?";
        
        return $this->db->query($sql, [$limit]);
    }
    
    /**
     * Get activity by action type
     */
    public function getByAction($action, $startDate = null, $endDate = null, $limit = 100) {
        $sql = "SELECT al.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM {$this->table} al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.action = ?";
        
        $params = [$action];
        
        if ($startDate) {
            $sql .= " AND DATE(al.created_at) >= ?";
            $params[] = $startDate;
        }
        
        if ($endDate) {
            $sql .= " AND DATE(al.created_at) <= ?";
            $params[] = $endDate;
        }
        
        $sql .= " ORDER BY al.created_at DESC LIMIT ?";
        $params[] = $limit;
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Get failed login attempts (FR-16)
     */
    public function getFailedLogins($hoursBack = 24, $limit = 100) {
        $sql = "SELECT al.*, 
                       JSON_EXTRACT(al.details, '$.username') as username,
                       JSON_EXTRACT(al.details, '$.ip_address') as attempt_ip
                FROM {$this->table} al
                WHERE al.action = 'login_attempt'
                  AND JSON_EXTRACT(al.details, '$.success') = false
                  AND al.created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
                ORDER BY al.created_at DESC
                LIMIT ?";
        
        return $this->db->query($sql, [$hoursBack, $limit]);
    }
    
    /**
     * Get suspicious activity (multiple actions in short time)
     */
    public function getSuspiciousActivity($threshold = 10, $minutes = 5) {
        $sql = "SELECT user_id, 
                       COUNT(*) as action_count,
                       CONCAT(u.first_name, ' ', u.last_name) as user_name,
                       MIN(created_at) as first_action,
                       MAX(created_at) as last_action
                FROM {$this->table} al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
                GROUP BY al.user_id
                HAVING action_count > ?
                ORDER BY action_count DESC";
        
        return $this->db->query($sql, [$minutes, $threshold]);
    }
    
    /**
     * Generate audit report for date range
     */
    public function generateReport($startDate, $endDate) {
        $sql = "SELECT 
                    al.action,
                    COUNT(*) as count,
                    COUNT(DISTINCT al.user_id) as unique_users,
                    MIN(al.created_at) as first_occurrence,
                    MAX(al.created_at) as last_occurrence
                FROM {$this->table} al
                WHERE DATE(al.created_at) BETWEEN ? AND ?
                GROUP BY al.action
                ORDER BY count DESC";
        
        return $this->db->query($sql, [$startDate, $endDate]);
    }
    
    /**
     * Clean old audit logs (NFR-04 - 2 year retention)
     * This is the ONLY way to remove audit logs
     */
    public function cleanOldLogs() {
        $retentionDate = date('Y-m-d', strtotime('-' . AUDIT_RETENTION_DAYS . ' days'));
        
        // Get count before deletion for reporting
        $countSql = "SELECT COUNT(*) as count FROM {$this->table} WHERE DATE(created_at) < ?";
        $countResult = $this->db->query($countSql, [$retentionDate]);
        $deletedCount = $countResult[0]['count'];
        
        // Delete old records
        $sql = "DELETE FROM {$this->table} WHERE DATE(created_at) < ?";
        $this->db->execute($sql, [$retentionDate]);
        
        // Log the cleanup action
        parent::create([
            'user_id' => null,
            'action' => 'audit_log_cleanup',
            'entity_type' => 'system',
            'entity_id' => null,
            'details' => json_encode([
                'deleted_count' => $deletedCount,
                'retention_date' => $retentionDate
            ]),
            'ip_address' => $_SERVER['SERVER_ADDR'] ?? 'system'
        ]);
        
        return $deletedCount;
    }
    
    /**
     * Get audit log statistics
     */
    public function getStatistics($days = 30) {
        $sql = "SELECT 
                    COUNT(*) as total_logs,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT action) as unique_actions,
                    COUNT(DISTINCT DATE(created_at)) as days_with_activity,
                    MIN(created_at) as oldest_log,
                    MAX(created_at) as newest_log
                FROM {$this->table}
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
        
        $result = $this->db->query($sql, [$days]);
        return $result ? $result[0] : null;
    }
}