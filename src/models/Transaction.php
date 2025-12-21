<?php
/**
 * Transaction Model
 * 
 * @file Transaction.php
 * @description Financial transaction management (FR-05, FR-06, FR-07, FR-08, FR-20)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class Transaction extends Model {
    protected $table = 'transactions';
    protected $primaryKey = 'id';
    protected $fillable = [
        'transaction_code',
        'project_id',
        'transaction_type',
        'amount',
        'vendor_name',
        'vendor_id',
        'description',
        'category',
        'status',
        'submitted_by',
        'approved_by',
        'approved_at',
        'payment_date',
        'payment_method',
        'reference_number',
        'supporting_documents'
    ];
    protected $timestamps = true;
    
    // Approval thresholds (MWK)
    const THRESHOLD_LOW = 500000;      // 500K - No approval needed
    const THRESHOLD_MEDIUM = 5000000;  // 5M - Finance Officer approval
    const THRESHOLD_HIGH = 20000000;   // 20M - Operations Manager approval
    const THRESHOLD_CRITICAL = 50000000; // 50M - Managing Director approval
    
    /**
     * Create transaction with audit trail (FR-05)
     */
    public function createTransaction($data) {
        // Generate transaction code
        $data['transaction_code'] = $this->generateTransactionCode($data['transaction_type']);
        $data['status'] = TRANSACTION_STATUS_DRAFT;
        $data['submitted_by'] = Authentication::user()['id'];
        
        // Start database transaction
        $this->db->beginTransaction();
        
        try {
            $transactionId = $this->create($data);
            
            // Create audit trail entry (FR-05)
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => $data['submitted_by'],
                'action' => 'transaction_created',
                'entity_type' => 'transaction',
                'entity_id' => $transactionId,
                'details' => json_encode([
                    'transaction_code' => $data['transaction_code'],
                    'amount' => $data['amount'],
                    'vendor' => $data['vendor_name']
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ]);
            
            $this->db->commit();
            return $transactionId;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Generate unique transaction code
     */
    private function generateTransactionCode($type) {
        $prefix = strtoupper(substr($type, 0, 3));
        $year = date('Y');
        $month = date('m');
        
        $sql = "SELECT COUNT(*) as count FROM {$this->table} 
                WHERE transaction_code LIKE ?";
        $result = $this->db->query($sql, ["{$prefix}-{$year}{$month}-%"]);
        $count = $result[0]['count'] + 1;
        
        return sprintf("%s-%s%s-%05d", $prefix, $year, $month, $count);
    }
    
    /**
     * Submit transaction for approval (FR-06)
     */
    public function submitForApproval($transactionId) {
        $transaction = $this->find($transactionId);
        
        if (!$transaction) {
            throw new Exception("Transaction not found");
        }
        
        // Check if transaction requires approval
        $requiresApproval = $transaction['amount'] > self::THRESHOLD_LOW;
        
        $newStatus = $requiresApproval ? TRANSACTION_STATUS_PENDING : TRANSACTION_STATUS_APPROVED;
        
        $this->update($transactionId, ['status' => $newStatus]);
        
        if ($requiresApproval) {
            // Create approval request
            $approval = new Approval();
            $approval->createApprovalRequest($transactionId, 'transaction', $this->getRequiredApprover($transaction['amount']));
            
            // Send notification (FR-23)
            $this->sendApprovalNotification($transactionId);
        }
        
        return $newStatus;
    }
    
    /**
     * Get required approver based on amount (FR-06)
     */
    private function getRequiredApprover($amount) {
        if ($amount >= self::THRESHOLD_CRITICAL) {
            return ROLE_MANAGING_DIRECTOR;
        } elseif ($amount >= self::THRESHOLD_HIGH) {
            return ROLE_OPERATIONS_MANAGER;
        } else {
            return ROLE_FINANCE_OFFICER;
        }
    }
    
    /**
     * Approve transaction (FR-06)
     */
    public function approveTransaction($transactionId, $approverId) {
        $this->db->beginTransaction();
        
        try {
            $this->update($transactionId, [
                'status' => TRANSACTION_STATUS_APPROVED,
                'approved_by' => $approverId,
                'approved_at' => date(DATETIME_FORMAT)
            ]);
            
            // Log approval
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => $approverId,
                'action' => 'transaction_approved',
                'entity_type' => 'transaction',
                'entity_id' => $transactionId,
                'details' => json_encode(['status' => 'approved']),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ]);
            
            // Check budget alerts (FR-07)
            $this->checkBudgetAlerts($transactionId);
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Reject transaction
     */
    public function rejectTransaction($transactionId, $approverId, $reason) {
        $this->update($transactionId, [
            'status' => TRANSACTION_STATUS_REJECTED,
            'approved_by' => $approverId,
            'approved_at' => date(DATETIME_FORMAT)
        ]);
        
        // Log rejection
        $auditLog = new AuditLog();
        $auditLog->create([
            'user_id' => $approverId,
            'action' => 'transaction_rejected',
            'entity_type' => 'transaction',
            'entity_id' => $transactionId,
            'details' => json_encode(['reason' => $reason]),
            'ip_address' => $_SERVER['REMOTE_ADDR']
        ]);
    }
    
    /**
     * Check budget alerts (FR-07)
     */
    private function checkBudgetAlerts($transactionId) {
        $transaction = $this->find($transactionId);
        
        if (!$transaction['project_id']) {
            return;
        }
        
        $project = new Project();
        $budget = $project->calculateBudgetUtilization($transaction['project_id']);
        
        $thresholds = [
            BUDGET_ALERT_THRESHOLD_1,
            BUDGET_ALERT_THRESHOLD_2,
            BUDGET_ALERT_THRESHOLD_3
        ];
        
        foreach ($thresholds as $threshold) {
            if ($budget['percentage'] >= $threshold) {
                $this->sendBudgetAlert($transaction['project_id'], $budget['percentage']);
            }
        }
    }
    
    /**
     * Send budget alert notification
     */
    private function sendBudgetAlert($projectId, $percentage) {
        $notification = new Notification();
        $notification->createBudgetAlert($projectId, $percentage);
    }
    
    /**
     * Flag suspicious transactions (FR-08)
     */
    public function flagSuspiciousTransactions($projectId = null) {
        $suspicious = [];
        
        // Check for duplicate payments
        $duplicates = $this->findDuplicatePayments($projectId);
        $suspicious = array_merge($suspicious, $duplicates);
        
        // Check for unregistered vendors
        $unregistered = $this->findUnregisteredVendors($projectId);
        $suspicious = array_merge($suspicious, $unregistered);
        
        // Check budget overruns
        $overbudget = $this->findBudgetOverruns($projectId);
        $suspicious = array_merge($suspicious, $overbudget);
        
        return $suspicious;
    }
    
    /**
     * Find duplicate payments
     */
    private function findDuplicatePayments($projectId = null) {
        $sql = "SELECT t1.*, COUNT(*) as duplicate_count
                FROM {$this->table} t1
                JOIN {$this->table} t2 ON t1.vendor_name = t2.vendor_name 
                    AND t1.amount = t2.amount
                    AND t1.id != t2.id
                    AND DATE(t1.created_at) = DATE(t2.created_at)
                WHERE t1.status = ?";
        
        $params = [TRANSACTION_STATUS_PENDING];
        
        if ($projectId) {
            $sql .= " AND t1.project_id = ?";
            $params[] = $projectId;
        }
        
        $sql .= " GROUP BY t1.id HAVING duplicate_count > 1";
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Find transactions with unregistered vendors
     */
    private function findUnregisteredVendors($projectId = null) {
        $sql = "SELECT t.*
                FROM {$this->table} t
                LEFT JOIN vendors v ON t.vendor_id = v.id
                WHERE t.status = ? AND v.id IS NULL";
        
        $params = [TRANSACTION_STATUS_PENDING];
        
        if ($projectId) {
            $sql .= " AND t.project_id = ?";
            $params[] = $projectId;
        }
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Find budget category overruns
     */
    private function findBudgetOverruns($projectId = null) {
        $sql = "SELECT t.category, 
                       SUM(t.amount) as spent,
                       b.allocated_amount,
                       (SUM(t.amount) - b.allocated_amount) as overrun
                FROM {$this->table} t
                JOIN budgets b ON t.project_id = b.project_id 
                    AND t.category = b.category
                WHERE t.status = ?";
        
        $params = [TRANSACTION_STATUS_APPROVED];
        
        if ($projectId) {
            $sql .= " AND t.project_id = ?";
            $params[] = $projectId;
        }
        
        $sql .= " GROUP BY t.category, b.allocated_amount
                  HAVING spent > b.allocated_amount";
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Get financial report (FR-20)
     */
    public function getFinancialReport($filters = []) {
        $where = [];
        $params = [];
        
        if (!empty($filters['project_id'])) {
            $where[] = "t.project_id = ?";
            $params[] = $filters['project_id'];
        }
        
        if (!empty($filters['start_date'])) {
            $where[] = "DATE(t.created_at) >= ?";
            $params[] = $filters['start_date'];
        }
        
        if (!empty($filters['end_date'])) {
            $where[] = "DATE(t.created_at) <= ?";
            $params[] = $filters['end_date'];
        }
        
        if (!empty($filters['category'])) {
            $where[] = "t.category = ?";
            $params[] = $filters['category'];
        }
        
        if (!empty($filters['vendor_id'])) {
            $where[] = "t.vendor_id = ?";
            $params[] = $filters['vendor_id'];
        }
        
        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";
        
        $sql = "SELECT t.*, 
                       p.project_name,
                       CONCAT(u.first_name, ' ', u.last_name) as submitted_by_name,
                       CONCAT(a.first_name, ' ', a.last_name) as approved_by_name
                FROM {$this->table} t
                LEFT JOIN projects p ON t.project_id = p.id
                LEFT JOIN users u ON t.submitted_by = u.id
                LEFT JOIN users a ON t.approved_by = a.id
                {$whereClause}
                ORDER BY t.created_at DESC";
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Send approval notification (FR-23)
     */
    private function sendApprovalNotification($transactionId) {
        $notification = new Notification();
        $notification->createApprovalNotification($transactionId, 'transaction');
    }
    
    /**
     * Get pending approvals for user
     */
    public function getPendingApprovals($userId) {
        $user = (new User())->find($userId);
        $roleId = $user['role_id'];
        
        $sql = "SELECT t.*, p.project_name
                FROM {$this->table} t
                LEFT JOIN projects p ON t.project_id = p.id
                WHERE t.status = ?";
        
        $params = [TRANSACTION_STATUS_PENDING];
        
        // Filter by approval authority
        if ($roleId == ROLE_FINANCE_OFFICER) {
            $sql .= " AND t.amount < ?";
            $params[] = self::THRESHOLD_HIGH;
        } elseif ($roleId == ROLE_OPERATIONS_MANAGER) {
            $sql .= " AND t.amount >= ? AND t.amount < ?";
            $params[] = self::THRESHOLD_HIGH;
            $params[] = self::THRESHOLD_CRITICAL;
        } elseif ($roleId == ROLE_MANAGING_DIRECTOR) {
            $sql .= " AND t.amount >= ?";
            $params[] = self::THRESHOLD_CRITICAL;
        }
        
        $sql .= " ORDER BY t.created_at ASC";
        
        return $this->db->query($sql, $params);
    }
}