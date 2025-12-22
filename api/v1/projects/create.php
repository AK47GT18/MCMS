<?php
/**
 * POST /api/v1/projects
 * Create new project
 * 
 * @requires Authentication, projects.create permission
 * @request JSON
 *   - project_name: string (required)
 *   - client_name: string (required)
 *   - location: string (required)
 *   - description: string (optional)
 *   - start_date: date (required, YYYY-MM-DD)
 *   - end_date: date (required, YYYY-MM-DD)
 *   - contract_value: float (optional)
 *   - assigned_to: int (optional, user ID)
 *   - status: string (optional, default: active)
 * 
 * @response JSON
 *   - success: boolean
 *   - project: object (created project)
 *   - message: string
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Check authorization
    Authorization::require('projects.create');
    
    // Get input
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    // Validate
    $validator = new Validator();
    if (!$validator->validate($input, [
        'project_name' => 'required|min:3',
        'client_name' => 'required|min:2',
        'location' => 'required|min:2',
        'start_date' => 'required',
        'end_date' => 'required'
    ])) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ]);
        exit;
    }
    
    // Validate date logic
    if (strtotime($input['start_date']) > strtotime($input['end_date'])) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'errors' => ['end_date' => 'End date must be after start date']
        ]);
        exit;
    }
    
    // Create project
    $projectService = new ProjectService();
    $project = $projectService->createProject($input);
    
    // Log action
    $auditLog = new AuditLog();
    $currentUser = Authentication::user();
    $auditLog->create([
        'user_id' => $currentUser['id'],
        'action' => 'project_created',
        'entity_type' => 'project',
        'entity_id' => $project['id'],
        'details' => json_encode([
            'project_name' => $project['project_name'],
            'client_name' => $project['client_name']
        ]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'project' => $project,
        'message' => 'Project created successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Create project API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred',
        'message' => $e->getMessage()
    ]);
}
