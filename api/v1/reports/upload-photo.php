<?php
/**
 * POST /api/v1/reports/:id/upload-photo
 * Upload photo(s) to a site report
 * 
 * @requires Authentication, site_reports.create permission
 * @param int id Report ID
 * @request multipart/form-data
 *   - photos: file array (required, max 5 files)
 *   - photo_description: string array (optional)
 *   - photo_tags: string array (optional)
 * 
 * @response JSON
 *   - success: boolean
 *   - photos: array (uploaded photo objects)
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
    
    $reportId = (int)($_GET['id'] ?? 0);
    if (!$reportId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Report ID required']);
        exit;
    }
    
    $reportRepo = new ReportRepository();
    $report = $reportRepo->find($reportId);
    
    if (!$report) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Report not found']);
        exit;
    }
    
    // Check if user is the report creator or admin
    $user = Authentication::user();
    if ($report['created_by'] !== $user['id'] && !Authorization::has('site_reports.manage')) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'You do not have permission to upload photos for this report']);
        exit;
    }
    
    if (empty($_FILES['photos'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'At least one photo is required']);
        exit;
    }
    
    $uploadedPhotos = [];
    $photoCount = is_array($_FILES['photos']['name']) ? count($_FILES['photos']['name']) : 1;
    
    if ($photoCount > 5) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'Maximum 5 photos allowed per report']);
        exit;
    }
    
    $uploadDir = __DIR__ . '/../../../public/uploads/reports/' . $reportId . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    for ($i = 0; $i < $photoCount; $i++) {
        $file = [
            'name' => $_FILES['photos']['name'][$i],
            'type' => $_FILES['photos']['type'][$i],
            'tmp_name' => $_FILES['photos']['tmp_name'][$i],
            'error' => $_FILES['photos']['error'][$i],
            'size' => $_FILES['photos']['size'][$i]
        ];
        
        // Validate file
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'File upload error: ' . $file['error']]);
            exit;
        }
        
        // Check file size (max 5MB per photo)
        if ($file['size'] > 5 * 1024 * 1024) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Photo must be smaller than 5MB']);
            exit;
        }
        
        // Check MIME type
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($file['type'], $allowedMimes)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Only JPEG, PNG, and WebP images are allowed']);
            exit;
        }
        
        // Generate safe filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('report_' . $reportId . '_') . '.' . strtolower($extension);
        $filepath = $uploadDir . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save photo']);
            exit;
        }
        
        // Save photo metadata to database
        $photoData = [
            'report_id' => $reportId,
            'file_path' => '/uploads/reports/' . $reportId . '/' . $filename,
            'file_name' => $file['name'],
            'file_size' => $file['size'],
            'mime_type' => $file['type'],
            'uploaded_by' => $user['id'],
            'uploaded_at' => date('Y-m-d H:i:s'),
            'description' => $_POST['photo_description'][$i] ?? null,
            'tags' => $_POST['photo_tags'][$i] ?? null
        ];
        
        // Create database record for photo
        $db = Database::getInstance();
        $photoRepo = new PhotoRepository();
        $photoId = $photoRepo->create($photoData);
        
        $uploadedPhotos[] = [
            'id' => $photoId,
            'file_path' => $photoData['file_path'],
            'description' => $photoData['description'],
            'tags' => $photoData['tags'],
            'uploaded_at' => $photoData['uploaded_at']
        ];
    }
    
    $auditLog = new AuditLog();
    $auditLog->create([
        'user_id' => $user['id'],
        'action' => 'report_photos_uploaded',
        'entity_type' => 'report',
        'entity_id' => $reportId,
        'details' => json_encode(['photo_count' => count($uploadedPhotos)]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'photos' => $uploadedPhotos,
        'message' => count($uploadedPhotos) . ' photo(s) uploaded successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Upload photo API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
