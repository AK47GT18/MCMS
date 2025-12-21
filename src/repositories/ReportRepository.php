<?php

class ReportRepository {
    
    private $db;
    private $table = 'site_reports';
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function findById($id) {
        $sql = "SELECT sr.*,
                       p.name as project_name, p.project_code,
                       CONCAT(u.first_name, ' ', u.last_name) as supervisor_name,
                       (SELECT COUNT(*) FROM site_report_photos WHERE report_id = sr.id) as photo_count
                FROM {$this->table} sr
                LEFT JOIN projects p ON sr.project_id = p.id
                LEFT JOIN users u ON sr.submitted_by = u.id
                WHERE sr.id = ? AND sr.deleted_at IS NULL";
        
        $result = $this->db->query($sql, [$id]);
        return $result[0] ?? null;
    }
    
    public function getAll($filters = [], $page = 1, $perPage = 20) {
        $offset = ($page - 1) * $perPage;
        
        $sql = "SELECT sr.id, sr.report_date, sr.report_type, sr.status,
                       sr.site_conditions, sr.gps_validated,
                       p.name as project_name,
                       CONCAT(u.first_name, ' ', u.last_name) as supervisor_name
                FROM {$this->table} sr
                LEFT JOIN projects p ON sr.project_id = p.id
                LEFT JOIN users u ON sr.submitted_by = u.id
                WHERE sr.deleted_at IS NULL";
        
        $params = [];
        
        if (!empty($filters['project_id'])) {
            $sql .= " AND sr.project_id = ?";
            $params[] = $filters['project_id'];
        }
        
        if (!empty($filters['report_type'])) {
            $sql .= " AND sr.report_type = ?";
            $params[] = $filters['report_type'];
        }
        
        if (!empty($filters['gps_validated'])) {
            $sql .= " AND sr.gps_validated = 1";
        }
        
        $countSql = "SELECT COUNT(*) as total FROM ({$sql}) as counted";
        $totalResult = $this->db->query($countSql, $params);
        $total = $totalResult[0]['total'] ?? 0;
        
        $sql .= " ORDER BY sr.report_date DESC, sr.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $perPage;
        $params[] = $offset;
        
        $reports = $this->db->query($sql, $params);
        
        return [
            'data' => $reports,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage)
        ];
    }
    
    /**
     * Create site report with GPS validation (FR-14)
     */
    public function create($data) {
        // Validate GPS coordinates (FR-14)
        $gpsValid = $this->validateGpsCoordinates(
            $data['latitude'],
            $data['longitude']
        );
        
        $sql = "INSERT INTO {$this->table}
                (project_id, report_type, report_date, site_conditions,
                 equipment_present, personnel_attendance, work_completed,
                 materials_delivered, challenges, incidents, safety_observations,
                 latitude, longitude, gps_validated, gps_validation_message,
                 submitted_by, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', NOW(), NOW())";
        
        $params = [
            $data['project_id'],
            $data['report_type'] ?? 'daily',
            $data['report_date'],
            $data['site_conditions'] ?? null,
            $data['equipment_present'] ?? null,
            $data['personnel_attendance'] ?? null,
            $data['work_completed'] ?? null,
            $data['materials_delivered'] ?? null,
            $data['challenges'] ?? null,
            $data['incidents'] ?? null,
            $data['safety_observations'] ?? null,
            $data['latitude'],
            $data['longitude'],
            $gpsValid['valid'] ? 1 : 0,
            $gpsValid['message'],
            $data['submitted_by']
        ];
        
        $this->db->execute($sql, $params);
        return $this->db->lastInsertId();
    }
    
    /**
     * Add geotagged photo (FR-15)
     */
    public function addPhoto($reportId, $data) {
        $sql = "INSERT INTO site_report_photos
                (report_id, filename, filepath, filesize, latitude, longitude,
                 photo_timestamp, caption, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        return $this->db->execute($sql, [
            $reportId,
            $data['filename'],
            $data['filepath'],
            $data['filesize'],
            $data['latitude'],
            $data['longitude'],
            $data['photo_timestamp'],
            $data['caption'] ?? null
        ]);
    }
    
    /**
     * Validate GPS coordinates are within Malawi (FR-14)
     */
    private function validateGpsCoordinates($latitude, $longitude) {
        // Malawi boundaries from SRS
        $minLat = -17.125;
        $maxLat = -9.367;
        $minLng = 32.674;
        $maxLng = 35.924;
        
        $valid = ($latitude >= $minLat && $latitude <= $maxLat &&
                 $longitude >= $minLng && $longitude <= $maxLng);
        
        return [
            'valid' => $valid,
            'message' => $valid ? 'GPS coordinates validated' : 'GPS coordinates outside Malawi boundaries'
        ];
    }
    
    /**
     * Get photos for report
     */
    public function getPhotos($reportId) {
        $sql = "SELECT * FROM site_report_photos
                WHERE report_id = ?
                ORDER BY photo_timestamp DESC";
        
        return $this->db->query($sql, [$reportId]);
    }
    
    public function delete($id) {
        $sql = "UPDATE {$this->table} SET deleted_at = NOW() WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }
}
