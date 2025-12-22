<?php
/**
 * PUT /api/v1/projects/:id
 * Update project
 * 
 * @requires Authentication, projects.edit permission
 * @param int id Project ID
 * @request JSON
 *   - project_name: string (optional)
 *   - client_name: string (optional)
 *   - location: string (optional)
 *   - description: string (optional)
 *   - start_date: date (optional)
 *   - end_date: date (optional)
 *   - contract_value: float (optional)
 *   - assigned_to: int (optional)
 * 
 * @response JSON
 *   - success: boolean
 *   - project: object (updated project)
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Check authorization
    Authorization::require('projects.edit');
    
    // Get project ID
    $projectId = (int)($_GET['id'] ?? 0);
    if (!$projectId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Project ID required']);
        exit;
    }
    
    // Get input
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    // Get project repository
    $projectRepo = new ProjectRepository();
    $project = $projectRepo->find($projectId);
    
    if (!$project) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Project not found']);
        exit;
    }
    
    // Validate dates if both provided
    if (isset($input['start_date']) && isset($input['end_date'])) {
        if (strtotime($input['start_date']) > strtotime($input['end_date'])) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'errors' => ['end_date' => 'End date must be after start date']
            ]);
            exit;
        }
    }
    
    // Update project
    $updated = $projectRepo->update($projectId, $input);
    
    if (!$updated) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update project']);
        exit;
    }
    
    // Log action
    $auditLog = new AuditLog();
    $currentUser = Authentication::user();
    $auditLog->create([
        'user_id' => $currentUser['id'],
        'action' => 'project_updated',
        'entity_type' => 'project',
        'entity_id' => $projectId,
        'details' => json_encode(array_keys($input)),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    // Get updated project
    $updatedProject = $projectRepo->find($projectId);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'project' => $updatedProject,
        'message' => 'Project updated successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Update project API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred'
    ]);
}
