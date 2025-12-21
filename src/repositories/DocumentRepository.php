<?php
/**
 * Document Repository (FR-22)
 */
class DocumentRepository {
    
    private $db;
    private $table = 'documents';
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function findById($id) {
        $sql = "SELECT d.*,
                       CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
                FROM {$this->table} d
                LEFT JOIN users u ON d.uploaded_by = u.id
                WHERE d.id = ? AND d.deleted_at IS NULL";
        
        $result = $this->db->query($sql, [$id]);
        return $result[0] ?? null;
    }
    
    /**
     * Search documents by multiple criteria (FR-22)
     */
    public function search($filters = [], $page = 1, $perPage = 20) {
        $offset = ($page - 1) * $perPage;
        
        $sql = "SELECT d.id, d.filename, d.document_type, d.filesize,
                       d.uploaded_at, d.tags,
                       p.name as project_name,
                       CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
                FROM {$this->table} d
                LEFT JOIN projects p ON d.project_id = p.id
                LEFT JOIN users u ON d.uploaded_by = u.id
                WHERE d.deleted_at IS NULL";
        
        $params = [];
        
        if (!empty($filters['project_id'])) {
            $sql .= " AND d.project_id = ?";
            $params[] = $filters['project_id'];
        }
        
        if (!empty($filters['document_type'])) {
            $sql .= " AND d.document_type = ?";
            $params[] = $filters['document_type'];
        }
        
        if (!empty($filters['date_from'])) {
            $sql .= " AND d.uploaded_at >= ?";
            $params[] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $sql .= " AND d.uploaded_at <= ?";
            $params[] = $filters['date_to'];
        }
        
        // Keyword search (FR-22)
        if (!empty($filters['keyword'])) {
            $sql .= " AND (d.filename LIKE ? OR d.description LIKE ? OR d.tags LIKE ?)";
            $searchTerm = "%{$filters['keyword']}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $countSql = "SELECT COUNT(*) as total FROM ({$sql}) as counted";
        $totalResult = $this->db->query($countSql, $params);
        $total = $totalResult[0]['total'] ?? 0;
        
        $sql .= " ORDER BY d.uploaded_at DESC LIMIT ? OFFSET ?";
        $params[] = $perPage;
        $params[] = $offset;
        
        $documents = $this->db->query($sql, $params);
        
        return [
            'data' => $documents,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage)
        ];
    }
    
    public function create($data) {
        $sql = "INSERT INTO {$this->table}
                (filename, filepath, filesize, document_type, project_id,
                 description, tags, uploaded_by, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        return $this->db->execute($sql, [
            $data['filename'],
            $data['filepath'],
            $data['filesize'],
            $data['document_type'],
            $data['project_id'] ?? null,
            $data['description'] ?? null,
            $data['tags'] ?? null,
            $data['uploaded_by']
        ]);
    }
    
    public function delete($id) {
        $sql = "UPDATE {$this->table} SET deleted_at = NOW() WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }
}
