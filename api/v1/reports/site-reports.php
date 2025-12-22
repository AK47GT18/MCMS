<?php
/**
 * GET /api/v1/reports/site-reports
 * Get all site reports with filters
 * 
 * @requires Authentication, site_reports.view permission
 * @query int page (optional, default: 1)
 * @query int per_page (optional, default: 20)
 * @query int project_id (optional)
 * @query string report_type (optional)
 * @query boolean gps_validated (optional)
 * @query date date_from (optional)
 * @query date date_to (optional)
 * 
 * @response JSON
 *   - success: boolean
 *   - data: array
 *   - pagination: object
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
    
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 20;
    
    $filters = [];
    if (!empty($_GET['project_id'])) $filters['project_id'] = (int)$_GET['project_id'];
    if (!empty($_GET['report_type'])) $filters['report_type'] = $_GET['report_type'];
    if (!empty($_GET['gps_validated'])) $filters['gps_validated'] = 1;
    if (!empty($_GET['date_from'])) $filters['date_from'] = $_GET['date_from'];
    if (!empty($_GET['date_to'])) $filters['date_to'] = $_GET['date_to'];
    
    // Role-based filtering
    $user = Authentication::user();
    if ($user['role'] === 'field_supervisor') {
        $filters['created_by'] = $user['id'];
    } elseif ($user['role'] === 'project_manager') {
        $filters['assigned_to_manager'] = $user['id'];
    }
    
    $reportRepo = new ReportRepository();
    $result = $reportRepo->getAll($filters, $page, $perPage);
    
    // Enrich with project details
    $projectRepo = new ProjectRepository();
    foreach ($result['data'] as &$report) {
        $project = $projectRepo->find($report['project_id']);
        $report['project'] = $project;
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $result['data'],
        'pagination' => [
            'page' => $result['page'],
            'per_page' => $result['per_page'],
            'total' => $result['total'],
            'total_pages' => $result['total_pages']
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Site reports API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
