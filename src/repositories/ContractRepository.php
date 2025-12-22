<?php
namespace Mkaka\Repositories;

use Mkaka\Core\Database;

/**
 * Contract Repository (FR-09, FR-10)
 */
class ContractRepository {
    
    private $db;
    private $table = 'contracts';
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function findById($id) {
        $sql = "SELECT c.*, 
                       p.name as project_name, p.project_code,
                       v.name as vendor_name, v.contact as vendor_contact,
                       (SELECT COUNT(*) FROM contract_documents WHERE contract_id = c.id AND deleted_at IS NULL) as document_count,
                       (SELECT COUNT(*) FROM contract_milestones WHERE contract_id = c.id) as milestone_count
                FROM {$this->table} c
                LEFT JOIN projects p ON c.project_id = p.id
                LEFT JOIN vendors v ON c.vendor_id = v.id
                WHERE c.id = ? AND c.deleted_at IS NULL";
        
        $result = $this->db->query($sql, [$id]);
        return $result[0] ?? null;
    }
    
    public function getAll($filters = [], $page = 1, $perPage = 20) {
        $offset = ($page - 1) * $perPage;
        
        $sql = "SELECT c.id, c.contract_number, c.title, c.contract_value,
                       c.status, c.start_date, c.end_date, c.completion_percentage,
                       p.name as project_name, v.name as vendor_name
                FROM {$this->table} c
                LEFT JOIN projects p ON c.project_id = p.id
                LEFT JOIN vendors v ON c.vendor_id = v.id
                WHERE c.deleted_at IS NULL";
        
        $params = [];
        
        if (!empty($filters['status'])) {
            $sql .= " AND c.status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['project_id'])) {
            $sql .= " AND c.project_id = ?";
            $params[] = $filters['project_id'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (c.contract_number LIKE ? OR c.title LIKE ?)";
            $searchTerm = "%{$filters['search']}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $countSql = "SELECT COUNT(*) as total FROM ({$sql}) as counted";
        $totalResult = $this->db->query($countSql, $params);
        $total = $totalResult[0]['total'] ?? 0;
        
        $sql .= " ORDER BY c.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $perPage;
        $params[] = $offset;
        
        $contracts = $this->db->query($sql, $params);
        
        return [
            'data' => $contracts,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage)
        ];
    }
    
    public function create($data) {
        if (empty($data['contract_number'])) {
            $data['contract_number'] = $this->generateContractNumber();
        }
        
        $sql = "INSERT INTO {$this->table}
                (contract_number, title, description, project_id, vendor_id,
                 contract_value, status, start_date, end_date, terms,
                 created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        
        $params = [
            $data['contract_number'],
            $data['title'],
            $data['description'] ?? null,
            $data['project_id'],
            $data['vendor_id'],
            $data['contract_value'],
            $data['status'] ?? 'draft',
            $data['start_date'],
            $data['end_date'],
            $data['terms'] ?? null,
            $data['created_by']
        ];
        
        $this->db->execute($sql, $params);
        return $this->db->lastInsertId();
    }
    
    public function update($id, $data) {
        $fields = [];
        $params = [];
        
        $allowedFields = ['title', 'description', 'contract_value', 'status',
                         'start_date', 'end_date', 'terms', 'completion_percentage'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) return false;
        
        $fields[] = "updated_at = NOW()";
        $params[] = $id;
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = ?";
        return $this->db->execute($sql, $params);
    }
    
    /**
     * Get contracts with upcoming milestones (FR-10)
     */
    public function getContractsWithUpcomingMilestones($days = 7) {
        $sql = "SELECT c.id, c.contract_number, c.title,
                       cm.title as milestone_title, cm.due_date,
                       DATEDIFF(cm.due_date, CURDATE()) as days_remaining,
                       p.name as project_name,
                       CONCAT(u.first_name, ' ', u.last_name) as manager_name,
                       u.email as manager_email
                FROM {$this->table} c
                INNER JOIN contract_milestones cm ON c.id = cm.contract_id
                LEFT JOIN projects p ON c.project_id = p.id
                LEFT JOIN users u ON p.manager_id = u.id
                WHERE cm.status != 'completed'
                  AND cm.due_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
                  AND cm.due_date >= CURDATE()
                  AND c.deleted_at IS NULL
                ORDER BY cm.due_date ASC";
        
        return $this->db->query($sql, [$days]);
    }
    
    /**
     * Add milestone to contract
     */
    public function addMilestone($contractId, $data) {
        $sql = "INSERT INTO contract_milestones
                (contract_id, title, description, due_date, status, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())";
        
        return $this->db->execute($sql, [
            $contractId,
            $data['title'],
            $data['description'] ?? null,
            $data['due_date'],
            $data['status'] ?? 'pending'
        ]);
    }
    
    /**
     * Store contract document with version control (FR-09)
     */
    public function addDocument($contractId, $data) {
        // Get current version number
        $sql = "SELECT MAX(version) as max_version 
                FROM contract_documents 
                WHERE contract_id = ? AND deleted_at IS NULL";
        
        $result = $this->db->query($sql, [$contractId]);
        $version = ($result[0]['max_version'] ?? 0) + 1;
        
        $sql = "INSERT INTO contract_documents
                (contract_id, filename, filepath, filesize, version,
                 uploaded_by, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())";
        
        return $this->db->execute($sql, [
            $contractId,
            $data['filename'],
            $data['filepath'],
            $data['filesize'],
            $version,
            $data['uploaded_by']
        ]);
    }
    
    /**
     * Get document versions (FR-09)
     */
    public function getDocumentVersions($contractId) {
        $sql = "SELECT cd.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
                FROM contract_documents cd
                LEFT JOIN users u ON cd.uploaded_by = u.id
                WHERE cd.contract_id = ? AND cd.deleted_at IS NULL
                ORDER BY cd.version DESC";
        
        return $this->db->query($sql, [$contractId]);
    }
    
    private function generateContractNumber() {
        $year = date('Y');
        $prefix = "CON-{$year}-";
        
        $sql = "SELECT contract_number FROM {$this->table}
                WHERE contract_number LIKE ?
                ORDER BY id DESC LIMIT 1";
        
        $result = $this->db->query($sql, ["{$prefix}%"]);
        
        if (!empty($result)) {
            $lastNumber = (int) substr($result[0]['contract_number'], -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
    
    public function delete($id) {
        $sql = "UPDATE {$this->table} SET deleted_at = NOW() WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }
}
