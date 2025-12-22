<?php
/**
 * POST /api/v1/reports/create
 * Create a new site report
 * 
 * @requires Authentication, site_reports.create permission
 * @request JSON
 *   - project_id: int (required)
 *   - report_type: string (daily, progress, incident, compliance, required)
 *   - title: string (required)
 *   - description: string (required)
 *   - weather: string (sunny, cloudy, rainy, stormy, optional)
 *   - site_condition: string (good, needs_attention, critical, optional)
 *   - gps_latitude: float (optional)
 *   - gps_longitude: float (optional)
 *   - gps_accuracy: float (optional)
 * 
 * @response JSON
 *   - success: boolean
 *   - report: object
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
    Authorization::require('site_reports.create');
    
    $csrfMiddleware = new CsrfMiddleware();
    $csrfMiddleware->handle();
    
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    $validator = new Validator();
    if (!$validator->validate($input, [
        'project_id' => 'required|numeric',
        'report_type' => 'required|in:daily,progress,incident,compliance',
        'title' => 'required|min:3|max:255',
        'description' => 'required|min:10',
        'weather' => 'in:sunny,cloudy,rainy,stormy',
        'site_condition' => 'in:good,needs_attention,critical',
        'gps_latitude' => 'numeric',
        'gps_longitude' => 'numeric',
        'gps_accuracy' => 'numeric'
    ])) {
        http_response_code(422);
        echo json_encode(['success' => false, 'errors' => $validator->errors()]);
        exit;
    }
    
    $projectRepo = new ProjectRepository();
    $project = $projectRepo->find($input['project_id']);
    
    if (!$project) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Project not found']);
        exit;
    }
    
    $user = Authentication::user();
    
    // Validate GPS if provided
    $gpsValidated = false;
    if (!empty($input['gps_latitude']) && !empty($input['gps_longitude'])) {
        // Check if coordinates are within project site boundaries
        if (isset($project['site_latitude']) && isset($project['site_longitude'])) {
            // Allow 500m radius from project site
            $gpsValidated = GpsValidator::validate(
                $input['gps_latitude'],
                $input['gps_longitude'],
                $project['site_latitude'],
                $project['site_longitude'],
                500
            );
        } else {
            $gpsValidated = true; // No project boundaries, assume valid
        }
    }
    
    $reportData = [
        'project_id' => $input['project_id'],
        'report_type' => $input['report_type'],
        'title' => $input['title'],
        'description' => $input['description'],
        'created_by' => $user['id'],
        'created_at' => date('Y-m-d H:i:s'),
        'gps_validated' => $gpsValidated,
        'status' => 'pending'
    ];
    
    if (!empty($input['weather'])) $reportData['weather'] = $input['weather'];
    if (!empty($input['site_condition'])) $reportData['site_condition'] = $input['site_condition'];
    if (!empty($input['gps_latitude'])) $reportData['gps_latitude'] = $input['gps_latitude'];
    if (!empty($input['gps_longitude'])) $reportData['gps_longitude'] = $input['gps_longitude'];
    if (!empty($input['gps_accuracy'])) $reportData['gps_accuracy'] = $input['gps_accuracy'];
    
    $reportRepo = new ReportRepository();
    $reportId = $reportRepo->create($reportData);
    $report = $reportRepo->find($reportId);
    
    $auditLog = new AuditLog();
    $auditLog->create([
        'user_id' => $user['id'],
        'action' => 'report_created',
        'entity_type' => 'report',
        'entity_id' => $reportId,
        'details' => json_encode(['project_id' => $input['project_id'], 'type' => $input['report_type']]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    // Notify project manager
    $projectManager = $projectRepo->getManager($input['project_id']);
    if ($projectManager) {
        $notificationService = new NotificationService();
        $notificationService->create([
            'user_id' => $projectManager['id'],
            'type' => 'report_created',
            'title' => 'New Site Report',
            'message' => $user['name'] . ' submitted a ' . $input['report_type'] . ' report for ' . $project['name'],
            'related_entity' => 'report',
            'related_entity_id' => $reportId
        ]);
    }
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'report' => $report,
        'message' => 'Site report created successfully'
    ]);
    
} catch (ValidationException $e) {
    http_response_code(422);
    echo json_encode($e->toJson());
    
} catch (Exception $e) {
    error_log("Create site report API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}