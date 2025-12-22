<?php
namespace Mkaka\Models;

use Mkaka\Core\Model;
use Mkaka\Core\Authentication;
use Mkaka\Models\AuditLog;
use Mkaka\Models\Document;
use Mkaka\Models\Notification;

/**
 * Contract Model
 * 
 * @file Contract.php
 * @description Contract lifecycle management (FR-09, FR-10)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class Contract extends Model {
    protected $table = 'contracts';
    protected $primaryKey = 'id';
    protected $fillable = [
        'contract_code',
        'project_id',
        'contract_title',
        'vendor_name',
        'vendor_id',
        'contract_type',
        'contract_value',
        'start_date',
        'end_date',
        'status',
        'description',
        'terms_conditions',
        'payment_terms',
        'created_by',
        'approved_by'
    ];
    protected $timestamps = true;
    
    /**
     * Create contract (FR-09)
     */
    public function createContract($data) {
        $data['contract_code'] = $this->generateContractCode();
        $data['status'] = CONTRACT_STATUS_DRAFT;
        $data['created_by'] = Authentication::user()['id'];
        
        $this->db->beginTransaction();
        
        try {
            $contractId = $this->create($data);
            
            // Log creation
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => $data['created_by'],
                'action' => 'contract_created',
                'entity_type' => 'contract',
                'entity_id' => $contractId,
                'details' => json_encode([
                    'contract_code' => $data['contract_code'],
                    'vendor' => $data['vendor_name']
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ]);
            
            $this->db->commit();
            return $contractId;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Generate unique contract code
     */
    private function generateContractCode() {
        $year = date('Y');
        $sql = "SELECT COUNT(*) as count FROM {$this->table} 
                WHERE contract_code LIKE ?";
        $result = $this->db->query($sql, ["CON-{$year}-%"]);
        $count = $result[0]['count'] + 1;
        
        return sprintf("CON-%s-%03d", $year, $count);
    }
    
    /**
     * Upload contract document with version control (FR-09)
     */
    public function uploadDocument($contractId, $filePath, $documentType, $version = null) {
        $contract = $this->find($contractId);
        
        if (!$contract) {
            throw new Exception("Contract not found");
        }
        
        // Determine version number
        if ($version === null) {
            $version = $this->getNextVersion($contractId, $documentType);
        }
        
        $document = new Document();
        $documentId = $document->create([
            'entity_type' => 'contract',
            'entity_id' => $contractId,
            'document_type' => $documentType,
            'file_name' => basename($filePath),
            'file_path' => $filePath,
            'version' => $version,
            'uploaded_by' => Authentication::user()['id']
        ]);
        
        // Log document upload
        $auditLog = new AuditLog();
        $auditLog->create([
            'user_id' => Authentication::user()['id'],
            'action' => 'contract_document_uploaded',
            'entity_type' => 'contract',
            'entity_id' => $contractId,
            'details' => json_encode([
                'document_type' => $documentType,
                'version' => $version,
                'file_name' => basename($filePath)
            ]),
            'ip_address' => $_SERVER['REMOTE_ADDR']
        ]);
        
        return $documentId;
    }
    
    /**
     * Get next version number for document type
     */
    private function getNextVersion($contractId, $documentType) {
        $document = new Document();
        $sql = "SELECT MAX(version) as max_version 
                FROM documents 
                WHERE entity_type = 'contract' 
                  AND entity_id = ? 
                  AND document_type = ?";
        
        $result = $document->db->query($sql, [$contractId, $documentType]);
        $maxVersion = $result[0]['max_version'] ?? 0;
        
        return $maxVersion + 1;
    }
    
    /**
     * Get all document versions
     */
    public function getDocumentVersions($contractId, $documentType = null) {
        $document = new Document();
        
        $conditions = [
            'entity_type' => 'contract',
            'entity_id' => $contractId
        ];
        
        if ($documentType) {
            $conditions['document_type'] = $documentType;
        }
        
        $sql = "SELECT d.*, CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
                FROM documents d
                LEFT JOIN users u ON d.uploaded_by = u.id
                WHERE d.entity_type = ? AND d.entity_id = ?";
        
        $params = ['contract', $contractId];
        
        if ($documentType) {
            $sql .= " AND d.document_type = ?";
            $params[] = $documentType;
        }
        
        $sql .= " ORDER BY d.version DESC";
        
        return $document->db->query($sql, $params);
    }
    
    /**
     * Add milestone to contract (FR-10)
     */
    public function addMilestone($contractId, $milestoneData) {
        $milestone = [
            'contract_id' => $contractId,
            'milestone_name' => $milestoneData['name'],
            'description' => $milestoneData['description'] ?? null,
            'due_date' => $milestoneData['due_date'],
            'status' => 'pending',
            'completion_percentage' => 0
        ];
        
        $sql = "INSERT INTO contract_milestones 
                (contract_id, milestone_name, description, due_date, status, completion_percentage, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        return $this->db->execute($sql, [
            $milestone['contract_id'],
            $milestone['milestone_name'],
            $milestone['description'],
            $milestone['due_date'],
            $milestone['status'],
            $milestone['completion_percentage'],
            date(DATETIME_FORMAT)
        ]);
    }
    
    /**
     * Get contract milestones
     */
    public function getMilestones($contractId) {
        $sql = "SELECT * FROM contract_milestones 
                WHERE contract_id = ? 
                ORDER BY due_date ASC";
        
        return $this->db->query($sql, [$contractId]);
    }
    
    /**
     * Check and send milestone notifications (FR-10)
     */
    public function checkMilestoneDeadlines() {
        $notificationDays = CONTRACT_DEADLINE_NOTICE_DAYS; // [7, 1]
        $upcoming = [];
        
        foreach ($notificationDays as $days) {
            $targetDate = date('Y-m-d', strtotime("+{$days} days"));
            
            $sql = "SELECT cm.*, c.contract_code, c.vendor_name, c.project_id
                    FROM contract_milestones cm
                    JOIN contracts c ON cm.contract_id = c.id
                    WHERE DATE(cm.due_date) = ? 
                      AND cm.status != 'completed'";
            
            $milestones = $this->db->query($sql, [$targetDate]);
            
            foreach ($milestones as $milestone) {
                // Send notification
                $notification = new Notification();
                $notification->createMilestoneDeadlineNotification(
                    $milestone['contract_id'],
                    $milestone['id'],
                    $days
                );
                
                $upcoming[] = $milestone;
            }
        }
        
        return $upcoming;
    }
    
    /**
     * Update milestone status
     */
    public function updateMilestoneStatus($milestoneId, $status, $completionPercentage = null) {
        $validStatuses = ['pending', 'in_progress', 'completed', 'overdue'];
        
        if (!in_array($status, $validStatuses)) {
            throw new Exception("Invalid milestone status");
        }
        
        $updateData = ['status' => $status];
        
        if ($completionPercentage !== null) {
            $updateData['completion_percentage'] = $completionPercentage;
        }
        
        if ($status == 'completed') {
            $updateData['completion_percentage'] = 100;
            $updateData['completed_at'] = date(DATETIME_FORMAT);
        }
        
        $sql = "UPDATE contract_milestones SET ";
        $fields = [];
        $params = [];
        
        foreach ($updateData as $key => $value) {
            $fields[] = "$key = ?";
            $params[] = $value;
        }
        
        $sql .= implode(', ', $fields) . " WHERE id = ?";
        $params[] = $milestoneId;
        
        return $this->db->execute($sql, $params);
    }
    
    /**
     * Get contracts with upcoming deadlines
     */
    public function getUpcomingDeadlines($days = 30) {
        $targetDate = date('Y-m-d', strtotime("+{$days} days"));
        
        $sql = "SELECT c.*, p.project_name,
                       COUNT(cm.id) as total_milestones,
                       SUM(CASE WHEN cm.status = 'completed' THEN 1 ELSE 0 END) as completed_milestones
                FROM {$this->table} c
                LEFT JOIN projects p ON c.project_id = p.id
                LEFT JOIN contract_milestones cm ON c.id = cm.contract_id
                WHERE c.end_date <= ? AND c.status = ?
                GROUP BY c.id
                ORDER BY c.end_date ASC";
        
        return $this->db->query($sql, [$targetDate, CONTRACT_STATUS_ACTIVE]);
    }
    
    /**
     * Update contract status
     */
    public function updateStatus($contractId, $status, $approverId = null) {
        $validStatuses = [
            CONTRACT_STATUS_DRAFT,
            CONTRACT_STATUS_PENDING_REVIEW,
            CONTRACT_STATUS_APPROVED,
            CONTRACT_STATUS_ACTIVE,
            CONTRACT_STATUS_COMPLETED,
            CONTRACT_STATUS_TERMINATED
        ];
        
        if (!in_array($status, $validStatuses)) {
            throw new Exception("Invalid contract status");
        }
        
        $updateData = ['status' => $status];
        
        if ($approverId && $status == CONTRACT_STATUS_APPROVED) {
            $updateData['approved_by'] = $approverId;
            $updateData['approved_at'] = date(DATETIME_FORMAT);
        }
        
        return $this->update($contractId, $updateData);
    }
    
    /**
     * Get contract summary
     */
    public function getContractSummary($contractId) {
        $contract = $this->find($contractId);
        
        if (!$contract) {
            return null;
        }
        
        $milestones = $this->getMilestones($contractId);
        $documents = $this->getDocumentVersions($contractId);
        
        return [
            'contract' => $contract,
            'milestones' => $milestones,
            'documents' => $documents,
            'completion' => $this->calculateCompletion($contractId)
        ];
    }
    
    /**
     * Calculate contract completion percentage
     */
    private function calculateCompletion($contractId) {
        $sql = "SELECT AVG(completion_percentage) as avg_completion
                FROM contract_milestones
                WHERE contract_id = ?";
        
        $result = $this->db->query($sql, [$contractId]);
        return $result ? round($result[0]['avg_completion'], 2) : 0;
    }
}