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
    if (empty($_GET['id'])) {
        throw new ValidationException(['id' => 'Project ID is required']);
    }
    
    Authorization::require('projects.view');
    
    $projectRepo = new ProjectRepository();
    $project = $projectRepo->findById($_GET['id']);
    
    if (!$project) {
        throw NotFoundException::project($_GET['id']);
    }
    
    // Get budget utilization
    $utilization = $projectRepo->getBudgetUtilization($_GET['id']);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'project' => $project,
        'budget_utilization' => $utilization
    ]);
    
} catch (Exception $e) {
    error_log("Modal project details API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}

