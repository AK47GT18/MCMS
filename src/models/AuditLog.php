<?php
/**
 * AuditLog Model
 * 
 * @file AuditLog.php
 * @description Immutable audit trail (FR-05, FR-16, FR-25, NFR-04)
 * @author Anthony Kanjira (CEN/01/01/22)
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
     * Create audit log entry (immutable - FR-25)
     */
    public function create($data) {
        // Add user agent if not provided
        if (!isset($data['user_agent'])) {
            $data['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? null;
        }
        
        // Audit logs are immutable - no updates allowed
        return parent::create($data);
    }
    
    /**
     * Override update to prevent modification (FR-25)
     */
    public function update($id, $data) {
        throw new Exception("Audit log records cannot be modified");
    }
    
    /**
     * Override delete to prevent deletion (FR-25)
     */
    public function delete($id) {
        throw new Exception("Audit log records cannot be deleted");
    }
    
    /**
     * Get audit trail for entity
     */
    public function getEntityAuditTrail($entityType, $entityId) {
        $sql = "SELECT al.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as user_name,
                       r.role_name
                FROM {$this->table} al
                LEFT JOIN users u ON al.user_id = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE al.entity_type = ? AND al.entity_id = ?
                ORDER BY al.created_at DESC";
        
        return $this->db->query($sql, [$entityType, $entityId]);
    }
    
    /**
     * Get user activity log
     */
    public function getUserActivity($userId, $startDate = null, $endDate = null) {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = ?";
        $params = [$userId];
        
        if ($startDate) {
            $sql .= " AND DATE(created_at) >= ?";
            $params[] = $startDate;
        }
        
        if ($endDate) {
            $sql .= " AND DATE(created_at) <= ?";
            $params[] = $endDate;
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Get recent system activity
     */
    public function getRecentActivity($limit = 50) {
        $sql = "SELECT al.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM {$this->table} al
                LEFT JOIN users u ON al.user_id = u.id
                ORDER BY al.created_at DESC
                LIMIT ?";
        
        return $this->db->query($sql, [$limit]);
    }
    
    /**
     * Clean old audit logs (NFR-04 - 2 year retention)
     */
    public function cleanOldLogs() {
        $retentionDate = date('Y-m-d', strtotime('-' . AUDIT_RETENTION_DAYS . ' days'));
        
        $sql = "DELETE FROM {$this->table} WHERE DATE(created_at) < ?";
        return $this->db->execute($sql, [$retentionDate]);
    }
}
    