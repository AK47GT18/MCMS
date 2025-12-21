<?php
/**
 * Transaction Repository
 * 
 * @file TransactionRepository.php
 * @description Data access layer for financial transactions (FR-05 to FR-08, FR-20, FR-25)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class TransactionRepository {
    
    private $db;
    private $table = 'transactions';
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Find transaction by ID with full details
     * 
     * @param int $id Transaction ID
     * @return array|null
     */
    public function findById($id) {
        $sql = "SELECT t.*,
                       p.name as project_name, p.project_code,
                       CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
                       CONCAT(a.first_name, ' ', a.last_name) as approved_by_name,
                       v.name as vendor_name, v.contact as vendor_contact
                FROM {$this->table} t
                LEFT JOIN projects p ON t.project_id = p.id
                LEFT JOIN users u ON t.created_by = u.id
                LEFT JOIN users a ON t.approved_by = a.id
                LEFT JOIN vendors v ON t.vendor_id = v.id
                WHERE t.id = ? AND t.deleted_at IS NULL";
        
        $result = $this->db->query($sql, [$id]);
        return $result[0] ?? null;
    }
    
    /**
     * Get all transactions with filters and pagination
     * 
     * @param array $filters Filter criteria
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array
     */
    public function getAll($filters = [], $page = 1, $perPage = 20) {
        $offset = ($page - 1) * $perPage;
        
        $sql = "SELECT t.id, t.transaction_code, t.type, t.category,
                       t.amount, t.status, t.transaction_date, t.description,
                       p.name as project_name, p.project_code,
                       v.name as vendor_name,
                       CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
                       t.is_flagged, t.flag_reason
                FROM {$this->table} t
                LEFT JOIN projects p ON t.project_id = p.id
                LEFT JOIN vendors v ON t.vendor_id = v.id
                LEFT JOIN users u ON t.created_by = u.id
                WHERE t.deleted_at IS NULL";
        
        $params = [];
        
        // Apply filters
        if (!empty($filters['status'])) {
            $sql .= " AND t.status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['type'])) {
            $sql .= " AND t.type = ?";
            $params[] = $filters['type'];
        }
        
        if (!empty($filters['project_id'])) {
            $sql .= " AND t.project_id = ?";
            $params[] = $filters['project_id'];
        }
        
        if (!empty($filters['category'])) {
            $sql .= " AND t.category = ?";
            $params[] = $filters['category'];
        }
        
        if (!empty($filters['is_flagged'])) {
            $sql .= " AND t.is_flagged = 1";
        }
        
        if (!empty($filters['date_from'])) {
            $sql .= " AND t.transaction_date >= ?";
            $params[] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $sql .= " AND t.transaction_date <= ?";
            $params[] = $filters['date_to'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (t.transaction_code LIKE ? OR t.description LIKE ?)";
            $searchTerm = "%{$filters['search']}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM ({$sql}) as counted";
        $totalResult = $this->db->query($countSql, $params);
        $total = $totalResult[0]['total'] ?? 0;
        
        // Add sorting and pagination
        $sql .= " ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $perPage;
        $params[] = $offset;
        
        $transactions = $this->db->query($sql, $params);
        
        return [
            'data' => $transactions,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage)
        ];
    }
    
    /**
     * Create new transaction with audit trail (FR-05, FR-25)
     * 
     * @param array $data Transaction data
     * @return int Transaction ID
     */
    public function create($data) {
        // Generate transaction code
        if (empty($data['transaction_code'])) {
            $data['transaction_code'] = $this->generateTransactionCode($data['type']);
        }
        
        // Check for suspicious patterns (FR-08)
        $flagData = $this->checkSuspiciousPatterns($data);
        
        $sql = "INSERT INTO {$this->table}
                (transaction_code, project_id, type, category, amount,
                 vendor_id, description, transaction_date, status,
                 payment_method, reference_number, created_by,
                 is_flagged, flag_reason, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        
        $params = [
            $data['transaction_code'],
            $data['project_id'],
            $data['type'],
            $data['category'],
            $data['amount'],
            $data['vendor_id'] ?? null,
            $data['description'],
            $data['transaction_date'],
            $data['status'] ?? 'pending',
            $data['payment_method'] ?? null,
            $data['reference_number'] ?? null,
            $data['created_by'],
            $flagData['is_flagged'],
            $flagData['flag_reason']
        ];
        
        $this->db->execute($sql, $params);
        $transactionId = $this->db->lastInsertId();
        
        // Create immutable audit trail (FR-25)
        $this->createAuditTrail($transactionId, 'created', $data, $data['created_by']);
        
        return $transactionId;
    }
    
    /**
     * Update transaction status with approval workflow (FR-06)
     * 
     * @param int $id Transaction ID
     * @param string $status New status
     * @param int $userId User making the change
     * @param string $remarks Optional remarks
     * @return bool
     */
    public function updateStatus($id, $status, $userId, $remarks = null) {
        $validStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
        
        if (!in_array($status, $validStatuses)) {
            throw new ValidationException(['status' => 'Invalid status']);
        }
        
        $fields = ['status = ?', 'updated_at = NOW()'];
        $params = [$status];
        
        // Set approval fields if approved
        if ($status === 'approved') {
            $fields[] = 'approved_by = ?';
            $fields[] = 'approved_at = NOW()';
            $params[] = $userId;
        }
        
        if ($remarks) {
            $fields[] = 'approval_remarks = ?';
            $params[] = $remarks;
        }
        
        $params[] = $id;
        
        $sql = "UPDATE {$this->table} 
                SET " . implode(', ', $fields) . "
                WHERE id = ?";
        
        $result = $this->db->execute($sql, $params);
        
        // Create immutable audit trail (FR-25)
        if ($result) {
            $this->createAuditTrail($id, "status_changed_to_$status", [
                'status' => $status,
                'remarks' => $remarks
            ], $userId);
        }
        
        return $result;
    }
    
    /**
     * Check for suspicious transaction patterns (FR-08)
     * 
     * @param array $data Transaction data
     * @return array ['is_flagged' => bool, 'flag_reason' => string|null]
     */
    private function checkSuspiciousPatterns($data) {
        $flags = [];
        
        // Check for duplicate payment
        $duplicateCheck = $this->checkDuplicatePayment(
            $data['vendor_id'] ?? null,
            $data['amount'],
            $data['transaction_date'],
            $data['reference_number'] ?? null
        );
        
        if ($duplicateCheck) {
            $flags[] = "Possible duplicate payment (similar transaction: {$duplicateCheck['transaction_code']})";
        }
        
        // Check for unregistered vendor
        if (!empty($data['vendor_id'])) {
            $vendorCheck = $this->checkVendorRegistration($data['vendor_id']);
            if (!$vendorCheck) {
                $flags[] = "Unregistered or inactive vendor";
            }
        }
        
        // Check if exceeds budget category
        if (!empty($data['project_id']) && !empty($data['category'])) {
            $budgetCheck = $this->checkBudgetCategory(
                $data['project_id'],
                $data['category'],
                $data['amount']
            );
            
            if ($budgetCheck['exceeds']) {
                $flags[] = "Exceeds budget for category '{$data['category']}' by MWK " . 
                          number_format($budgetCheck['excess'], 2);
            }
        }
        
        return [
            'is_flagged' => !empty($flags),
            'flag_reason' => !empty($flags) ? implode('; ', $flags) : null
        ];
    }
    
    /**
     * Check for duplicate payments
     */
    private function checkDuplicatePayment($vendorId, $amount, $date, $refNumber) {
        $sql = "SELECT transaction_code FROM {$this->table}
                WHERE vendor_id = ?
                  AND amount = ?
                  AND transaction_date = ?
                  AND status IN ('pending', 'approved')
                  AND deleted_at IS NULL
                LIMIT 1";
        
        $params = [$vendorId, $amount, $date];
        
        // Also check by reference number if provided
        if ($refNumber) {
            $sql = "SELECT transaction_code FROM {$this->table}
                    WHERE reference_number = ?
                      AND status IN ('pending', 'approved')
                      AND deleted_at IS NULL
                    LIMIT 1";
            $params = [$refNumber];
        }
        
        $result = $this->db->query($sql, $params);
        return $result[0] ?? null;
    }
    
    /**
     * Check vendor registration
     */
    private function checkVendorRegistration($vendorId) {
        $sql = "SELECT id FROM vendors 
                WHERE id = ? AND is_active = 1 AND deleted_at IS NULL";
        
        $result = $this->db->query($sql, [$vendorId]);
        return !empty($result);
    }
    
    /**
     * Check if transaction exceeds budget category
     */
    private function checkBudgetCategory($projectId, $category, $amount) {
        $sql = "SELECT allocated_amount,
                       (SELECT COALESCE(SUM(amount), 0) 
                        FROM transactions 
                        WHERE project_id = ? 
                          AND category = ? 
                          AND status = 'approved'
                          AND deleted_at IS NULL) as spent
                FROM budget_categories
                WHERE project_id = ? AND category = ?";
        
        $result = $this->db->query($sql, [$projectId, $category, $projectId, $category]);
        
        if (empty($result)) {
            return ['exceeds' => false, 'excess' => 0];
        }
        
        $budget = $result[0];
        $newTotal = $budget['spent'] + $amount;
        $excess = $newTotal - $budget['allocated_amount'];
        
        return [
            'exceeds' => $excess > 0,
            'excess' => max(0, $excess)
        ];
    }
    
    /**
     * Get transactions requiring approval (FR-06)
     * 
     * @param int $userId Optional user ID to get their pending approvals
     * @return array
     */
    public function getPendingApprovals($userId = null) {
        $sql = "SELECT t.id, t.transaction_code, t.type, t.amount,
                       t.description, t.transaction_date, t.created_at,
                       p.name as project_name,
                       v.name as vendor_name,
                       CONCAT(u.first_name, ' ', u.last_name) as created_by_name
                FROM {$this->table} t
                LEFT JOIN projects p ON t.project_id = p.id
                LEFT JOIN vendors v ON t.vendor_id = v.id
                LEFT JOIN users u ON t.created_by = u.id
                WHERE t.status = 'pending' 
                  AND t.deleted_at IS NULL
                ORDER BY t.created_at ASC";
        
        return $this->db->query($sql);
    }
    
    /**
     * Get flagged transactions (FR-08)
     * 
     * @return array
     */
    public function getFlaggedTransactions() {
        $sql = "SELECT t.id, t.transaction_code, t.type, t.amount,
                       t.flag_reason, t.transaction_date,
                       p.name as project_name,
                       v.name as vendor_name
                FROM {$this->table} t
                LEFT JOIN projects p ON t.project_id = p.id
                LEFT JOIN vendors v ON t.vendor_id = v.id
                WHERE t.is_flagged = 1 
                  AND t.status = 'pending'
                  AND t.deleted_at IS NULL
                ORDER BY t.created_at DESC";
        
        return $this->db->query($sql);
    }
    
    /**
     * Generate financial report (FR-20)
     * 
     * @param array $filters Report filters
     * @return array
     */
    public function generateReport($filters = []) {
        $sql = "SELECT 
                    t.category,
                    COUNT(*) as transaction_count,
                    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses,
                    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
                    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as net_amount
                FROM {$this->table} t
                WHERE t.status = 'approved' AND t.deleted_at IS NULL";
        
        $params = [];
        
        if (!empty($filters['project_id'])) {
            $sql .= " AND t.project_id = ?";
            $params[] = $filters['project_id'];
        }
        
        if (!empty($filters['date_from'])) {
            $sql .= " AND t.transaction_date >= ?";
            $params[] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $sql .= " AND t.transaction_date <= ?";
            $params[] = $filters['date_to'];
        }
        
        $sql .= " GROUP BY t.category ORDER BY total_expenses DESC";
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Create immutable audit trail (FR-25)
     * 
     * @param int $transactionId Transaction ID
     * @param string $action Action performed
     * @param array $details Details
     * @param int $userId User ID
     */
    private function createAuditTrail($transactionId, $action, $details, $userId) {
        $sql = "INSERT INTO audit_logs 
                (user_id, action, entity_type, entity_id, details, ip_address, created_at)
                VALUES (?, ?, 'transaction', ?, ?, ?, NOW())";
        
        $this->db->execute($sql, [
            $userId,
            $action,
            $transactionId,
            json_encode($details),
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    }
    
    /**
     * Generate unique transaction code
     */
    private function generateTransactionCode($type) {
        $prefix = strtoupper(substr($type, 0, 3));
        $year = date('Y');
        $month = date('m');
        $codePrefix = "{$prefix}-{$year}{$month}-";
        
        $sql = "SELECT transaction_code FROM {$this->table}
                WHERE transaction_code LIKE ?
                ORDER BY id DESC LIMIT 1";
        
        $result = $this->db->query($sql, ["{$codePrefix}%"]);
        
        if (!empty($result)) {
            $lastCode = $result[0]['transaction_code'];
            $lastNumber = (int) substr($lastCode, -5);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $codePrefix . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    }
    
    /**
     * Soft delete transaction
     */
    public function delete($id) {
        $sql = "UPDATE {$this->table} 
                SET deleted_at = NOW()
                WHERE id = ?";
        
        return $this->db->execute($sql, [$id]);
    }
}