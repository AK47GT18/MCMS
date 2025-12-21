<?php
class ApprovalService {
    
    private $db;
    private $notificationService;
    private $auditService;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->notificationService = new NotificationService();
        $this->auditService = new AuditService();
    }
    
    /**
     * Create approval request (FR-06)
     */
    public function createApprovalRequest($entityType, $entityId, $approverIds) {
        $requester = Authentication::user();
        
        foreach ($approverIds as $approverId) {
            $sql = "INSERT INTO approvals
                    (entity_type, entity_id, approver_id, requested_by, 
                     status, created_at)
                    VALUES (?, ?, ?, ?, 'pending', NOW())";
            
            $this->db->execute($sql, [
                $entityType,
                $entityId,
                $approverId,
                $requester['id']
            ]);
            
            // Send notification (FR-23)
            $this->notificationService->notify([
                'user_id' => $approverId,
                'title' => 'Approval Request',
                'message' => "You have a new {$entityType} approval request",
                'type' => 'approval',
                'entity_id' => $entityId,
                'priority' => 'high'
            ]);
        }
        
        return true;
    }
    
    /**
     * Get pending approvals for user
     */
    public function getPendingApprovals($userId) {
        $sql = "SELECT a.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as requested_by_name
                FROM approvals a
                LEFT JOIN users u ON a.requested_by = u.id
                WHERE a.approver_id = ? 
                  AND a.status = 'pending'
                ORDER BY a.created_at DESC";
        
        return $this->db->query($sql, [$userId]);
    }
}
