<?php
/**
 * SiteReport Model
 * 
 * @file SiteReport.php
 * @description Geotagged site report management (FR-14, FR-15)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class SiteReport extends Model {
    protected $table = 'site_reports';
    protected $primaryKey = 'id';
    protected $fillable = [
        'report_code',
        'project_id',
        'report_date',
        'report_type',
        'submitted_by',
        'status',
        'site_conditions',
        'equipment_present',
        'personnel_attendance',
        'materials_delivered',
        'work_completed',
        'challenges',
        'incidents',
        'weather_conditions',
        'latitude',
        'longitude',
        'location_accuracy'
    ];
    protected $timestamps = true;
    
    /**
     * Create site report with GPS validation (FR-14, FR-15)
     */
    public function createReport($data, $photos = []) {
        // Validate GPS coordinates (FR-14)
        if (empty($data['latitude']) || empty($data['longitude'])) {
            throw new Exception("GPS coordinates are required");
        }
        
        if (!$this->validateGPS($data['latitude'], $data['longitude'])) {
            throw new Exception("GPS coordinates are outside Malawi boundaries");
        }
        
        $data['report_code'] = $this->generateReportCode();
        $data['submitted_by'] = Authentication::user()['id'];
        $data['status'] = REPORT_STATUS_DRAFT;
        
        $this->db->beginTransaction();
        
        try {
            $reportId = $this->create($data);
            
            // Process and store geotagged photos (FR-15)
            if (!empty($photos)) {
                $this->processGeotaggedPhotos($reportId, $photos);
            }
            
            // Log creation
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => $data['submitted_by'],
                'action' => 'site_report_created',
                'entity_type' => 'site_report',
                'entity_id' => $reportId,
                'details' => json_encode([
                    'report_code' => $data['report_code'],
                    'project_id' => $data['project_id'],
                    'gps' => ['lat' => $data['latitude'], 'lng' => $data['longitude']]
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ]);
            
            $this->db->commit();
            return $reportId;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Process geotagged photographs (FR-15)
     */
    private function processGeotaggedPhotos($reportId, $photos) {
        $document = new Document();
        
        foreach ($photos as $photo) {
            // Extract EXIF data
            $exifData = $this->extractExifData($photo['tmp_name']);
            
            if (!$exifData) {
                throw new Exception("Unable to extract GPS data from photo: {$photo['name']}");
            }
            
            // Validate GPS from EXIF
            if (!$this->validateGPS($exifData['latitude'], $exifData['longitude'])) {
                throw new Exception("Photo GPS coordinates are outside Malawi boundaries");
            }
            
            // Save photo
            $fileName = $this->generatePhotoFileName($reportId, $photo['name']);
            $uploadPath = UPLOAD_PATH . '/site_reports/' . $fileName;
            
            if (!move_uploaded_file($photo['tmp_name'], $uploadPath)) {
                throw new Exception("Failed to upload photo");
            }
            
            // Store document with GPS metadata
            $document->create([
                'entity_type' => 'site_report',
                'entity_id' => $reportId,
                'document_type' => 'photo',
                'file_name' => $fileName,
                'file_path' => $uploadPath,
                'metadata' => json_encode($exifData),
                'uploaded_by' => Authentication::user()['id']
            ]);
        }
    }
    
    /**
     * Extract EXIF metadata from photo (FR-15)
     */
    private function extractExifData($filePath) {
        if (!function_exists('exif_read_data')) {
            throw new Exception("EXIF extension not available");
        }
        
        $exif = @exif_read_data($filePath);
        
        if (!$exif || !isset($exif['GPSLatitude']) || !isset($exif['GPSLongitude'])) {
            return null;
        }
        
        return [
            'latitude' => $this->getGPSCoordinate($exif['GPSLatitude'], $exif['GPSLatitudeRef']),
            'longitude' => $this->getGPSCoordinate($exif['GPSLongitude'], $exif['GPSLongitudeRef']),
            'timestamp' => $exif['DateTime'] ?? null,
            'camera' => $exif['Model'] ?? null
        ];
    }
    
    /**
     * Convert GPS EXIF to decimal degrees
     */
    private function getGPSCoordinate($coordinate, $ref) {
        $degrees = count($coordinate) > 0 ? $this->gps2Num($coordinate[0]) : 0;
        $minutes = count($coordinate) > 1 ? $this->gps2Num($coordinate[1]) : 0;
        $seconds = count($coordinate) > 2 ? $this->gps2Num($coordinate[2]) : 0;
        
        $decimal = $degrees + ($minutes / 60) + ($seconds / 3600);
        
        if ($ref == 'S' || $ref == 'W') {
            $decimal *= -1;
        }
        
        return $decimal;
    }
    
    private function gps2Num($coordPart) {
        $parts = explode('/', $coordPart);
        
        if (count($parts) <= 0) return 0;
        if (count($parts) == 1) return $parts[0];
        
        return floatval($parts[0]) / floatval($parts[1]);
    }
    
    /**
     * Validate GPS coordinates (FR-14)
     */
    private function validateGPS($latitude, $longitude) {
        return ($latitude >= MALAWI_MIN_LAT && $latitude <= MALAWI_MAX_LAT) &&
               ($longitude >= MALAWI_MIN_LNG && $longitude <= MALAWI_MAX_LNG);
    }
    
    /**
     * Generate report code
     */
    private function generateReportCode() {
        $date = date('Ymd');
        $sql = "SELECT COUNT(*) as count FROM {$this->table} 
                WHERE report_code LIKE ?";
        $result = $this->db->query($sql, ["SR-{$date}-%"]);
        $count = $result[0]['count'] + 1;
        
        return sprintf("SR-%s-%04d", $date, $count);
    }
    
    /**
     * Generate photo file name
     */
    private function generatePhotoFileName($reportId, $originalName) {
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        return "report_{$reportId}_" . time() . '_' . uniqid() . ".{$extension}";
    }
    
    /**
     * Submit report for approval
     */
    public function submitReport($reportId) {
        $report = $this->find($reportId);
        
        if (!$report) {
            throw new Exception("Report not found");
        }
        
        $this->update($reportId, ['status' => REPORT_STATUS_SUBMITTED]);
        
        // Notify project manager
        $notification = new Notification();
        $notification->createReportSubmittedNotification($reportId);
        
        return true;
    }
    
    /**
     * Get reports by project
     */
    public function getProjectReports($projectId, $startDate = null, $endDate = null) {
        $sql = "SELECT sr.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as submitted_by_name,
                       p.project_name
                FROM {$this->table} sr
                LEFT JOIN users u ON sr.submitted_by = u.id
                LEFT JOIN projects p ON sr.project_id = p.id
                WHERE sr.project_id = ?";
        
        $params = [$projectId];
        
        if ($startDate) {
            $sql .= " AND DATE(sr.report_date) >= ?";
            $params[] = $startDate;
        }
        
        if ($endDate) {
            $sql .= " AND DATE(sr.report_date) <= ?";
            $params[] = $endDate;
        }
        
        $sql .= " ORDER BY sr.report_date DESC";
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Get report with photos
     */
    public function getReportWithPhotos($reportId) {
        $report = $this->find($reportId);
        
        if (!$report) {
            return null;
        }
        
        $document = new Document();
        $photos = $document->where([
            'entity_type' => 'site_report',
            'entity_id' => $reportId,
            'document_type' => 'photo'
        ]);
        
        return [
            'report' => $report,
            'photos' => $photos
        ];
    }
}
