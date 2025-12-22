<?php
/**
 * GET /api/v1/modal-data/report-preview
 * Get detailed site report information with all attachments for modal preview
 * 
 * @requires Authentication, site_reports.view permission
 * @query int id Report ID (required)
 * 
 * @response JSON
 *   - success: boolean
 *   - report: object (full report details)
 *   - photos: array
 *   - comments: array
 *   - project: object
 *   - created_by_user: object
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    Authorization::require('site_reports.view');
    
    if (empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Report ID is required']);
        exit;
    }
    
    $reportId = (int)$_GET['id'];
    $reportRepo = new ReportRepository();
    $report = $reportRepo->find($reportId);
    
    if (!$report) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Report not found']);
        exit;
    }
    
    // Get project details
    $projectRepo = new ProjectRepository();
    $report['project'] = $projectRepo->find($report['project_id']);
    
    // Get user who created report
    $userRepo = new UserRepository();
    $report['created_by_user'] = $userRepo->find($report['created_by']);
    
    // Get all photos associated with this report
    $photoRepo = new PhotoRepository();
    $photos = $photoRepo->getByReport($reportId);
    
    // Get comments/notes if implemented
    $commentRepo = new CommentRepository();
    $comments = $commentRepo->getByEntity('report', $reportId);
    
    // Get GPS accuracy info
    if (!empty($report['gps_latitude']) && !empty($report['gps_longitude'])) {
        $report['location'] = [
            'latitude' => $report['gps_latitude'],
            'longitude' => $report['gps_longitude'],
            'accuracy_meters' => $report['gps_accuracy'] ?? null,
            'validated' => (bool)$report['gps_validated'],
            'validation_message' => $report['gps_validated'] ? 'Coordinates validated against project site' : 'Coordinates not validated'
        ];
    }
    
    // Prepare response with enriched data
    $responseReport = [
        'id' => $report['id'],
        'project_id' => $report['project_id'],
        'project' => $report['project'],
        'report_type' => $report['report_type'],
        'title' => $report['title'],
        'description' => $report['description'],
        'status' => $report['status'],
        'weather' => $report['weather'] ?? null,
        'site_condition' => $report['site_condition'] ?? null,
        'location' => $report['location'] ?? null,
        'created_by' => $report['created_by'],
        'created_by_user' => $report['created_by_user'],
        'created_at' => $report['created_at'],
        'photo_count' => count($photos)
    ];
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'report' => $responseReport,
        'photos' => $photos,
        'comments' => $comments
    ]);
    
} catch (Exception $e) {
    error_log("Modal report preview API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
