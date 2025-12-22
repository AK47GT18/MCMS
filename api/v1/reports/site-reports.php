<?php
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
    if (!empty($_GET['project_id'])) $filters['project_id'] = $_GET['project_id'];
    if (!empty($_GET['report_type'])) $filters['report_type'] = $_GET['report_type'];
    if (!empty($_GET['gps_validated'])) $filters['gps_validated'] = 1;
    
    $reportRepo = new ReportRepository();
    $result = $reportRepo->getAll($filters, $page, $perPage);
    
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
