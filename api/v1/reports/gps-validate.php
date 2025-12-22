<?php
/**
 * POST /api/v1/reports/gps-validate
 * Validate GPS coordinates for site report
 * 
 * @requires Authentication, site_reports.create permission
 * @request JSON
 *   - latitude: float (required)
 *   - longitude: float (required)
 *   - project_id: int (optional - if provided, validates against project boundaries)
 *   - radius: int (optional - default: 500m)
 * 
 * @response JSON
 *   - success: boolean
 *   - valid: boolean
 *   - within_boundaries: boolean (if project_id provided)
 *   - message: string
 *   - distance_meters: float (if project_id provided)
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
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $validator = new Validator();
    if (!$validator->validate($input, [
        'latitude' => 'required|numeric',
        'longitude' => 'required|numeric',
        'project_id' => 'numeric',
        'radius' => 'numeric'
    ])) {
        http_response_code(422);
        echo json_encode(['success' => false, 'errors' => $validator->errors()]);
        exit;
    }
    
    $latitude = (float)$input['latitude'];
    $longitude = (float)$input['longitude'];
    $radius = !empty($input['radius']) ? (int)$input['radius'] : 500;
    
    // Validate Malawi country coordinates
    $gpsService = new GpsService();
    $validMalawi = $gpsService->validateMalawiCoordinates($latitude, $longitude);
    
    if (!$validMalawi) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'valid' => false,
            'message' => 'GPS coordinates are outside Malawi boundaries'
        ]);
        exit;
    }
    
    $response = [
        'success' => true,
        'valid' => true,
        'message' => 'GPS coordinates are valid'
    ];
    
    // If project_id provided, validate against project site boundaries
    if (!empty($input['project_id'])) {
        $projectRepo = new ProjectRepository();
        $project = $projectRepo->find($input['project_id']);
        
        if ($project && isset($project['site_latitude']) && isset($project['site_longitude'])) {
            $distance = GpsValidator::calculateDistance(
                $latitude,
                $longitude,
                $project['site_latitude'],
                $project['site_longitude']
            );
            
            $withinBoundaries = $distance <= $radius;
            
            $response['within_boundaries'] = $withinBoundaries;
            $response['distance_meters'] = round($distance, 2);
            $response['project_name'] = $project['name'];
            
            if (!$withinBoundaries) {
                $response['message'] = 'GPS coordinates are outside project site boundaries (within ' . $radius . 'm)';
            } else {
                $response['message'] = 'GPS coordinates are within project site boundaries';
            }
        } else {
            $response['message'] = 'Project not found or site coordinates not set';
        }
    }
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("GPS validate API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
