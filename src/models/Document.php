<?php
/**
 * Document Model
 * 
 * @file Document.php
 * @description Document management with version control (FR-09, FR-22)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class Document extends Model {
    protected $table = 'documents';
    protected $primaryKey = 'id';
    protected $fillable = [
        'entity_type',
        'entity_id',
        'document_type',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'version',
        'description',
        'metadata',
        'uploaded_by'
    ];
    protected $timestamps = true;
    
    /**
     * Upload document with validation
     */
    public function uploadDocument($file, $entityType, $entityId, $documentType, $description = null) {
        // Validate file size
        if ($file['size'] > MAX_FILE_SIZE) {
            throw new Exception("File size exceeds maximum allowed size");
        }
        
        // Validate file type
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($extension, ALLOWED_FILE_TYPES)) {
            throw new Exception("File type not allowed");
        }
        
        // Generate unique file name
        $fileName = $this->generateFileName($file['name']);
        $uploadPath = UPLOAD_PATH . "/{$entityType}/" . $fileName;
        
        // Create directory if not exists
        $directory = dirname($uploadPath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
            throw new Exception("Failed to upload file");
        }
        
        // Create document record
        $documentId = $this->create([
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'document_type' => $documentType,
            'file_name' => $fileName,
            'file_path' => $uploadPath,
            'file_size' => $file['size'],
            'mime_type' => mime_content_type($uploadPath),
            'version' => 1,
            'description' => $description,
            'uploaded_by' => Authentication::user()['id']
        ]);
        
        // Log upload
        $auditLog = new AuditLog();
        $auditLog->create([
            'user_id' => Authentication::user()['id'],
            'action' => 'document_uploaded',
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => json_encode([
                'file_name' => $fileName,
                'document_type' => $documentType
            ]),
            'ip_address' => $_SERVER['REMOTE_ADDR']
        ]);
        
        return $documentId;
    }
    
    /**
     * Generate unique file name
     */
    private function generateFileName($originalName) {
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $baseName = pathinfo($originalName, PATHINFO_FILENAME);
        $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $baseName);
        
        return $safeName . '_' . time() . '_' . uniqid() . '.' . $extension;
    }
    
    /**
     * Search documents (FR-22)
     */
    public function searchDocuments($criteria) {
        $where = [];
        $params = [];
        
        if (!empty($criteria['entity_type'])) {
            $where[] = "d.entity_type = ?";
            $params[] = $criteria['entity_type'];
        }
        
        if (!empty($criteria['document_type'])) {
            $where[] = "d.document_type = ?";
            $params[] = $criteria['document_type'];
        }
        
        if (!empty($criteria['start_date'])) {
            $where[] = "DATE(d.created_at) >= ?";
            $params[] = $criteria['start_date'];
        }
        
        if (!empty($criteria['end_date'])) {
            $where[] = "DATE(d.created_at) <= ?";
            $params[] = $criteria['end_date'];
        }
        
        if (!empty($criteria['keyword'])) {
            $where[] = "(d.file_name LIKE ? OR d.description LIKE ?)";
            $keyword = "%{$criteria['keyword']}%";
            $params[] = $keyword;
            $params[] = $keyword;
        }
        
        if (!empty($criteria['project_name'])) {
            $where[] = "p.project_name LIKE ?";
            $params[] = "%{$criteria['project_name']}%";
        }
        
        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";
        
        $sql = "SELECT d.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name,
                       p.project_name
                FROM {$this->table} d
                LEFT JOIN users u ON d.uploaded_by = u.id
                LEFT JOIN projects p ON d.entity_type = 'project' AND d.entity_id = p.id
                {$whereClause}
                ORDER BY d.created_at DESC";
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Get document download URL
     */
    public function getDownloadUrl($documentId) {
        $document = $this->find($documentId);
        
        if (!$document) {
            return null;
        }
        
        return BASE_URL . '/download/' . $documentId;
    }
    
    /**
     * Delete document (soft delete with audit)
     */
    public function deleteDocument($documentId) {
        $document = $this->find($documentId);
        
        if (!$document) {
            throw new Exception("Document not found");
        }
        
        // Log deletion before removing
        $auditLog = new AuditLog();
        $auditLog->create([
            'user_id' => Authentication::user()['id'],
            'action' => 'document_deleted',
            'entity_type' => $document['entity_type'],
            'entity_id' => $document['entity_id'],
            'details' => json_encode([
                'file_name' => $document['file_name'],
                'document_type' => $document['document_type']
            ]),
            'ip_address' => $_SERVER['REMOTE_ADDR']
        ]);
        
        // Delete physical file
        if (file_exists($document['file_path'])) {
            unlink($document['file_path']);
        }
        
        // Delete database record
        return $this->delete($documentId);
    }
}