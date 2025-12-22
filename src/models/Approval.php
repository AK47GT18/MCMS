<?php
namespace Mkaka\Models;

use Mkaka\Core\Model;

/**
 * Approval Model - Complete Implementation
 * 
 * @file Approval.php
 * @description Approval workflow management (FR-06)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class Approval extends Model {
    protected $table = 'approvals';
    protected $primaryKey = 'id';
    protected $fillable = [
        'entity_type',
        'entity_id',
        'requested_by',
        'approver_role',
        'approver_id',
        'status',
        'comments',
        'approved_at',
        'rejection_reason'
    ];
    protected $timestamps = true;
    
    /**
     * Create approval request (FR-06)
     */
    public function createApprovalRequest($entityId, $entityType, $approverRole) {
        $requestedBy = Authentication::user()['id'];
        
        $approvalId = $this->create([
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'requested_by' => $requestedBy,
            'approver_role' => $approverRole,
            'status' => 'pending'
        ]);
        
        // Log approval request
        $auditLog = new AuditLog();
        $auditLog->create([
            'user_id' => $requestedBy,
            'action' => 'approval_requested',
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => json_encode([
                'approver_role' => $approverRole,
                'approval_id' => $approvalId
            ]),
            'ip_address' => $_SERVER['REMOTE_ADDR']
        ]);
        
        return $approvalId;
    }
    
    /**
     * Approve request
     */
    public function approve($approvalId, $approverId, $comments = null) {
        $approval = $this->find($approvalId);
        
        if (!$approval) {
            throw new Exception("Approval request not found");
        }
        
        if ($approval['status'] != 'pending') {
            throw new Exception("Approval request is not pending");
        }
        
        $this->db->beginTransaction();
        
        try {
            // Update approval record
            $this->update($approvalId, [
                'status' => 'approved',
                'approver_id' => $approverId,
                'comments' => $comments,
                'approved_at' => date(DATETIME_FORMAT)
            ]);
            
            // Log approval
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => $approverId,
                'action' => 'approval_granted',
                'entity_type' => $approval['entity_type'],
                'entity_id' => $approval['entity_id'],
                'details' => json_encode([
                    'approval_id' => $approvalId,
                    'comments' => $comments
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ]);
            
            // Notify requester
            $this->notifyRequester($approval, 'approved', $comments);
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Reject request
     */
    public function reject($approvalId, $approverId, $reason) {
        $approval = $this->find($approvalId);
        
        if (!$approval) {
            throw new Exception("Approval request not found");
        }
        
        if ($approval['status'] != 'pending') {
            throw new Exception("Approval request is not pending");
        }
        
        if (empty($reason)) {
            throw new Exception("Rejection reason is required");
        }
        
        $this->db->beginTransaction();
        
        try {
            // Update approval record
            $this->update($approvalId, [
                'status' => 'rejected',
                'approver_id' => $approverId,
                'rejection_reason' => $reason,
                'approved_at' => date(DATETIME_FORMAT)
            ]);
            
            // Log rejection
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => $approverId,
                'action' => 'approval_rejected',
                'entity_type' => $approval['entity_type'],
                'entity_id' => $approval['entity_id'],
                'details' => json_encode([
                    'approval_id' => $approvalId,
                    'reason' => $reason
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ]);
            
            // Notify requester
            $this->notifyRequester($approval, 'rejected', $reason);
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Get pending approvals for user role
     */
    public function getPendingForRole($roleId, $limit = 50) {
        $sql = "SELECT a.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as requested_by_name,
                       CASE 
                           WHEN a.entity_type = 'transaction' THEN t.transaction_code
                           WHEN a.entity_type = 'project' THEN p.project_name
                           WHEN a.entity_type = 'contract' THEN c.contract_code
                           ELSE NULL
                       END as entity_name,
                       DATEDIFF(NOW(), a.created_at) as days_pending
                FROM {$this->table} a
                LEFT JOIN users u ON a.requested_by = u.id
                LEFT JOIN transactions t ON a.entity_type = 'transaction' AND a.entity_id = t.id
                LEFT JOIN projects p ON a.entity_type = 'project' AND a.entity_id = p.id
                LEFT JOIN contracts c ON a.entity_type = 'contract' AND a.entity_id = c.id
                WHERE a.approver_role = ? 
                  AND a.status = 'pending'
                ORDER BY a.created_at ASC
                LIMIT ?";
        
        return $this->db->query($sql, [$roleId, $limit]);
    }
    
    /**
     * Get pending approvals for specific user
     */
    public function getPendingForUser($userId, $limit = 50) {
        $user = (new User())->find($userId);
        
        if (!$user) {
            throw new Exception("User not found");
        }
        
        return $this->getPendingForRole($user['role_id'], $limit);
    }
    
    /**
     * Get approval history for entity
     */
    public function getEntityHistory($entityType, $entityId) {
        $sql = "SELECT a.*, 
                       CONCAT(u1.first_name, ' ', u1.last_name) as requested_by_name,
                       CONCAT(u2.first_name, ' ', u2.last_name) as approver_name,
                       r.role_name as approver_role_name
                FROM {$this->table} a
                LEFT JOIN users u1 ON a.requested_by = u1.id
                LEFT JOIN users u2 ON a.approver_id = u2.id
                LEFT JOIN roles r ON a.approver_role = r.id
                WHERE a.entity_type = ? AND a.entity_id = ?
                ORDER BY a.created_at DESC";
        
        return $this->db->query($sql, [$entityType, $entityId]);
    }
    
    /**
     * Get approval statistics
     */
    public function getStatistics($roleId = null, $days = 30) {
        $sql = "SELECT 
                    COUNT(*) as total_approvals,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    AVG(TIMESTAMPDIFF(HOUR, created_at, approved_at)) as avg_approval_time_hours
                FROM {$this->table}
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
        
        $params = [$days];
        
        if ($roleId) {
            $sql .= " AND approver_role = ?";
            $params[] = $roleId;
        }
        
        $result = $this->db->query($sql, $params);
        return $result ? $result[0] : null;
    }
    
    /**
     * Get overdue approvals (pending > 24 hours)
     */
    public function getOverdue($roleId = null) {
        $sql = "SELECT a.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as requested_by_name,
                       TIMESTAMPDIFF(HOUR, a.created_at, NOW()) as hours_pending
                FROM {$this->table} a
                LEFT JOIN users u ON a.requested_by = u.id
                WHERE a.status = 'pending'
                  AND a.created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)";
        
        $params = [];
        
        if ($roleId) {
            $sql .= " AND a.approver_role = ?";
            $params[] = $roleId;
        }
        
        $sql .= " ORDER BY a.created_at ASC";
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Notify requester of approval decision
     */
    private function notifyRequester($approval, $status, $message = null) {
        $notification = new Notification();
        
        $title = $status == 'approved' ? 'Approval Granted' : 'Approval Rejected';
        $notificationMessage = $status == 'approved' 
            ? "Your {$approval['entity_type']} request has been approved"
            : "Your {$approval['entity_type']} request has been rejected: {$message}";
        
        return $notification->create([
            'user_id' => $approval['requested_by'],
            'notification_type' => "approval_{$status}",
            'title' => $title,
            'message' => $notificationMessage,
            'entity_type' => $approval['entity_type'],
            'entity_id' => $approval['entity_id'],
            'is_read' => 0,
            'priority' => 'high'
        ]);
    }
    
    /**
     * Cancel approval request (by requester only)
     */
    public function cancel($approvalId, $userId) {
        $approval = $this->find($approvalId);
        
        if (!$approval) {
            throw new Exception("Approval request not found");
        }
        
        if ($approval['requested_by'] != $userId) {
            throw new Exception("Only the requester can cancel an approval");
        }
        
        if ($approval['status'] != 'pending') {
            throw new Exception("Only pending approvals can be cancelled");
        }
        
        return $this->update($approvalId, [
            'status' => 'cancelled',
            'comments' => 'Cancelled by requester'
        ]);
    }
}