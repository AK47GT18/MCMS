<?php


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
        'approved_at'
    ];
    protected $timestamps = true;
    
    /**
     * Create approval request (FR-06)
     */
    public function createApprovalRequest($entityId, $entityType, $approverRole) {
        return $this->create([
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'requested_by' => Authentication::user()['id'],
            'approver_role' => $approverRole,
            'status' => 'pending'
        ]);
    }
    
    /**
     * Approve request
     */
    public function approve($approvalId, $approverId, $comments = null) {
        return $this->update($approvalId, [
            'status' => 'approved',
            'approver_id' => $approverId,
            'comments' => $comments,
            'approved_at' => date(DATETIME_FORMAT)
        ]);
    }
    
    /**
     * Reject request
     */
    public function reject($approvalId, $approverId, $comments) {
        return $this->update($approvalId, [
            'status' => 'rejected',
            'approver_id' => $approverId,
            'comments' => $comments,
            'approved_at' => date(DATETIME_FORMAT)
        ]);
    }
    
    /**
     * Get pending approvals for user role
     */
    public function getPendingApprovals($roleId) {
        return $this->where([
            'approver_role' => $roleId,
            'status' => 'pending'
        ]);
    }
}

// ============================================

/**
 * Budget Model
 * 
 * @file Budget.php
 * @description Budget management (FR-07, FR-24)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class Budget extends Model {
    protected $table = 'budgets';
    protected $primaryKey = 'id';
    protected $fillable = [
        'project_id',
        'category',
        'allocated_amount',
        'description'
    ];
    protected $timestamps = true;
    
    /**
     * Create budget allocation
     */
    public function createBudget($data) {
        return $this->create($data);
    }
    
    /**
     * Get budget by project and category
     */
    public function getProjectBudget($projectId, $category = null) {
        if ($category) {
            $result = $this->where([
                'project_id' => $projectId,
                'category' => $category
            ]);
            return $result ? $result[0] : null;
        }
        
        return $this->where(['project_id' => $projectId]);
    }
    
    /**
     * Calculate budget utilization (FR-24)
     */
    public function calculateUtilization($projectId, $category = null) {
        $sql = "SELECT 
                    b.category,
                    b.allocated_amount,
                    COALESCE(SUM(t.amount), 0) as spent,
                    b.allocated_amount - COALESCE(SUM(t.amount), 0) as remaining,
                    (COALESCE(SUM(t.amount), 0) / b.allocated_amount * 100) as percentage
                FROM budgets b
                LEFT JOIN transactions t ON b.project_id = t.project_id 
                    AND b.category = t.category 
                    AND t.status = ?
                WHERE b.project_id = ?";
        
        $params = [TRANSACTION_STATUS_APPROVED, $projectId];
        
        if ($category) {
            $sql .= " AND b.category = ?";
            $params[] = $category;
        }
        
        $sql .= " GROUP BY b.id, b.category, b.allocated_amount";
        
        return $this->db->query($sql, $params);
    }
}
