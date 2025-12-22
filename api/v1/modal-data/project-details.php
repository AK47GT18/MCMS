<?php
/**
 * GET /api/v1/modal-data/project-details
 * Get detailed project information for modal display
 * 
 * @requires Authentication, projects.view permission
 * @query int id Project ID (required)
 * 
 * @response JSON
 *   - success: boolean
 *   - project: object (full project details)
 *   - budget_utilization: object
 *   - progress: object
 *   - team_count: int
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
    Authorization::require('projects.view');
    
    if (empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Project ID is required']);
        exit;
    }
    
    $projectId = (int)$_GET['id'];
    $projectRepo = new ProjectRepository();
    $project = $projectRepo->find($projectId);
    
    if (!$project) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Project not found']);
        exit;
    }
    
    // Get budget utilization
    $budgetUtilization = $projectRepo->getBudgetUtilization($projectId);
    
    // Get project progress
    $progress = $projectRepo->getProgress($projectId);
    
    // Get team members count
    $teamCount = $projectRepo->getTeamCount($projectId);
    
    // Get recent activities
    $recentActivities = $projectRepo->getRecentActivities($projectId, 5);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'project' => $project,
        'budget_utilization' => $budgetUtilization,
        'progress' => $progress,
        'team_count' => $teamCount,
        'recent_activities' => $recentActivities
    ]);
    
} catch (Exception $e) {
    error_log("Modal project details API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}

