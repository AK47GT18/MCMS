<?php
/**
 * DELETE /api/v1/projects/:id
 * Delete/archive project
 * 
 * @requires Authentication, projects.delete permission
 * @param int id Project ID
 * @response JSON
 *   - success: boolean
 *   - message: string
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Check authorization
    Authorization::require('projects.delete');
    
    // Get project ID
    $projectId = (int)($_GET['id'] ?? 0);
    if (!$projectId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Project ID required']);
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
    
    // Soft delete - archive the project
    $deleted = $projectRepo->update($projectId, [
        'status' => 'archived',
        'deleted_at' => date(DATETIME_FORMAT)
    ]);
    
    if (!$deleted) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to delete project']);
        exit;
    }
    
    // Log action
    $auditLog = new AuditLog();
    $currentUser = Authentication::user();
    $auditLog->create([
        'user_id' => $currentUser['id'],
        'action' => 'project_deleted',
        'entity_type' => 'project',
        'entity_id' => $projectId,
        'details' => json_encode(['project_name' => $project['project_name']]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Project deleted successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Delete project API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred'
    ]);
}
