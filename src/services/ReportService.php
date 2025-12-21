<?php
class ReportService {
    
    private $reportRepository;
    private $auditService;
    private $gpsService;
    
    public function __construct() {
        $this->reportRepository = new ReportRepository();
        $this->auditService = new AuditService();
        $this->gpsService = new GpsService();
    }
    
    /**
     * Create site report with GPS validation (FR-14)
     */
    public function createSiteReport($data) {
        Authorization::require('site_reports.create');
        
        $this->validateReportData($data);
        
        // Validate GPS coordinates (FR-14)
        if (!$this->gpsService->validateMalawiCoordinates($data['latitude'], $data['longitude'])) {
            throw new ValidationException([
                'gps' => 'GPS coordinates must be within Malawi boundaries'
            ]);
        }
        
        // Create report
        $user = Authentication::user();
        $data['submitted_by'] = $user['id'];
        
        $reportId = $this->reportRepository->create($data);
        
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'site_report_created',
            'entity_type' => 'site_report',
            'entity_id' => $reportId,
            'details' => json_encode([
                'project_id' => $data['project_id'],
                'report_type' => $data['report_type'],
                'gps_validated' => true
            ])
        ]);
        
        return [
            'success' => true,
            'report_id' => $reportId,
            'message' => 'Site report submitted successfully'
        ];
    }
    
    /**
     * Add geotagged photo to report (FR-15)
     */
    public function addPhoto($reportId, $file) {
        Authorization::require('site_reports.create');
        
        // Extract GPS from EXIF
        $gpsData = $this->gpsService->extractGpsFromImage($file['tmp_name']);
        
        if (!$gpsData) {
            throw new ValidationException([
                'photo' => 'Photo must contain GPS metadata'
            ]);
        }
        
        // Validate GPS within Malawi (FR-14)
        if (!$this->gpsService->validateMalawiCoordinates($gpsData['latitude'], $gpsData['longitude'])) {
            throw new ValidationException([
                'gps' => 'Photo GPS coordinates must be within Malawi boundaries'
            ]);
        }
        
        // Upload photo
        $fileService = new FileService();
        $uploadResult = $fileService->uploadFile($file, 'site_reports');
        
        // Save photo record
        $this->reportRepository->addPhoto($reportId, [
            'filename' => $uploadResult['filename'],
            'filepath' => $uploadResult['filepath'],
            'filesize' => $uploadResult['filesize'],
            'latitude' => $gpsData['latitude'],
            'longitude' => $gpsData['longitude'],
            'photo_timestamp' => $gpsData['timestamp']
        ]);
        
        return [
            'success' => true,
            'message' => 'Photo added successfully',
            'gps_data' => $gpsData
        ];
    }
    
    private function validateReportData($data) {
        $errors = [];
        
        if (empty($data['project_id'])) {
            $errors['project_id'] = 'Project is required';
        }
        
        if (empty($data['report_date'])) {
            $errors['report_date'] = 'Report date is required';
        }
        
        if (empty($data['latitude']) || empty($data['longitude'])) {
            $errors['gps'] = 'GPS coordinates are required';
        }
        
        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
    }
}