<?php
/**
 * PUT /api/v1/projects/:id/status
 * Update project status
 * 
 * @requires Authentication, projects.edit permission
 * @param int id Project ID
 * @request JSON
 *   - status: string (active, on-hold, completed, cancelled)
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
    
    // Validate status
    if (empty($input['status'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Status is required']);
        exit;
    }
    
    $validStatuses = ['active', 'on-hold', 'completed', 'cancelled'];
    if (!in_array($input['status'], $validStatuses)) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid status',
            'valid_statuses' => $validStatuses
        ]);
        exit;
    }
    
    // Get project repository
    $projectRepo = new ProjectRepository();
    $project = $projectRepo->find($projectId);
    
    if (!$project) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Project not found']);
        exit;
    }
    
    // Update status
    $updated = $projectRepo->update($projectId, [
        'status' => $input['status'],
        'updated_at' => date(DATETIME_FORMAT)
    ]);
    
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
        'action' => 'project_status_changed',
        'entity_type' => 'project',
        'entity_id' => $projectId,
        'details' => json_encode([
            'old_status' => $project['status'],
            'new_status' => $input['status']
        ]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    // Get updated project
    $updatedProject = $projectRepo->find($projectId);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'project' => $updatedProject,
        'message' => 'Project status updated successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Update project status API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred'
    ]);
}
