<?php
/**
 * GET /api/v1/projects/:id/tasks
 * Get all tasks for a project with optional filtering
 * 
 * @requires Authentication, projects.view permission
 * @param int id Project ID
 * @query int page (optional, default: 1)
 * @query int per_page (optional, default: 20)
 * @query string status (optional: pending, in_progress, completed, blocked)
 * @query string assigned_to (optional: user ID)
 * @query string priority (optional: low, medium, high, critical)
 * 
 * @response JSON
 *   - success: boolean
 *   - data: array
 *   - pagination: object
 *   - summary: object (count by status)
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
    
    $projectId = (int)($_GET['id'] ?? 0);
    if (!$projectId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Project ID required']);
        exit;
    }
    
    $projectRepo = new ProjectRepository();
    $project = $projectRepo->find($projectId);
    
    if (!$project) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Project not found']);
        exit;
    }
    
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 20;
    
    $filters = ['project_id' => $projectId];
    if (!empty($_GET['status'])) $filters['status'] = $_GET['status'];
    if (!empty($_GET['assigned_to'])) $filters['assigned_to'] = (int)$_GET['assigned_to'];
    if (!empty($_GET['priority'])) $filters['priority'] = $_GET['priority'];
    
    $taskRepo = new TaskRepository();
    $result = $taskRepo->getAll($filters, $page, $perPage);
    
    // Enrich tasks with assigned user information
    $userRepo = new UserRepository();
    foreach ($result['data'] as &$task) {
        if ($task['assigned_to']) {
            $task['assigned_user'] = $userRepo->find($task['assigned_to']);
        }
    }
    
    // Get summary by status
    $summary = $taskRepo->getSummaryByStatus($projectId);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $result['data'],
        'pagination' => [
            'page' => $result['page'],
            'per_page' => $result['per_page'],
            'total' => $result['total'],
            'total_pages' => $result['total_pages']
        ],
        'summary' => $summary
    ]);
    
} catch (Exception $e) {
    error_log("Get project tasks API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
